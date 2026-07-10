import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UpdateHqAdminDto, UpdatePlatformUserDto } from '../dto/platform-people.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import type { PlatformAuthService } from '../services/platform-auth.service';
import { PlatformAuditService } from '../services/platform-audit.service';
import { PlatformPeopleService } from '../services/platform-people.service';

type PlatformRequest = {
  platform: Awaited<ReturnType<PlatformAuthService['resolveAdminFromToken']>>;
};

@Controller('platform')
@UseGuards(PlatformAuthGuard)
@SkipThrottle({ auth: true })
export class PlatformPeopleController {
  constructor(
    private readonly people: PlatformPeopleService,
    private readonly audit: PlatformAuditService,
  ) {}

  @Get('hq-admins')
  listHqAdmins() {
    return this.people.listHqAdmins();
  }

  @Patch('hq-admins/:accountId')
  updateHqAdmin(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateHqAdminDto,
    @Req() req: PlatformRequest,
  ) {
    return this.people.updateHqAdmin(accountId, dto, req.platform.admin.email);
  }

  @Post('hq-admins/:accountId/issue-credentials')
  issueCredentials(@Param('accountId') accountId: string, @Req() req: PlatformRequest) {
    return this.people.issueHqCredentials(accountId, req.platform.admin.email);
  }

  @Post('hq-admins/:accountId/reset-password')
  resetPassword(@Param('accountId') accountId: string, @Req() req: PlatformRequest) {
    return this.people.resetHqPassword(accountId, req.platform.admin.email);
  }

  @Get('users')
  listUsers() {
    return this.people.listUsers();
  }

  @Patch('users/:accountId')
  updateUser(
    @Param('accountId') accountId: string,
    @Body() dto: UpdatePlatformUserDto,
    @Req() req: PlatformRequest,
  ) {
    return this.people.updateUser(accountId, dto, req.platform.admin.email);
  }

  @Post('users/:accountId/reset-login')
  resetLogin(@Param('accountId') accountId: string, @Req() req: PlatformRequest) {
    return this.people.resetUserLogin(accountId, req.platform.admin.email);
  }

  @Get('audit')
  listAudit() {
    return this.audit.list(200);
  }
}
