import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  OperatorSettings,
  OperatorSettingsDocument,
  OperatorAuditEntry,
} from './schemas/operator-settings.schema';

export type OperatorCode = string;

export type OperatorLocks = {
  bookingsLocked: boolean;
  staffOpsLocked: boolean;
  leadOpsLocked: boolean;
};

export type OperatorControlSettings = {
  smsAlertsEnabled: boolean;
  emailDigestEnabled: boolean;
  requireLeadApprovalForStaff: boolean;
  maintenanceBanner: string;
};

@Injectable()
export class OperatorControlsService {
  constructor(
    @InjectModel(OperatorSettings.name)
    private readonly settingsModel: Model<OperatorSettingsDocument>,
  ) {}

  async getOrCreateSettings(operator: OperatorCode): Promise<OperatorSettingsDocument> {
    let doc = await this.settingsModel.findOne({ operator });
    if (!doc) {
      doc = await this.settingsModel.create({
        operator,
        configured: false,
        bookingsLocked: false,
        staffOpsLocked: false,
        leadOpsLocked: false,
        smsAlertsEnabled: true,
        emailDigestEnabled: true,
        requireLeadApprovalForStaff: false,
        maintenanceBanner: '',
        audit: [],
      });
    }
    return doc;
  }

  async getLocks(operator: OperatorCode): Promise<OperatorLocks> {
    const settings = await this.getOrCreateSettings(operator);
    return {
      bookingsLocked: settings.bookingsLocked,
      staffOpsLocked: settings.staffOpsLocked,
      leadOpsLocked: settings.leadOpsLocked,
    };
  }

  async isBookingsLocked(operator: OperatorCode): Promise<boolean> {
    const settings = await this.getOrCreateSettings(operator);
    return settings.bookingsLocked === true;
  }

  async isStaffOpsLocked(operator: OperatorCode): Promise<boolean> {
    const settings = await this.getOrCreateSettings(operator);
    return settings.staffOpsLocked === true;
  }

  async isLeadOpsLocked(operator: OperatorCode): Promise<boolean> {
    const settings = await this.getOrCreateSettings(operator);
    return settings.leadOpsLocked === true;
  }

  async setLocks(
    operator: OperatorCode,
    locks: Partial<OperatorLocks>,
    actor: string,
  ) {
    const settings = await this.getOrCreateSettings(operator);
    const changes: string[] = [];

    if (locks.bookingsLocked !== undefined && locks.bookingsLocked !== settings.bookingsLocked) {
      settings.bookingsLocked = locks.bookingsLocked;
      changes.push(`bookingsLocked=${locks.bookingsLocked}`);
    }
    if (locks.staffOpsLocked !== undefined && locks.staffOpsLocked !== settings.staffOpsLocked) {
      settings.staffOpsLocked = locks.staffOpsLocked;
      changes.push(`staffOpsLocked=${locks.staffOpsLocked}`);
    }
    if (locks.leadOpsLocked !== undefined && locks.leadOpsLocked !== settings.leadOpsLocked) {
      settings.leadOpsLocked = locks.leadOpsLocked;
      changes.push(`leadOpsLocked=${locks.leadOpsLocked}`);
    }

    if (changes.length) {
      settings.audit.push(this.auditEntry(actor, 'set_locks', changes.join(', '), 'warning'));
      await settings.save();
    }

    return this.toPublic(settings);
  }

  async setSettings(
    operator: OperatorCode,
    input: Partial<OperatorControlSettings>,
    actor: string,
  ) {
    const settings = await this.getOrCreateSettings(operator);
    const changes: string[] = [];

    if (
      input.smsAlertsEnabled !== undefined &&
      input.smsAlertsEnabled !== settings.smsAlertsEnabled
    ) {
      settings.smsAlertsEnabled = input.smsAlertsEnabled;
      changes.push(`smsAlertsEnabled=${input.smsAlertsEnabled}`);
    }
    if (
      input.emailDigestEnabled !== undefined &&
      input.emailDigestEnabled !== settings.emailDigestEnabled
    ) {
      settings.emailDigestEnabled = input.emailDigestEnabled;
      changes.push(`emailDigestEnabled=${input.emailDigestEnabled}`);
    }
    if (
      input.requireLeadApprovalForStaff !== undefined &&
      input.requireLeadApprovalForStaff !== settings.requireLeadApprovalForStaff
    ) {
      settings.requireLeadApprovalForStaff = input.requireLeadApprovalForStaff;
      changes.push(`requireLeadApprovalForStaff=${input.requireLeadApprovalForStaff}`);
    }
    if (
      input.maintenanceBanner !== undefined &&
      input.maintenanceBanner !== settings.maintenanceBanner
    ) {
      settings.maintenanceBanner = input.maintenanceBanner;
      changes.push('maintenanceBanner updated');
    }

    if (changes.length) {
      settings.audit.push(this.auditEntry(actor, 'set_settings', changes.join(', '), 'info'));
      await settings.save();
    }

    return this.toPublic(settings);
  }

  async completeSetup(operator: OperatorCode, actor: string) {
    const settings = await this.getOrCreateSettings(operator);
    if (!settings.configured) {
      settings.configured = true;
      settings.audit.push(
        this.auditEntry(actor, 'complete_setup', `${operator} transport configured`, 'info'),
      );
      await settings.save();
    }
    return this.toPublic(settings);
  }

  toPublic(settings: OperatorSettings | OperatorSettingsDocument) {
    return {
      operator: settings.operator,
      configured: settings.configured,
      bookingsLocked: settings.bookingsLocked,
      staffOpsLocked: settings.staffOpsLocked,
      leadOpsLocked: settings.leadOpsLocked,
      smsAlertsEnabled: settings.smsAlertsEnabled,
      emailDigestEnabled: settings.emailDigestEnabled,
      requireLeadApprovalForStaff: settings.requireLeadApprovalForStaff,
      maintenanceBanner: settings.maintenanceBanner ?? '',
      audit: settings.audit ?? [],
    };
  }

  private auditEntry(
    actor: string,
    action: string,
    detail: string,
    severity: OperatorAuditEntry['severity'],
  ): OperatorAuditEntry {
    return {
      id: `aud-${Date.now()}-${randomBytes(3).toString('hex')}`,
      at: new Date().toISOString(),
      actor,
      action,
      detail,
      severity,
    };
  }
}
