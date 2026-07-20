import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PlatformNotification,
  PlatformNotificationSchema,
} from './schemas/platform-notification.schema';
import { PortalUpdatesInboxService } from './services/portal-updates-inbox.service';

/** Shared inbox for HQ / lead / staff dashboards (avoids circular Platform↔Staff imports). */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformNotification.name, schema: PlatformNotificationSchema },
    ]),
  ],
  providers: [PortalUpdatesInboxService],
  exports: [MongooseModule, PortalUpdatesInboxService],
})
export class PortalUpdatesModule {}
