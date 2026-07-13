import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  PLATFORM_AUTH_COOKIE,
  clearAuthCookie,
  setAuthCookie,
} from '../../common/utils/auth-cookie.util';
import { SmsService } from '../../sms/sms.service';
import { StaffAuthService } from '../../staff/staff-auth.service';
import { SessionRevocationService } from '../../common/services/session-revocation.service';
import { PlatformLoginDto } from '../dto/platform-login.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformAuditService } from '../services/platform-audit.service';
import { PlatformAuthService } from '../services/platform-auth.service';

type PlatformRequest = {
  platform: Awaited<ReturnType<PlatformAuthService['resolveAdminFromToken']>>;
};

@Controller('platform')
export class PlatformAuthController {
  constructor(
    private readonly platformAuth: PlatformAuthService,
    private readonly sessionRevocation: SessionRevocationService,
    private readonly staffAuth: StaffAuthService,
    private readonly audit: PlatformAuditService,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: PlatformLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.platformAuth.login(dto.email, dto.password);
    setAuthCookie(res, PLATFORM_AUTH_COOKIE, result.token, this.platformAuth.getTokenTtlMs());
    const phone = this.config.get<string>('platform.adminPhone')?.trim() ?? '';
    if (phone) {
      void this.sms.sendSecureLoginAlert({
        phone,
        displayName: result.admin.displayName,
        role: 'platform',
      });
    }
    return this.platformAuth.getSessionPayload(result.admin, result.signedInAt);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res, PLATFORM_AUTH_COOKIE);
    return { ok: true };
  }

  @Get('session')
  @UseGuards(PlatformAuthGuard)
  session(@Req() req: PlatformRequest) {
    return this.platformAuth.getSessionPayload(
      req.platform.admin,
      new Date(req.platform.iat).toISOString(),
    );
  }

  @Post('sessions/revoke-all')
  @UseGuards(PlatformAuthGuard)
  async revokeAllSessions(@Req() req: PlatformRequest) {
    const result = await this.sessionRevocation.revokeAllSessions();
    this.staffAuth.clearAllActiveSessions();
    await this.audit.record({
      action: 'Global sign-out',
      detail: 'All HQ, lead, staff, and platform sessions revoked',
      actorEmail: req.platform.admin.email,
    });
    return { ok: true, ...result };
  }
}
