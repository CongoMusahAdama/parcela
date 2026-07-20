import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CreatePlatformNotificationDto } from '../dto/platform-notification.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import type { PlatformAuthService } from '../services/platform-auth.service';
import { PlatformNotificationsService } from '../services/platform-notifications.service';

type PlatformRequest = {
  platform: Awaited<ReturnType<PlatformAuthService['resolveAdminFromToken']>>;
};

@Controller('platform')
@UseGuards(PlatformAuthGuard)
@SkipThrottle({ auth: true })
export class PlatformNotificationsController {
  constructor(private readonly notifications: PlatformNotificationsService) {}

  @Get('notifications')
  list() {
    return this.notifications.list(50);
  }

  @Post('notifications')
  send(@Body() dto: CreatePlatformNotificationDto, @Req() req: PlatformRequest) {
    return this.notifications.send({
      title: dto.title,
      body: dto.body,
      audience: dto.audience,
      actorEmail: req.platform.admin.email,
    });
  }
}
