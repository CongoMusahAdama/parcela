import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isProvisionedPhone } from '../../common/utils/phone.util';
import { generateHqTemporaryPassword, generateLeadTemporaryPin, generateTemporaryPassword, shouldSkipCredentialSms } from '../../common/utils/temp-password.util';
import { SmsService } from '../../sms/sms.service';
import { StaffAuthService } from '../../staff/staff-auth.service';
import type { StaffAccountRecord } from '../../staff/data/staff-accounts';
import { UpdateHqAdminDto, UpdatePlatformUserDto } from '../dto/platform-people.dto';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformOperatorsService } from './platform-operators.service';

export type PlatformHqAdminApiRow = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  operatorCode: string;
  status: 'active' | 'pending_setup' | 'inactive';
  lastSignInAt: string | null;
};

export type PlatformUserApiRow = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: 'hq_admin' | 'branch_lead' | 'counter_staff';
  operatorCode: string;
  operatorName: string;
  stationName: string | null;
  status: 'active' | 'locked' | 'pending_setup' | 'inactive';
  lastSignInAt: string | null;
};

@Injectable()
export class PlatformPeopleService {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly operators: PlatformOperatorsService,
    private readonly audit: PlatformAuditService,
    private readonly sms: SmsService,
  ) {}

  async listHqAdmins() {
    const operatorRows = await this.operators.list();
    const operatorNames = new Map(operatorRows.map((row) => [row.code, row.name]));

    return this.staffAuth
      .getAccounts()
      .filter((account) => account.role === 'operator_admin')
      .map((account) => this.toHqAdminRow(account, operatorNames));
  }

  async updateHqAdmin(accountId: string, dto: UpdateHqAdminDto, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account || account.role !== 'operator_admin') {
      throw new NotFoundException('HQ admin not found');
    }

    if (dto.displayName) account.displayName = dto.displayName.trim();
    if (dto.email) account.email = dto.email.trim().toLowerCase();
    if (dto.phone) account.phone = dto.phone.trim();
    if (dto.status === 'inactive') {
      account.active = false;
      this.staffAuth.invalidateAccountTokens(account.id);
    }
    if (dto.status === 'active') {
      account.active = true;
      account.mustChangePassword = false;
    }
    if (dto.status === 'pending_setup') {
      account.active = true;
      account.mustChangePassword = true;
    }

    this.staffAuth.saveAccount(account);
    await this.audit.record({
      action: 'HQ admin updated',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    const operatorRows = await this.operators.list();
    const operatorNames = new Map(operatorRows.map((row) => [row.code, row.name]));
    return this.toHqAdminRow(account, operatorNames);
  }

  async issueHqCredentials(accountId: string, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account || account.role !== 'operator_admin') {
      throw new NotFoundException('HQ admin not found');
    }

    const tempPassword = generateHqTemporaryPassword();
    this.staffAuth.updatePasswordForAccount(account.id, tempPassword, true);

    await this.audit.record({
      action: 'HQ credentials issued',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    const operatorName = await this.operatorNameFor(account.operator);
    const smsSent =
      !shouldSkipCredentialSms() && isProvisionedPhone(account.phone)
        ? await this.sms.sendHqAdminCredentials({
            phone: account.phone,
            displayName: account.displayName,
            email: account.email,
            temporaryPassword: tempPassword,
            operatorName,
            reason: 'issued',
          })
        : false;

    return { ok: true, temporaryPassword: tempPassword, phone: account.phone, smsSent };
  }

  async resetHqPassword(accountId: string, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account || account.role !== 'operator_admin') {
      throw new NotFoundException('HQ admin not found');
    }

    const tempPassword = generateHqTemporaryPassword();
    this.staffAuth.updatePasswordForAccount(account.id, tempPassword, true);

    await this.audit.record({
      action: 'HQ password reset',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    const operatorName = await this.operatorNameFor(account.operator);
    const smsSent =
      !shouldSkipCredentialSms() && isProvisionedPhone(account.phone)
        ? await this.sms.sendHqAdminCredentials({
            phone: account.phone,
            displayName: account.displayName,
            email: account.email,
            temporaryPassword: tempPassword,
            operatorName,
            reason: 'reset',
          })
        : false;

    return { ok: true, temporaryPassword: tempPassword, phone: account.phone, smsSent };
  }

  async deleteHqAdmin(accountId: string, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account || account.role !== 'operator_admin') {
      throw new NotFoundException('HQ admin not found');
    }

    const removed = this.staffAuth.removeAccount(accountId);
    if (!removed) {
      throw new NotFoundException('HQ admin not found');
    }

    await this.audit.record({
      action: 'HQ admin removed',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    return {
      ok: true,
      id: account.id,
      email: account.email,
      operatorCode: account.operator,
    };
  }

  async listUsers() {
    const operatorRows = await this.operators.list();
    const operatorNames = new Map(operatorRows.map((row) => [row.code, row.name]));

    return this.staffAuth
      .getAccounts()
      .map((account) => this.toUserRow(account, operatorNames));
  }

  async updateUser(accountId: string, dto: UpdatePlatformUserDto, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account) throw new NotFoundException('User not found');

    if (dto.displayName) account.displayName = dto.displayName.trim();
    if (dto.email) account.email = dto.email.trim().toLowerCase();
    if (dto.phone) account.phone = dto.phone.trim();
    if (dto.status === 'inactive' || dto.status === 'locked') {
      account.active = false;
      this.staffAuth.invalidateAccountTokens(account.id);
    }
    if (dto.status === 'active') {
      account.active = true;
      account.mustChangePassword = false;
    }
    if (dto.status === 'pending_setup') {
      account.active = true;
      account.mustChangePassword = true;
    }

    this.staffAuth.saveAccount(account);
    await this.audit.record({
      action: 'User updated',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    const operatorRows = await this.operators.list();
    const operatorNames = new Map(operatorRows.map((row) => [row.code, row.name]));
    return this.toUserRow(account, operatorNames);
  }

  async resetUserLogin(accountId: string, actorEmail: string) {
    const account = this.staffAuth.findAccountById(accountId);
    if (!account) throw new NotFoundException('User not found');

    const tempPassword = generateTemporaryPassword();
    this.staffAuth.updatePasswordForAccount(account.id, tempPassword, true);

    await this.audit.record({
      action: 'Login reset',
      detail: `${account.displayName} (${account.email})`,
      actorEmail,
      operatorCode: account.operator,
    });

    const operatorName = await this.operatorNameFor(account.operator);
    let smsSent = false;
    if (isProvisionedPhone(account.phone)) {
      if (account.role === 'station_lead') {
        const tempPin = generateLeadTemporaryPin();
        account.pin = tempPin;
        this.staffAuth.saveAccount(account);
        smsSent =
          !shouldSkipCredentialSms() && isProvisionedPhone(account.phone)
            ? await this.sms.sendBranchLeadCredentials({
                phone: account.phone,
                displayName: account.displayName,
                temporaryPin: tempPin,
                stationName: account.stationName,
                reason: 'reset',
              })
            : false;
      } else if (account.role === 'station_staff') {
        smsSent = await this.sms.sendCounterStaffCredentials({
          phone: account.phone,
          displayName: account.displayName,
          email: account.email,
          temporaryPassword: tempPassword,
          stationName: account.stationName,
          reason: 'reset',
        });
      } else if (account.role === 'operator_admin') {
        smsSent = await this.sms.sendHqAdminCredentials({
          phone: account.phone,
          displayName: account.displayName,
          email: account.email,
          temporaryPassword: tempPassword,
          operatorName,
          reason: 'reset',
        });
      }
    }

    return { ok: true, temporaryPassword: tempPassword, phone: account.phone, smsSent };
  }

  private async operatorNameFor(code: string) {
    const rows = await this.operators.list();
    return rows.find((row) => row.code.toUpperCase() === code.toUpperCase())?.name ?? code;
  }

  private toHqAdminRow(
    account: StaffAccountRecord,
    operatorNames: Map<string, string>,
  ): PlatformHqAdminApiRow {
    void operatorNames;
    return {
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      phone: account.phone,
      operatorCode: account.operator,
      status: !account.active
        ? 'inactive'
        : account.mustChangePassword
          ? 'pending_setup'
          : 'active',
      lastSignInAt: account.lastLoginAt ?? null,
    };
  }

  private toUserRow(
    account: StaffAccountRecord,
    operatorNames: Map<string, string>,
  ): PlatformUserApiRow {
    const role =
      account.role === 'operator_admin'
        ? 'hq_admin'
        : account.role === 'station_lead'
          ? 'branch_lead'
          : 'counter_staff';

    const status = !account.active
      ? account.mustChangePassword
        ? 'locked'
        : 'inactive'
      : account.mustChangePassword
        ? 'pending_setup'
        : 'active';

    return {
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      phone: account.phone,
      role,
      operatorCode: account.operator,
      operatorName: operatorNames.get(account.operator) ?? account.operator,
      stationName: account.role === 'operator_admin' ? null : account.stationName,
      status,
      lastSignInAt: account.lastLoginAt ?? null,
    };
  }
}
