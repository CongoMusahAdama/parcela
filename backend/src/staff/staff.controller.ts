import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { OperatorControlsService } from '../admin/operator-controls.service';
import {
  clearAuthCookie,
  readAuthToken,
  setAuthCookie,
  STAFF_AUTH_COOKIE,
} from '../common/utils/auth-cookie.util';
import { ParcelsService } from '../parcels/parcels.service';
import { ConfirmBusArrivalDto } from './dto/confirm-bus-arrival.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ReleaseParcelDto } from './dto/release-parcel.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { VerifyLogDto } from './dto/verify-log.dto';
import { StaffAuthGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';

type StaffRequest = {
  staff: ReturnType<StaffAuthService['verifyToken']>;
};

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly parcelsService: ParcelsService,
    private readonly operatorControls: OperatorControlsService,
  ) {}

  private async assertStaffOpsUnlocked(operator: 'VIP' | 'STC') {
    if (await this.operatorControls.isStaffOpsLocked(operator)) {
      throw new ForbiddenException('Staff operations are temporarily locked by HQ');
    }
  }

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: StaffLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.staffAuth.login(dto.email, dto.password);
    setAuthCookie(res, STAFF_AUTH_COOKIE, result.token, this.staffAuth.getTokenTtlMs());
    return {
      staff: result.staff,
      signedInAt: result.signedInAt,
    };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = readAuthToken(
      req.headers.authorization,
      req.cookies as Record<string, string> | undefined,
      STAFF_AUTH_COOKIE,
    );

    if (token) {
      try {
        const session = this.staffAuth.verifyToken(token);
        if (session.staff.role === 'station_staff') {
          this.staffAuth.recordStaffLogout(session.staff.id);
        }
      } catch {
        // Cookie may already be expired — still clear it.
      }
    }

    clearAuthCookie(res, STAFF_AUTH_COOKIE);
    return { ok: true };
  }

  @Post('change-password')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @UseGuards(StaffAuthGuard)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: StaffRequest) {
    const staff = this.staffAuth.changePasswordForAccount(
      req.staff.staff.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return {
      ok: true,
      staff,
      message: 'Password updated. You can continue in the counter portal.',
    };
  }

  @Get('session')
  @UseGuards(StaffAuthGuard)
  session(@Req() req: StaffRequest) {
    return {
      staff: req.staff.staff,
      signedInAt: new Date(req.staff.iat).toISOString(),
    };
  }

  @Get('parcels')
  @SkipThrottle({ auth: true })
  @UseGuards(StaffAuthGuard)
  listParcels(@Req() req: StaffRequest) {
    return this.parcelsService.listByStation(req.staff.staff.stationId);
  }

  @Get('parcels/:reference')
  @UseGuards(StaffAuthGuard)
  getParcel(@Param('reference') reference: string, @Req() req: StaffRequest) {
    return this.parcelsService.getStaffParcelByReference(reference, req.staff.staff.stationId);
  }

  @Post('parcels/:reference/verify-log')
  @UseGuards(StaffAuthGuard)
  async verifyAndLog(
    @Param('reference') reference: string,
    @Body() dto: VerifyLogDto,
    @Req() req: StaffRequest,
  ) {
    await this.assertStaffOpsUnlocked(req.staff.staff.operator);
    return this.parcelsService.verifyAndLogParcel(reference, req.staff.staff.stationId, dto);
  }

  @Post('buses/confirm-arrival')
  @UseGuards(StaffAuthGuard)
  async confirmBusArrival(@Body() dto: ConfirmBusArrivalDto, @Req() req: StaffRequest) {
    await this.assertStaffOpsUnlocked(req.staff.staff.operator);
    return this.parcelsService.confirmBusArrival(req.staff.staff.stationId, dto.busNumber);
  }

  @Post('parcels/:reference/release')
  @UseGuards(StaffAuthGuard)
  async releaseParcel(
    @Param('reference') reference: string,
    @Body() dto: ReleaseParcelDto,
    @Req() req: StaffRequest,
  ) {
    await this.assertStaffOpsUnlocked(req.staff.staff.operator);
    return this.parcelsService.releaseParcel(
      reference,
      req.staff.staff.stationId,
      dto.pickupCode,
    );
  }
}
