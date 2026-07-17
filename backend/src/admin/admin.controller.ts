import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  ADMIN_AUTH_COOKIE,
  clearAuthCookie,
  setAuthCookie,
} from '../common/utils/auth-cookie.util';
import { StaffAuthService } from '../staff/staff-auth.service';
import { SmsService } from '../sms/sms.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from '../staff/dto/change-password.dto';
import { CompleteSetupDto } from './dto/complete-setup.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateStationDto } from './dto/create-station.dto';
import { OperatorLocksDto } from './dto/operator-locks.dto';
import { OperatorSettingsDto } from './dto/operator-settings.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

type AdminRequest = {
  admin: ReturnType<StaffAuthService['verifyToken']>;
};

@Controller('admin')
export class AdminController {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly adminService: AdminService,
    private readonly sms: SmsService,
  ) {}

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.staffAuth.loginAdmin(dto.phone, dto.password);
    setAuthCookie(res, ADMIN_AUTH_COOKIE, result.token, this.staffAuth.getTokenTtlMs());
    void this.sms.sendSecureLoginAlert({
      phone: result.staff.phone,
      displayName: result.staff.displayName,
      role: 'hq',
      operatorName: result.staff.operator,
    });
    return this.adminService.getSessionPayload(result.staff, result.signedInAt);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res, ADMIN_AUTH_COOKIE);
    return { ok: true };
  }

  @Post('change-password')
  @UseGuards(AdminAuthGuard)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: AdminRequest) {
    const staff = this.staffAuth.changePasswordForAccount(
      req.admin.staff.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return {
      ok: true,
      admin: {
        id: staff.id,
        email: staff.email,
        displayName: staff.displayName,
        operator: staff.operator,
        mustChangePassword: staff.mustChangePassword ?? false,
      },
      message: 'Password updated. You can continue in the HQ portal.',
    };
  }

  @Get('session')
  @UseGuards(AdminAuthGuard)
  async session(@Req() req: AdminRequest) {
    return this.adminService.getSessionPayload(
      req.admin.staff,
      new Date(req.admin.iat).toISOString(),
    );
  }

  @Post('setup/complete')
  @UseGuards(AdminAuthGuard)
  async completeSetup(@Body() dto: CompleteSetupDto, @Req() req: AdminRequest) {
    const operator = req.admin.staff.operator;
    void dto;
    const settings = await this.adminService.completeSetup(operator, req.admin.staff.email);
    const session = await this.adminService.getSessionPayload(
      req.admin.staff,
      new Date(req.admin.iat).toISOString(),
    );
    return {
      ok: true,
      settings,
      admin: session.admin,
    };
  }

  @Get('overview')
  @SkipThrottle({ auth: true })
  @UseGuards(AdminAuthGuard)
  overview(@Req() req: AdminRequest) {
    return this.adminService.getOverview(req.admin.staff.operator);
  }

  @Get('parcels')
  @SkipThrottle({ auth: true })
  @UseGuards(AdminAuthGuard)
  parcels(
    @Query('q') q: string | undefined,
    @Query('status') status: string | undefined,
    @Query('city') city: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.listParcels(req.admin.staff.operator, {
      q,
      status,
      city,
      branchId,
      dateFrom,
      dateTo,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('stations')
  @UseGuards(AdminAuthGuard)
  stations(@Req() req: AdminRequest) {
    return this.adminService.listStations(req.admin.staff.operator);
  }

  @Post('stations')
  @UseGuards(AdminAuthGuard)
  createStation(@Body() dto: CreateStationDto, @Req() req: AdminRequest) {
    return this.adminService.createStation(req.admin.staff.operator, dto);
  }

  @Get('leads')
  @UseGuards(AdminAuthGuard)
  leads(@Req() req: AdminRequest) {
    return this.adminService.listLeads(req.admin.staff.operator);
  }

  @Post('leads')
  @UseGuards(AdminAuthGuard)
  createLead(@Body() dto: CreateLeadDto, @Req() req: AdminRequest) {
    return this.adminService.upsertLead(req.admin.staff.operator, dto);
  }

  @Delete('leads/:stationId')
  @UseGuards(AdminAuthGuard)
  removeLead(@Param('stationId') stationId: string, @Req() req: AdminRequest) {
    return this.adminService.removeLead(req.admin.staff.operator, stationId);
  }

  @Post('leads/:stationId/send-credentials')
  @UseGuards(AdminAuthGuard)
  sendCredentials(@Param('stationId') stationId: string, @Req() req: AdminRequest) {
    return this.adminService.sendLeadCredentials(req.admin.staff.operator, stationId);
  }

  @Get('people')
  @UseGuards(AdminAuthGuard)
  people(@Query('q') q: string | undefined, @Req() req: AdminRequest) {
    return this.adminService.listPeople(req.admin.staff.operator, q);
  }

  @Patch('people/:id')
  @UseGuards(AdminAuthGuard)
  updatePerson(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.setPersonActive(
      req.admin.staff.operator,
      id,
      dto.active,
      req.admin.staff.id,
    );
  }

  /** Public lock status for staff/lead portals and booking gate (no HQ cookie). */
  @Get('operator-controls/status')
  @SkipThrottle({ auth: true })
  async getLockStatus(@Query('operator') operator: string | undefined) {
    const code = operator?.trim().toUpperCase();
    if (!code) {
      return {
        operator: null,
        bookingsLocked: false,
        staffOpsLocked: false,
        leadOpsLocked: false,
        maintenanceBanner: '',
      };
    }
    const controls = await this.adminService.getControls(code);
    return {
      operator: code,
      bookingsLocked: controls.bookingsLocked,
      staffOpsLocked: controls.staffOpsLocked,
      leadOpsLocked: controls.leadOpsLocked,
      maintenanceBanner: controls.maintenanceBanner ?? '',
    };
  }

  @Get('operator-controls')
  @UseGuards(AdminAuthGuard)
  getControls(@Req() req: AdminRequest) {
    return this.adminService.getControls(req.admin.staff.operator);
  }

  @Patch('operator-controls/locks')
  @UseGuards(AdminAuthGuard)
  setLocks(@Body() dto: OperatorLocksDto, @Req() req: AdminRequest) {
    return this.adminService.setLocks(req.admin.staff.operator, dto, req.admin.staff.email);
  }

  @Patch('operator-controls/settings')
  @UseGuards(AdminAuthGuard)
  setSettings(@Body() dto: OperatorSettingsDto, @Req() req: AdminRequest) {
    return this.adminService.setSettings(req.admin.staff.operator, dto, req.admin.staff.email);
  }

  @Get('reports/:moduleId')
  @UseGuards(AdminAuthGuard)
  reports(
    @Param('moduleId') moduleId: string,
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Query('city') city: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.buildReport(req.admin.staff.operator, moduleId, {
      dateFrom,
      dateTo,
      city,
      branchId,
    });
  }
}
