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
import { ensureHashedSecret, verifySecret } from '../common/utils/password.util';
import {
  buildSeedStaffAccounts,
  type StaffAccountRecord,
} from './data/staff-accounts';
import { normalizeGhanaPhone } from '../common/utils/phone.util';
import { StaffAccount, StaffAccountDocument } from './schemas/staff-account.schema';

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
    @InjectModel(StaffAccount.name) private readonly staffModel: Model<StaffAccountDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAccounts();
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
    this.accounts.splice(index, 1);
    void this.deleteAccount(accountId);
    return true;
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

  getTokenTtlMs() {
    return this.tokenTtlMs;
  }

  login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const match = this.accounts.find(
      (account) =>
        account.active &&
        account.role === 'station_staff' &&
        account.email.toLowerCase() === normalized,
    );

    if (!match || !verifySecret(password, match.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const staff = toPublicAccount(match);
    const token = this.signToken({ sub: staff.id, stationId: staff.stationId });
    this.recordStaffLogin(staff.id);
    return {
      token,
      staff,
      signedInAt: new Date().toISOString(),
    };
  }

  loginAdmin(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const match = this.accounts.find(
      (account) =>
        account.active &&
        account.role === 'operator_admin' &&
        account.email.toLowerCase() === normalized,
    );

    if (!match || !verifySecret(password, match.password)) {
      throw new UnauthorizedException('Invalid email or password');
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

    if (!match || !verifySecret(trimmedPin, match.pin)) {
      throw new UnauthorizedException('Invalid phone or PIN');
    }

    const staff = toPublicAccount(match);
    const token = this.signToken({ sub: staff.id, stationId: staff.stationId });
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
        account.id === accountId && account.active && account.role === 'station_staff',
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
    void this.persistAccount(match);
    return toPublicAccount(match);
  }

  private async seedDefaultAccounts() {
    const staffPassword = this.config.get<string>('seed.staffPassword')?.trim() ?? '';
    const staffPin = this.config.get<string>('seed.staffPin')?.trim() ?? '';
    const leadPassword = this.config.get<string>('seed.leadPassword')?.trim() ?? '';
    const leadPin = this.config.get<string>('seed.leadPin')?.trim() ?? '';
    const adminPassword = this.config.get<string>('seed.adminPassword')?.trim() ?? '';
    const adminPin = this.config.get<string>('seed.adminPin')?.trim() ?? '';

    if (
      !staffPassword ||
      !staffPin ||
      !leadPassword ||
      !leadPin ||
      !adminPassword ||
      !adminPin
    ) {
      this.logger.warn(
        'Skipping demo account seed — set SEED_STAFF_PASSWORD, SEED_STAFF_PIN, SEED_LEAD_PASSWORD, SEED_LEAD_PIN, SEED_ADMIN_PASSWORD, and SEED_ADMIN_PIN in .env.local',
      );
      return;
    }

    const seedAccounts = buildSeedStaffAccounts({
      staffPassword,
      staffPin,
      leadPassword,
      leadPin,
      adminPassword,
      adminPin,
    });

    for (const account of seedAccounts) {
      const existing = await this.staffModel.findOne({ accountId: account.id }).lean();
      if (existing) continue;

      const secured = {
        ...this.toDocumentFields({
          ...account,
          password: ensureHashedSecret(account.password),
          pin: ensureHashedSecret(account.pin),
        }),
      };
      await this.staffModel.create(secured);
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

  private signToken(payload: Omit<StaffTokenPayload, 'iat' | 'exp'>) {
    const now = Date.now();
    const body: StaffTokenPayload = {
      ...payload,
      iat: now,
      exp: now + this.tokenTtlMs,
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

    if (!payload.exp || Date.now() > payload.exp) {
      throw new UnauthorizedException('Staff session expired');
    }

    return payload;
  }
}
