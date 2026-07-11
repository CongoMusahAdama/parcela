import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generateTemporaryPassword } from '../../common/utils/temp-password.util';
import { normalizeOperatorLogoDataUrl } from '../../common/utils/operator-logo.util';
import { resolveSubscriptionTerm } from '../../common/utils/subscription-term.util';
import { isProvisionedPhone } from '../../common/utils/phone.util';
import { SmsService } from '../../sms/sms.service';
import { StationsService } from '../../stations/stations.service';
import { StaffAuthService } from '../../staff/staff-auth.service';
import type { StaffAccountRecord } from '../../staff/data/staff-accounts';
import {
  CreateTransportOperatorDto,
  RecordConfigurationLetterDto,
  SendRenewalReminderDto,
  UpdateTransportOperatorDto,
} from '../dto/transport-operator.dto';
import { toOperatorApiRow } from '../mappers/platform.mapper';
import {
  TransportOperator,
  TransportOperatorDocument,
} from '../schemas/transport-operator.schema';
import { PlatformAuditService } from './platform-audit.service';
import { OperatorSettings, OperatorSettingsDocument } from '../../admin/schemas/operator-settings.schema';
import { Parcel, ParcelDocument } from '../../parcels/schemas/parcel.schema';

const PROTECTED_OPERATOR_CODES = new Set(['VIP', 'STC']);

@Injectable()
export class PlatformOperatorsService {
  constructor(
    @InjectModel(TransportOperator.name)
    private readonly operatorModel: Model<TransportOperatorDocument>,
    @InjectModel(OperatorSettings.name)
    private readonly operatorSettingsModel: Model<OperatorSettingsDocument>,
    @InjectModel(Parcel.name)
    private readonly parcelModel: Model<ParcelDocument>,
    private readonly staffAuth: StaffAuthService,
    private readonly audit: PlatformAuditService,
    private readonly sms: SmsService,
    private readonly stations: StationsService,
  ) {}

  async list(actorEmail?: string) {
    void actorEmail;
    const docs = await this.operatorModel.find().sort({ name: 1 }).lean();
    return Promise.all(docs.map((doc) => this.withHqCount(doc)));
  }

  async findById(operatorId: string) {
    const doc = await this.operatorModel.findOne({ operatorId }).lean();
    if (!doc) throw new NotFoundException('Transport operator not found');
    return this.withHqCount(doc);
  }

  async create(dto: CreateTransportOperatorDto, actorEmail: string) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.operatorModel.findOne({ code }).lean();
    if (existing) throw new ConflictException(`Operator code ${code} is already in use`);

    const operatorId = `op-${code.toLowerCase()}-${Date.now()}`;
    const hqEmail = dto.hqEmail.trim().toLowerCase();
    const terminals = (dto.terminals ?? [])
      .map((terminal) => ({
        name: terminal.name.trim(),
        city: terminal.city.trim(),
      }))
      .filter((terminal) => terminal.name && terminal.city);
    const stationCount =
      terminals.length > 0 ? terminals.length : dto.stationCount;
    const cityCount =
      terminals.length > 0
        ? new Set(terminals.map((terminal) => terminal.city.toLowerCase())).size
        : dto.cityCount;

    const subscription = resolveSubscriptionTerm(
      dto.subscriptionPlan,
      dto.subscriptionDuration,
      dto.subscriptionPaidAt,
      dto.agreementDate,
    );

    const operator = await this.operatorModel.create({
      operatorId,
      code,
      name: dto.name.trim(),
      status: 'configure',
      brandColor: dto.brandColor ?? '#fd7e14',
      logoDataUrl: normalizeOperatorLogoDataUrl(dto.logoDataUrl),
      contactEmail: dto.contactEmail?.trim() || undefined,
      contactPhone: dto.contactPhone?.trim() || undefined,
      region: dto.region.trim() || 'Ghana',
      cityCount,
      stationCount,
      hqConfigured: false,
      primaryAdminEmail: hqEmail,
      primaryAdminName: dto.hqName.trim(),
      notes:
        dto.notes?.trim() ||
        'Newly onboarded — finish configuration, then issue HQ logins.',
      agreementDate: dto.agreementDate,
      subscriptionPlan: subscription.subscriptionPlan,
      subscriptionPaidAt: subscription.subscriptionPaidAt,
      subscriptionExpiresAt: subscription.subscriptionExpiresAt,
      subscriptionAmountGhs: dto.subscriptionAmountGhs,
      renewalRemindersSent: [],
    });

    const existingAccount = this.staffAuth
      .getAccounts()
      .find((account) => account.email.toLowerCase() === hqEmail);

    let hqSmsSent = false;
    let hqTempPassword: string | null = null;

    if (!existingAccount) {
      const tempPassword = generateTemporaryPassword();
      hqTempPassword = tempPassword;
      const account: StaffAccountRecord = {
        id: `hq-${code.toLowerCase()}-${Date.now()}`,
        displayName: dto.hqName.trim(),
        email: hqEmail,
        phone: dto.hqPhone?.trim() || '0200000000',
        password: tempPassword,
        pin: generateTemporaryPassword(),
        active: true,
        role: 'operator_admin',
        operator: code,
        stationId: `hq-${code.toLowerCase()}`,
        stationName: `${dto.name.trim()} HQ`,
        stationCode: `${code}-HQ`,
        mustChangePassword: true,
      };
      this.staffAuth.addAccount(account);
      await this.audit.record({
        action: 'HQ admin created',
        detail: `${dto.name.trim()} — ${hqEmail}`,
        actorEmail,
        operatorCode: code,
      });

      if (dto.issueLoginsNow && hqTempPassword && isProvisionedPhone(account.phone)) {
        hqSmsSent = await this.sms.sendHqAdminCredentials({
          phone: account.phone,
          displayName: account.displayName,
          email: account.email,
          temporaryPassword: hqTempPassword,
          operatorName: dto.name.trim(),
          reason: 'new',
        });
      }
    } else if (dto.issueLoginsNow) {
      const tempPassword = generateTemporaryPassword();
      hqTempPassword = tempPassword;
      this.staffAuth.updatePasswordForAccount(existingAccount.id, tempPassword, true);
      if (isProvisionedPhone(existingAccount.phone)) {
        hqSmsSent = await this.sms.sendHqAdminCredentials({
          phone: existingAccount.phone,
          displayName: existingAccount.displayName,
          email: existingAccount.email,
          temporaryPassword: tempPassword,
          operatorName: dto.name.trim(),
          reason: 'issued',
        });
      }
    }

    if (terminals.length > 0) {
      await this.stations.seedOperatorTerminals(code, terminals);
    }

    await this.audit.record({
      action: 'Transport onboarded',
      detail: `${dto.name.trim()} (${code})`,
      actorEmail,
      operatorCode: code,
    });

    const row = await this.withHqCount(operator.toObject());
    return { ...row, hqSmsSent };
  }

  async update(operatorId: string, dto: UpdateTransportOperatorDto, actorEmail: string) {
    const doc = await this.operatorModel.findOne({ operatorId });
    if (!doc) throw new NotFoundException('Transport operator not found');

    if (dto.status) doc.status = dto.status;
    if (dto.hqConfigured !== undefined) doc.hqConfigured = dto.hqConfigured;
    if (dto.agreementDate !== undefined) doc.agreementDate = dto.agreementDate;
    if (dto.notes !== undefined) doc.notes = dto.notes;
    if (dto.brandColor !== undefined) doc.brandColor = dto.brandColor;
    if (dto.logoDataUrl !== undefined) {
      doc.logoDataUrl = dto.logoDataUrl
        ? normalizeOperatorLogoDataUrl(dto.logoDataUrl)
        : undefined;
    }
    if (dto.subscriptionPlan !== undefined) doc.subscriptionPlan = dto.subscriptionPlan;
    if (dto.subscriptionPaidAt !== undefined) {
      doc.subscriptionPaidAt = dto.subscriptionPaidAt
        ? new Date(dto.subscriptionPaidAt)
        : undefined;
    }
    if (dto.subscriptionExpiresAt !== undefined) {
      doc.subscriptionExpiresAt = dto.subscriptionExpiresAt
        ? new Date(dto.subscriptionExpiresAt)
        : undefined;
    }
    if (dto.subscriptionAmountGhs !== undefined) {
      doc.subscriptionAmountGhs = dto.subscriptionAmountGhs;
    }

    await doc.save();

    if (dto.status === 'configured') {
      await this.audit.record({
        action: 'Transport configured',
        detail: `${doc.name} marked configured`,
        actorEmail,
        operatorCode: doc.code,
      });
    }

    return this.withHqCount(doc.toObject());
  }

  async markConfigured(operatorId: string, actorEmail: string) {
    return this.update(
      operatorId,
      { status: 'configured', hqConfigured: true },
      actorEmail,
    );
  }

  async toggleSuspend(operatorId: string, actorEmail: string) {
    const doc = await this.operatorModel.findOne({ operatorId });
    if (!doc) throw new NotFoundException('Transport operator not found');

    const suspending = doc.status !== 'suspended';
    doc.status = suspending
      ? 'suspended'
      : doc.hqConfigured
        ? 'configured'
        : 'configure';
    doc.suspended = suspending;
    await doc.save();

    await this.audit.record({
      action: suspending ? 'Transport suspended' : 'Transport resumed',
      detail: `${doc.name} (${doc.code})`,
      actorEmail,
      operatorCode: doc.code,
    });

    return this.withHqCount(doc.toObject());
  }

  async remove(operatorId: string, actorEmail: string) {
    const doc = await this.operatorModel.findOne({ operatorId });
    if (!doc) throw new NotFoundException('Transport operator not found');

    const code = doc.code.trim().toUpperCase();
    if (PROTECTED_OPERATOR_CODES.has(code)) {
      throw new ForbiddenException(`${code} is a built-in operator and cannot be deleted`);
    }

    const [staffRemoved, stationsRemoved, parcelsRemoved, settingsRemoved] = await Promise.all([
      Promise.resolve(this.staffAuth.removeAccountsByOperator(code)),
      this.stations.removeByOperator(code),
      this.parcelModel.deleteMany({ operator: code }).then((result) => result.deletedCount ?? 0),
      this.operatorSettingsModel
        .deleteMany({ operator: code })
        .then((result) => result.deletedCount ?? 0),
    ]);

    await this.operatorModel.deleteOne({ operatorId });

    await this.audit.record({
      action: 'Transport removed',
      detail: `${doc.name} (${code}) — staff ${staffRemoved}, stations ${stationsRemoved}, parcels ${parcelsRemoved}`,
      actorEmail,
      operatorCode: code,
    });

    return {
      ok: true,
      operatorId,
      operatorCode: code,
      operatorName: doc.name,
      removed: {
        staffAccounts: staffRemoved,
        stations: stationsRemoved,
        parcels: parcelsRemoved,
        operatorSettings: settingsRemoved,
      },
    };
  }

  async sendRenewalReminder(
    operatorId: string,
    dto: SendRenewalReminderDto,
    actorEmail: string,
  ) {
    const doc = await this.operatorModel.findOne({ operatorId });
    if (!doc) throw new NotFoundException('Transport operator not found');
    if (!doc.renewalRemindersSent.includes(dto.reminder)) {
      doc.renewalRemindersSent.push(dto.reminder);
      await doc.save();
    }

    await this.audit.record({
      action: 'Renewal reminder sent',
      detail: `${doc.name} — ${dto.reminder} countdown email`,
      actorEmail,
      operatorCode: doc.code,
    });

    const reminderLabels: Record<string, string> = {
      '30d': '30-day',
      '14d': '14-day',
      '7d': '7-day',
      '1d': '1-day',
    };
    const smsPhone = [doc.contactPhone, doc.primaryAdminEmail ? this.hqPhoneFor(doc.primaryAdminEmail) : null]
      .find((phone) => isProvisionedPhone(phone ?? undefined));
    const renewalSmsSent = smsPhone
      ? await this.sms.sendRenewalReminderNotice({
          phone: smsPhone,
          operatorName: doc.name,
          reminderLabel: reminderLabels[dto.reminder] ?? dto.reminder,
          expiresAt: doc.subscriptionExpiresAt?.toLocaleDateString('en-GB'),
        })
      : false;

    const row = await this.withHqCount(doc.toObject());
    return { ...row, renewalSmsSent };
  }

  async recordConfigurationLetter(
    operatorId: string,
    dto: RecordConfigurationLetterDto,
    actorEmail: string,
  ) {
    const doc = await this.operatorModel.findOne({ operatorId });
    if (!doc) throw new NotFoundException('Transport operator not found');
    if (dto.agreementDate) doc.agreementDate = dto.agreementDate;
    doc.configurationLetterGeneratedAt = new Date();
    await doc.save();

    await this.audit.record({
      action: 'Configuration letter sent',
      detail: `${doc.name} configuration completion letter`,
      actorEmail,
      operatorCode: doc.code,
    });

    const smsPhone = [doc.contactPhone, this.hqPhoneFor(doc.primaryAdminEmail ?? '')]
      .find((phone) => isProvisionedPhone(phone ?? undefined));
    const letterSmsSent = smsPhone
      ? await this.sms.sendConfigurationLetterNotice({
          phone: smsPhone,
          operatorName: doc.name,
        })
      : false;

    const row = await this.withHqCount(doc.toObject());
    return { ...row, letterSmsSent };
  }

  private hqPhoneFor(email: string) {
    if (!email.trim()) return null;
    const account = this.staffAuth
      .getAccounts()
      .find((row) => row.email.toLowerCase() === email.trim().toLowerCase());
    return account?.phone ?? null;
  }

  private hqAdminCount(code: string) {
    return this.staffAuth
      .getAccounts()
      .filter(
        (account) =>
          account.role === 'operator_admin' &&
          account.operator.toUpperCase() === code.toUpperCase(),
      ).length;
  }

  private async withHqCount(doc: TransportOperator & { operatorId: string; updatedAt?: Date }) {
    return toOperatorApiRow(doc, this.hqAdminCount(doc.code));
  }

  /** Public sender/mobile branding — no auth required. */
  async listPublicBranding() {
    const docs = await this.operatorModel
      .find({ status: { $ne: 'suspended' } })
      .sort({ name: 1 })
      .select('code name brandColor logoDataUrl status')
      .lean();

    return docs.map((doc) => ({
      code: doc.code,
      name: doc.name,
      brandColor: doc.brandColor ?? '#fd7e14',
      logoDataUrl: doc.logoDataUrl ?? null,
      active: doc.status !== 'suspended',
    }));
  }

  async isOperatorSuspended(code: string): Promise<boolean> {
    const doc = await this.operatorModel
      .findOne({ code: code.trim().toUpperCase() })
      .select('status suspended')
      .lean();
    if (!doc) return false;
    return doc.status === 'suspended' || doc.suspended === true;
  }
}
