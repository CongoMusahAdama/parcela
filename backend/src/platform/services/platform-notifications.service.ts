import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { SmsService } from '../../sms/sms.service';
import {
  StaffAccount,
  StaffAccountDocument,
} from '../../staff/schemas/staff-account.schema';
import { PlatformAuditService } from './platform-audit.service';
import {
  PlatformNotification,
  PlatformNotificationDocument,
  type PlatformNotificationAudience,
} from '../schemas/platform-notification.schema';

const AUDIENCE_ROLES: Record<
  PlatformNotificationAudience,
  Array<'station_staff' | 'station_lead' | 'operator_admin'>
> = {
  hq: ['operator_admin'],
  lead: ['station_lead'],
  staff: ['station_staff'],
  general: ['operator_admin', 'station_lead', 'station_staff'],
};

const AUDIENCE_EMPTY_MESSAGE: Record<PlatformNotificationAudience, string> = {
  hq: 'No active HQ admin phones found to notify.',
  lead: 'No active branch lead phones found to notify.',
  staff: 'No active counter staff phones found to notify.',
  general: 'No active portal user phones found to notify.',
};

@Injectable()
export class PlatformNotificationsService {
  constructor(
    @InjectModel(PlatformNotification.name)
    private readonly notificationModel: Model<PlatformNotificationDocument>,
    @InjectModel(StaffAccount.name)
    private readonly staffModel: Model<StaffAccountDocument>,
    private readonly sms: SmsService,
    private readonly audit: PlatformAuditService,
  ) {}

  async list(limit = 50) {
    const rows = await this.notificationModel
      .find()
      .sort({ sentAt: -1, createdAt: -1 })
      .limit(limit)
      .lean<
        Array<
          PlatformNotification & {
            sentAt?: Date;
            createdAt?: Date;
          }
        >
      >();

    return rows.map((row) => this.toRow(row));
  }

  async send(params: {
    title: string;
    body: string;
    audience: PlatformNotificationAudience;
    actorEmail: string;
  }) {
    const title = params.title.trim();
    const body = params.body.trim();
    if (!title || !body) {
      throw new BadRequestException('Title and message are required.');
    }

    const recipients = await this.resolveRecipients(params.audience);
    if (recipients.length === 0) {
      throw new BadRequestException(AUDIENCE_EMPTY_MESSAGE[params.audience]);
    }

    const message = this.formatSms(title, body);
    let sentCount = 0;
    let failedCount = 0;

    for (const phone of recipients) {
      const ok = await this.sms.sendSms(phone, message);
      if (ok) sentCount += 1;
      else failedCount += 1;
    }

    const sentAt = new Date();
    const entry = await this.notificationModel.create({
      notificationId: `pn-${Date.now()}-${randomBytes(3).toString('hex')}`,
      title,
      body,
      audience: params.audience,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      actorEmail: params.actorEmail,
      sentAt,
    });

    await this.audit.record({
      action: 'notification_sent',
      detail: `Sent ${params.audience} update “${title}” to ${sentCount}/${recipients.length} phones`,
      actorEmail: params.actorEmail,
    });

    return this.toRow(entry.toObject());
  }

  private async resolveRecipients(audience: PlatformNotificationAudience) {
    const roles = AUDIENCE_ROLES[audience];
    const accounts = await this.staffModel
      .find({
        active: true,
        role: roles.length === 1 ? roles[0] : { $in: roles },
      })
      .select({ phone: 1 })
      .lean<Array<{ phone?: string }>>();

    const phones = new Set<string>();
    for (const account of accounts) {
      const phone = account.phone?.trim();
      if (phone) phones.add(phone);
    }
    return Array.from(phones);
  }

  private formatSms(title: string, body: string) {
    const text = `Parcela update (${title}): ${body}`.trim();
    return text.length > 460 ? `${text.slice(0, 457)}...` : text;
  }

  private toRow(
    row: PlatformNotification & {
      sentAt?: Date;
      createdAt?: Date;
    },
  ) {
    return {
      id: row.notificationId,
      title: row.title,
      body: row.body,
      audience: row.audience,
      recipientCount: row.recipientCount,
      sentCount: row.sentCount,
      failedCount: row.failedCount,
      actorEmail: row.actorEmail ?? null,
      sentAt:
        row.sentAt instanceof Date
          ? row.sentAt.toISOString()
          : row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : new Date().toISOString(),
    };
  }
}
