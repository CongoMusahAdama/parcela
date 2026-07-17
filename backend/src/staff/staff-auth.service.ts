import { createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionRevocationService } from '../common/services/session-revocation.service';
import { ensureHashedSecret, verifySecret } from '../common/utils/password.util';
import {
  LOCAL_DEV_HQ_PASSWORD,
  LOCAL_DEV_LEAD_PIN,
  useLocalDevCredentials,
} from '../common/utils/temp-password.util';
import {
  DEMO_STAFF_ACCOUNT_IDS,
  type StaffAccountRecord,
} from './data/staff-accounts';
import { normalizeGhanaPhone } from '../common/utils/phone.util';
import {
  TransportOperator,
  TransportOperatorDocument,
} from '../platform/schemas/transport-operator.schema';
import { StaffAccount, StaffAccountDocument } from './schemas/staff-account.schema';

export type LoginOperatorBrand = {
  found: boolean;
  operatorCode?: string;
  operatorName?: string;
  brandColor?: string;
  logoDataUrl?: string | null;
  stationName?: string | null;
};

export function toPublicAccount(account: StaffAccountRecord): StaffPublicAccount {
  const { password: _password, pin: _pin, ...staff } = account;
  return staff;
}

export type StaffTokenPayload = {
  sub: string;
  stationId: string;
  iat: number;
  exp: number;
};

export type StaffPublicAccount = Omit<StaffAccountRecord, 'password' | 'pin'>;

type ActiveStaffSession = {
  accountId: string;
  signedInAt: string;
};

export type StaffPresence = {
  online: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
};

@Injectable()
export class StaffAuthService implements OnModuleInit {
  private readonly logger = new Logger(StaffAuthService.name);
  private readonly accounts: StaffAccountRecord[] = [];
  private readonly activeStaffSessions = new Map<string, ActiveStaffSession>();

  constructor(
    private readonly config: ConfigService,
    private readonly sessionRevocation: SessionRevocationService,
    @InjectModel(StaffAccount.name) private readonly staffModel: Model<StaffAccountDocument>,
    @InjectModel(TransportOperator.name)
    private readonly operatorModel: Model<TransportOperatorDocument>,
  ) {}

  async onModuleInit() {
    await this.purgeDemoStaffAccounts();
    const docs = await this.staffModel.find().lean();
    for (const doc of docs) {
      this.accounts.push(this.fromDocument(doc));
    }
    this.logger.log(`Loaded ${this.accounts.length} staff account(s) from database`);
  }

  getAccounts(): StaffAccountRecord[] {
    return this.accounts;
  }

  findAccountById(id: string): StaffAccountRecord | undefined {
    return this.accounts.find((account) => account.id === id);
  }

  addAccount(record: StaffAccountRecord): StaffPublicAccount {
    const secured: StaffAccountRecord = {
      ...record,
      password: ensureHashedSecret(record.password),
      pin: ensureHashedSecret(record.pin),
    };
    this.accounts.push(secured);
    void this.persistAccount(secured);
    return toPublicAccount(secured);
  }

  saveAccount(record: StaffAccountRecord) {
    void this.persistAccount(record);
  }

  removeAccount(accountId: string): boolean {
    const index = this.accounts.findIndex((account) => account.id === accountId);
    if (index === -1) return false;
    this.invalidateAccountTokens(accountId);
    this.accounts.splice(index, 1);
    this.activeStaffSessions.delete(accountId);
    void this.deleteAccount(accountId);
    return true;
  }

  removeAccountsByOperator(operatorCode: string): number {
    const code = operatorCode.trim().toUpperCase();
    const accountIds = this.accounts
      .filter((account) => account.operator.trim().toUpperCase() === code)
      .map((account) => account.id);
    for (const accountId of accountIds) {
      this.removeAccount(accountId);
    }
    return accountIds.length;
  }

  private get secret() {
    const secret = this.config.get<string>('staff.tokenSecret')?.trim() ?? '';
    if (!secret || secret === 'parcela-staff-dev-secret') {
      throw new Error(
        'STAFF_TOKEN_SECRET must be set to a strong unique value (do not use parcela-staff-dev-secret)',
      );
    }
    if (secret.length < 32) {
      throw new Error('STAFF_TOKEN_SECRET must be at least 32 characters');
    }
    return secret;
  }

  private get tokenTtlMs() {
    return this.config.get<number>('staff.tokenTtlMs') ?? 8 * 60 * 60 * 1000;
  }

  /** Staff + lead stay signed in until they log out manually. */
  private get persistentTokenTtlMs() {
    return 10 * 365 * 24 * 60 * 60 * 1000;
  }

  private isPersistentStaffRole(role: StaffAccountRecord['role']) {
    return role === 'station_staff' || role === 'station_lead';
  }

  getTokenTtlMs() {
    return this.tokenTtlMs;
  }

  getLoginCookieTtlMs(role: StaffAccountRecord['role']) {
    return this.isPersistentStaffRole(role) ? this.persistentTokenTtlMs : this.tokenTtlMs;
  }

  invalidateAccountTokens(accountId: string) {
    const account = this.findAccountById(accountId);
    if (!account) return;
    account.tokensValidAfterMs = Date.now();
    void this.persistAccount(account);
  }

  login(phone: string, password: string) {
    const normalizedPhone = normalizeGhanaPhone(phone);
    const match = this.accounts.find(
      (account) =>
        account.active &&
        account.role === 'station_staff' &&
        normalizeGhanaPhone(account.phone) === normalizedPhone,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const passwordMatches = verifySecret(password, match.password);
    const devFirstLogin =
      useLocalDevCredentials() &&
      password.trim() === LOCAL_DEV_HQ_PASSWORD &&
      match.mustChangePassword;

    if (!passwordMatches && !devFirstLogin) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (devFirstLogin && !passwordMatches) {
      match.password = ensureHashedSecret(LOCAL_DEV_HQ_PASSWORD);
      void this.persistAccount(match);
    }

    const staff = toPublicAccount(match);
    const token = this.signToken(
      { sub: staff.id, stationId: staff.stationId },
      this.persistentTokenTtlMs,
    );
    this.recordStaffLogin(staff.id);
    return {
      token,
      staff,
      signedInAt: new Date().toISOString(),
    };
  }

  loginAdmin(phone: string, password: string) {
    const normalizedPhone = normalizeGhanaPhone(phone);
    const match = this.accounts.find(
      (account) =>
        account.active &&
        account.role === 'operator_admin' &&
        normalizeGhanaPhone(account.phone) === normalizedPhone,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const passwordMatches = verifySecret(password, match.password);
    const devFirstLogin =
      useLocalDevCredentials() &&
      password.trim() === LOCAL_DEV_HQ_PASSWORD &&
      match.mustChangePassword;

    if (!passwordMatches && !devFirstLogin) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (devFirstLogin && !passwordMatches) {
      match.password = ensureHashedSecret(LOCAL_DEV_HQ_PASSWORD);
      void this.persistAccount(match);
    }

    const staff = toPublicAccount(match);
    const token = this.signToken({ sub: staff.id, stationId: staff.stationId });
    return {
      token,
      staff,
      signedInAt: new Date().toISOString(),
    };
  }

  loginByPhonePin(phone: string, pin: string) {
    const normalizedPhone = normalizeGhanaPhone(phone);
    const trimmedPin = pin.trim();
    const match = this.accounts.find(
      (account) =>
        account.role === 'station_lead' &&
        account.active &&
        normalizeGhanaPhone(account.phone) === normalizedPhone,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid phone or PIN');
    }

    const pinMatches = verifySecret(trimmedPin, match.pin);
    const devFirstLogin =
      useLocalDevCredentials() &&
      trimmedPin === LOCAL_DEV_LEAD_PIN &&
      match.mustChangePassword;

    if (!pinMatches && !devFirstLogin) {
      throw new UnauthorizedException('Invalid phone or PIN');
    }

    if (devFirstLogin && !pinMatches) {
      match.pin = ensureHashedSecret(LOCAL_DEV_LEAD_PIN);
      void this.persistAccount(match);
    }

    const staff = toPublicAccount(match);
    const token = this.signToken(
      { sub: staff.id, stationId: staff.stationId },
      this.persistentTokenTtlMs,
    );
    return {
      token,
      staff,
      signedInAt: new Date().toISOString(),
    };
  }

  verifyToken(token: string): StaffTokenPayload & { staff: StaffPublicAccount } {
    const payload = this.parseToken(token);
    const staff = this.accounts.find((account) => account.id === payload.sub);
    if (!staff || staff.stationId !== payload.stationId || !staff.active) {
      throw new UnauthorizedException('Invalid staff session');
    }

    if (staff.role === 'station_staff') {
      this.touchStaffSession(staff.id, payload.iat);
    }

    return { ...payload, staff: toPublicAccount(staff) };
  }

  clearAllActiveSessions() {
    this.activeStaffSessions.clear();
  }

  recordStaffLogout(accountId: string) {
    this.activeStaffSessions.delete(accountId);
    const account = this.findAccountById(accountId);
    if (!account || account.role !== 'station_staff') return;

    account.lastLogoutAt = new Date().toISOString();
    void this.persistAccount(account);
  }

  getStaffPresence(accountId: string): StaffPresence {
    const account = this.findAccountById(accountId);
    return {
      online: this.activeStaffSessions.has(accountId),
      lastLoginAt: account?.lastLoginAt ?? null,
      lastLogoutAt: account?.lastLogoutAt ?? null,
    };
  }

  private recordStaffLogin(accountId: string) {
    const account = this.findAccountById(accountId);
    if (!account || account.role !== 'station_staff') return;

    const signedInAt = new Date().toISOString();
    this.activeStaffSessions.set(accountId, { accountId, signedInAt });
    account.lastLoginAt = signedInAt;
    void this.persistAccount(account);
  }

  private touchStaffSession(accountId: string, tokenIat: number) {
    if (!this.activeStaffSessions.has(accountId)) {
      this.activeStaffSessions.set(accountId, {
        accountId,
        signedInAt: new Date(tokenIat).toISOString(),
      });
    }
  }

  changePasswordForAccount(
    accountId: string,
    currentPassword: string,
    newPassword: string,
  ): StaffPublicAccount {
    const match = this.accounts.find(
      (account) =>
        account.id === accountId &&
        account.active &&
        (account.role === 'station_staff' || account.role === 'operator_admin'),
    );

    if (!match || !verifySecret(currentPassword, match.password)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (verifySecret(newPassword, match.password)) {
      throw new BadRequestException('Choose a password different from your current one');
    }

    if (newPassword.trim().length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    match.password = ensureHashedSecret(newPassword);
    match.mustChangePassword = false;
    this.invalidateAccountTokens(match.id);
    void this.persistAccount(match);
    return toPublicAccount(match);
  }

  changePinForAccount(accountId: string, currentPin: string, newPin: string): StaffPublicAccount {
    const match = this.accounts.find(
      (account) =>
        account.id === accountId && account.active && account.role === 'station_lead',
    );

    if (!match || !verifySecret(currentPin.trim(), match.pin)) {
      throw new UnauthorizedException('Current PIN is incorrect');
    }

    const trimmedNewPin = newPin.trim();
    if (trimmedNewPin.length < 4) {
      throw new BadRequestException('PIN must be at least 4 characters');
    }

    if (verifySecret(trimmedNewPin, match.pin)) {
      throw new BadRequestException('Choose a PIN different from your current one');
    }

    match.pin = ensureHashedSecret(trimmedNewPin);
    match.mustChangePassword = false;
    this.invalidateAccountTokens(match.id);
    void this.persistAccount(match);
    return toPublicAccount(match);
  }

  updatePasswordForAccount(accountId: string, newPassword: string, requireChange = false) {
    const match = this.accounts.find((account) => account.id === accountId);
    if (!match) {
      throw new UnauthorizedException('Staff account not found');
    }
    match.password = ensureHashedSecret(newPassword);
    match.mustChangePassword = requireChange;
    this.invalidateAccountTokens(accountId);
    void this.persistAccount(match);
    return toPublicAccount(match);
  }

  private async purgeDemoStaffAccounts() {
    const result = await this.staffModel.deleteMany({
      accountId: { $in: DEMO_STAFF_ACCOUNT_IDS },
    });
    if (result.deletedCount > 0) {
      this.logger.log(`Removed ${result.deletedCount} demo staff account(s) from database`);
    }
  }

  private fromDocument(doc: StaffAccount & { _id?: unknown }): StaffAccountRecord {
    return {
      id: doc.accountId,
      displayName: doc.displayName,
      email: doc.email,
      phone: doc.phone,
      password: doc.password,
      pin: doc.pin,
      active: doc.active,
      role: doc.role,
      operator: doc.operator,
      stationId: doc.stationId,
      stationName: doc.stationName,
      stationCode: doc.stationCode,
      location: doc.location,
      mustChangePassword: doc.mustChangePassword,
      lastLoginAt: doc.lastLoginAt?.toISOString(),
      lastLogoutAt: doc.lastLogoutAt?.toISOString(),
      tokensValidAfterMs: doc.tokensValidAfterMs ?? 0,
    };
  }

  private toDocumentFields(record: StaffAccountRecord) {
    return {
      accountId: record.id,
      displayName: record.displayName,
      email: record.email.toLowerCase(),
      phone: record.phone,
      password: record.password,
      pin: record.pin,
      active: record.active,
      role: record.role,
      operator: record.operator,
      stationId: record.stationId,
      stationName: record.stationName,
      stationCode: record.stationCode,
      location: record.location,
      mustChangePassword: record.mustChangePassword ?? false,
      tokensValidAfterMs: record.tokensValidAfterMs ?? 0,
      ...(record.lastLoginAt ? { lastLoginAt: new Date(record.lastLoginAt) } : {}),
      ...(record.lastLogoutAt ? { lastLogoutAt: new Date(record.lastLogoutAt) } : {}),
    };
  }

  private async persistAccount(record: StaffAccountRecord) {
    try {
      await this.staffModel.updateOne(
        { accountId: record.id },
        { $set: this.toDocumentFields(record) },
        { upsert: true },
      );
    } catch (error) {
      this.logger.error(`Failed to persist staff account ${record.id}: ${String(error)}`);
    }
  }

  private async deleteAccount(accountId: string) {
    try {
      await this.staffModel.deleteOne({ accountId });
    } catch (error) {
      this.logger.error(`Failed to delete staff account ${accountId}: ${String(error)}`);
    }
  }

  private signToken(payload: Omit<StaffTokenPayload, 'iat' | 'exp'>, ttlMs = this.tokenTtlMs) {
    const now = Date.now();
    const body: StaffTokenPayload = {
      ...payload,
      iat: now,
      exp: now + ttlMs,
    };
    const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
    const signature = createHmac('sha256', this.secret).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
  }

  private parseToken(token: string): StaffTokenPayload {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) {
      throw new UnauthorizedException('Invalid staff token');
    }

    const expected = createHmac('sha256', this.secret).update(encoded).digest('base64url');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid staff token');
    }

    let payload: StaffTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as StaffTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid staff token');
    }

    const account = this.accounts.find((entry) => entry.id === payload.sub);
    if (!account) {
      throw new UnauthorizedException('Invalid staff token');
    }

    this.sessionRevocation.assertActive(payload.iat);

    const validAfter = account.tokensValidAfterMs ?? 0;
    if (payload.iat < validAfter) {
      throw new UnauthorizedException('Session ended — sign in again');
    }

    if (!payload.exp || Date.now() > payload.exp) {
      if (!this.isPersistentStaffRole(account.role)) {
        throw new UnauthorizedException('Staff session expired');
      }
    }

    return payload;
  }

  async lookupLoginBrand(
    phone: string,
    portal: 'staff' | 'lead' | 'hq',
  ): Promise<LoginOperatorBrand> {
    const normalizedPhone = normalizeGhanaPhone(phone.trim());
    if (!normalizedPhone || normalizedPhone.replace(/\D/g, '').length < 9) {
      return { found: false };
    }

    const roleByPortal = {
      staff: 'station_staff',
      lead: 'station_lead',
      hq: 'operator_admin',
    } as const;

    const role = roleByPortal[portal];
    const account = this.accounts.find(
      (entry) =>
        entry.active &&
        entry.role === role &&
        normalizeGhanaPhone(entry.phone) === normalizedPhone,
    );

    if (!account) {
      return { found: false };
    }

    const operatorCode = account.operator.trim().toUpperCase();
    const operatorDoc = await this.operatorModel
      .findOne({ code: operatorCode })
      .select('code name brandColor logoDataUrl status suspended')
      .lean();

    if (
      operatorDoc &&
      (operatorDoc.status === 'suspended' || operatorDoc.suspended === true)
    ) {
      return { found: false };
    }

    return {
      found: true,
      operatorCode,
      operatorName: operatorDoc?.name ?? operatorCode,
      brandColor: operatorDoc?.brandColor ?? '#0D9488',
      logoDataUrl: operatorDoc?.logoDataUrl ?? null,
      stationName: portal === 'hq' ? null : account.stationName,
    };
  }
}
