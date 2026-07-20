import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { OperatorControlsService } from '../admin/operator-controls.service';
import {
  clearAuthCookie,
  LEAD_AUTH_COOKIE,
  setAuthCookie,
} from '../common/utils/auth-cookie.util';
import { ParcelsService } from '../parcels/parcels.service';
import { SmsService } from '../sms/sms.service';
import { ChangePinDto } from './dto/change-pin.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { LeadLoginDto } from './dto/lead-login.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { LeadAuthGuard } from './lead-auth.guard';
import { LeadTeamService } from './lead-team.service';
import { StaffAuthService } from './staff-auth.service';
import { PortalUpdatesInboxService } from '../platform/services/portal-updates-inbox.service';

type LeadRequest = {
  lead: ReturnType<StaffAuthService['verifyToken']>;
};

@Controller('lead')
export class LeadController {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly parcelsService: ParcelsService,
    private readonly leadTeam: LeadTeamService,
    private readonly operatorControls: OperatorControlsService,
    private readonly sms: SmsService,
    private readonly portalUpdates: PortalUpdatesInboxService,
  ) {}

  private async assertLeadOpsUnlocked(operator: string) {
    if (await this.operatorControls.isLeadOpsLocked(operator)) {
      throw new ForbiddenException('Lead team operations are temporarily locked by HQ');
    }
  }

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LeadLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.staffAuth.loginByPhonePin(dto.phone, dto.pin);
    setAuthCookie(res, LEAD_AUTH_COOKIE, result.token, this.staffAuth.getLoginCookieTtlMs('station_lead'));
    void this.sms.sendSecureLoginAlert({
      phone: result.staff.phone,
      displayName: result.staff.displayName,
      role: 'lead',
      stationName: result.staff.stationName,
    });
    return {
      staff: result.staff,
      signedInAt: result.signedInAt,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res, LEAD_AUTH_COOKIE);
    return { ok: true };
  }

  @Post('change-pin')
  @UseGuards(LeadAuthGuard)
  changePin(@Body() dto: ChangePinDto, @Req() req: LeadRequest) {
    const staff = this.staffAuth.changePinForAccount(
      req.lead.staff.id,
      dto.currentPin,
      dto.newPin,
    );
    return {
      ok: true,
      staff,
      message: 'PIN updated. You can continue in the branch lead portal.',
    };
  }

  @Get('session')
  @UseGuards(LeadAuthGuard)
  session(@Req() req: LeadRequest) {
    return {
      staff: req.lead.staff,
      signedInAt: new Date(req.lead.iat).toISOString(),
    };
  }

  @Get('platform-updates')
  @SkipThrottle({ auth: true })
  @UseGuards(LeadAuthGuard)
  platformUpdates() {
    return this.portalUpdates.listForPortal('lead');
  }

  @Get('summary')
  @SkipThrottle({ auth: true })
  @UseGuards(LeadAuthGuard)
  summary(@Req() req: LeadRequest) {
    return this.parcelsService.getBranchSummary(req.lead.staff.stationId);
  }

  @Get('parcels')
  @UseGuards(LeadAuthGuard)
  parcels(@Req() req: LeadRequest) {
    return this.parcelsService.listByStation(req.lead.staff.stationId);
  }

  @Get('stations')
  @UseGuards(LeadAuthGuard)
  branchStations(@Req() req: LeadRequest) {
    return this.leadTeam.listBranchStations(
      req.lead.staff.stationId,
      req.lead.staff.operator,
    );
  }

  @Get('team')
  @UseGuards(LeadAuthGuard)
  team(@Req() req: LeadRequest) {
    return this.leadTeam.listCounterStaff(
      req.lead.staff.stationId,
      req.lead.staff.operator,
    );
  }

  @Post('team')
  @UseGuards(LeadAuthGuard)
  async createTeamMember(@Body() dto: CreateTeamMemberDto, @Req() req: LeadRequest) {
    await this.assertLeadOpsUnlocked(req.lead.staff.operator);
    return this.leadTeam.createCounterStaff(
      req.lead.staff.stationId,
      req.lead.staff.operator,
      dto,
    );
  }

  @Patch('team/:id')
  @UseGuards(LeadAuthGuard)
  async updateTeamMember(
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
    @Req() req: LeadRequest,
  ) {
    await this.assertLeadOpsUnlocked(req.lead.staff.operator);
    return this.leadTeam.updateCounterStaff(
      req.lead.staff.stationId,
      req.lead.staff.operator,
      id,
      dto,
    );
  }

  @Delete('team/:id')
  @UseGuards(LeadAuthGuard)
  async deleteTeamMember(@Param('id') id: string, @Req() req: LeadRequest) {
    await this.assertLeadOpsUnlocked(req.lead.staff.operator);
    return this.leadTeam.deleteCounterStaff(
      req.lead.staff.stationId,
      req.lead.staff.operator,
      id,
    );
  }
}
