import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PlatformNotification,
  PlatformNotificationDocument,
  type PlatformNotificationAudience,
} from '../schemas/platform-notification.schema';

export type PortalUpdateAudience = Exclude<PlatformNotificationAudience, 'general'>;

@Injectable()
export class PortalUpdatesInboxService {
  constructor(
    @InjectModel(PlatformNotification.name)
    private readonly notificationModel: Model<PlatformNotificationDocument>,
  ) {}

  /** Active notices for a portal role (role-specific + general). */
  async listForPortal(audience: PortalUpdateAudience, limit = 20) {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days
    const rows = await this.notificationModel
      .find({
        audience: { $in: [audience, 'general'] },
        $or: [{ sentAt: { $gte: since } }, { createdAt: { $gte: since } }],
      })
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

    return rows.map((row) => ({
      id: row.notificationId,
      title: row.title,
      body: row.body,
      audience: row.audience,
      sentAt:
        row.sentAt instanceof Date
          ? row.sentAt.toISOString()
          : row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : new Date().toISOString(),
    }));
  }
}
