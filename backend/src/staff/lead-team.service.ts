import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateTemporaryPassword } from '../common/utils/temp-password.util';
import { OperatorControlsService } from '../admin/operator-controls.service';
import { normalizeGhanaPhone } from '../common/utils/phone.util';
import { StationsService } from '../stations/stations.service';
import { SmsService } from '../sms/sms.service';
import type { StaffAccountRecord, StaffRole } from './data/staff-accounts';
import { StaffAuthService, toPublicAccount } from './staff-auth.service';

export type LeadTeamMemberResponse = Omit<
  ReturnType<typeof toPublicAccount>,
  'lastLoginAt' | 'lastLogoutAt'
> & {
  location?: string;
  online: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  parcelsHandledToday: number;
};

type StationContext = {
  station: NonNullable<Awaited<ReturnType<StationsService['findByStationId']>>>;
};

@Injectable()
export class LeadTeamService {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly smsService: SmsService,
    private readonly stationsService: StationsService,
    private readonly operatorControls: OperatorControlsService,
    private readonly config: ConfigService,
  ) {}

  private toTeamMember(account: StaffAccountRecord): LeadTeamMemberResponse {
    const staff = toPublicAccount(account);
    const presence = this.staffAuth.getStaffPresence(account.id);
    return {
      ...staff,
      location: account.location ?? account.stationName,
      online: presence.online,
      lastLoginAt: presence.lastLoginAt,
      lastLogoutAt: presence.lastLogoutAt,
      parcelsHandledToday: 0,
    };
  }

  /** Lead may only manage counter staff at their own assigned station. */
  private async getStationContext(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
  ): Promise<StationContext> {
    const station = await this.stationsService.findByStationId(leadStationId);
    if (!station || station.operator !== leadOperator) {
      throw new BadRequestException('Your branch station could not be resolved');
    }
    return { station };
  }

  async listBranchStations(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
  ) {
    const { station } = await this.getStationContext(leadStationId, leadOperator);
    return { branchCity: station.city, stations: [station] };
  }

  async listCounterStaff(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
  ): Promise<LeadTeamMemberResponse[]> {
    await this.getStationContext(leadStationId, leadOperator);

    return this.staffAuth
      .getAccounts()
      .filter(
        (account) =>
          account.role === 'station_staff' &&
          account.operator === leadOperator &&
          account.stationId === leadStationId,
      )
      .map((account) => this.toTeamMember(account));
  }

  private findStationMember(
    memberId: string,
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
  ) {
    const account = this.staffAuth
      .getAccounts()
      .find(
        (item) =>
          item.id === memberId &&
          item.role === 'station_staff' &&
          item.operator === leadOperator &&
          item.stationId === leadStationId,
      );

    if (!account) {
      throw new NotFoundException('Team member not found at your station');
    }

    return account;
  }

  async createCounterStaff(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
    input: {
      displayName: string;
      phone: string;
      email?: string;
      stationId?: string;
    },
  ) {
    const settings = await this.operatorControls.getOrCreateSettings(leadOperator);
    if (settings.requireLeadApprovalForStaff) {
      throw new ForbiddenException(
        'HQ requires approval before new counter staff can be created. Contact your operator admin.',
      );
    }

    const { station } = await this.getStationContext(leadStationId, leadOperator);
    const targetStationId = input.stationId?.trim() || leadStationId;

    if (targetStationId !== leadStationId) {
      throw new BadRequestException(
        'You can only create counter staff for your assigned station',
      );
    }

    const phone = normalizeGhanaPhone(input.phone);

    if (!input.displayName.trim()) {
      throw new BadRequestException('Staff name is required');
    }

    const phoneTaken = this.staffAuth
      .getAccounts()
      .some((account) => normalizeGhanaPhone(account.phone) === phone);
    if (phoneTaken) {
      throw new ConflictException('A staff account with this phone already exists');
    }

    const slug = input.displayName.trim().toLowerCase().replace(/\s+/g, '.');
    const email = input.email?.trim().toLowerCase() || `${slug}@parcela.staff`;

    const emailTaken = this.staffAuth
      .getAccounts()
      .some((account) => account.email.toLowerCase() === email);
    if (emailTaken) {
      throw new ConflictException('A staff account with this email already exists');
    }

    const temporaryPassword = generateTemporaryPassword();
    const location = `${station.city} · ${station.name}`;
    const webUrl = (this.config.get<string>('app.publicWebUrl') ?? 'http://localhost:3001').replace(
      /\/$/,
      '',
    );

    const record: StaffAccountRecord = {
      id: `staff-${station.id}-${Date.now()}`,
      displayName: input.displayName.trim(),
      email,
      phone: input.phone.trim(),
      password: temporaryPassword,
      pin: generateTemporaryPassword(),
      active: true,
      role: 'station_staff' as StaffRole,
      operator: leadOperator,
      stationId: station.id,
      stationName: station.name,
      stationCode: station.code,
      location,
      mustChangePassword: true,
    };

    const staff = this.staffAuth.addAccount(record);

    const loginUrl = `${webUrl}/portal/login`;
    const message = [
      `Parcela counter staff account for ${station.name} is ready.`,
      `Sign in: ${loginUrl}`,
      `Phone: ${input.phone.trim()}`,
      `Temporary code: ${temporaryPassword}`,
      `Sign in with this code, then set a new password from the portal.`,
    ].join(' ');

    const smsSent = await this.smsService.sendSms(input.phone.trim(), message);

    return { staff, smsSent, temporaryPasswordSent: true };
  }

  async updateCounterStaff(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
    memberId: string,
    input: {
      displayName?: string;
      email?: string;
      phone?: string;
      active?: boolean;
    },
  ) {
    await this.getStationContext(leadStationId, leadOperator);
    const account = this.findStationMember(memberId, leadStationId, leadOperator);

    if (input.displayName !== undefined) {
      const name = input.displayName.trim();
      if (!name) throw new BadRequestException('Staff name is required');
      account.displayName = name;
    }

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email) throw new BadRequestException('Email is required');
      const emailTaken = this.staffAuth
        .getAccounts()
        .some((item) => item.id !== account.id && item.email.toLowerCase() === email);
      if (emailTaken) {
        throw new ConflictException('A staff account with this email already exists');
      }
      account.email = email;
    }

    if (input.phone !== undefined) {
      const phone = normalizeGhanaPhone(input.phone);
      const phoneTaken = this.staffAuth
        .getAccounts()
        .some(
          (item) => item.id !== account.id && normalizeGhanaPhone(item.phone) === phone,
        );
      if (phoneTaken) {
        throw new ConflictException('A staff account with this phone already exists');
      }
      account.phone = input.phone.trim();
    }

    if (input.active !== undefined) {
      account.active = input.active;
    }

    this.staffAuth.saveAccount(account);
    return this.toTeamMember(account);
  }

  async deleteCounterStaff(
    leadStationId: string,
    leadOperator: StaffAccountRecord['operator'],
    memberId: string,
  ) {
    await this.getStationContext(leadStationId, leadOperator);
    const account = this.findStationMember(memberId, leadStationId, leadOperator);
    const removed = this.staffAuth.removeAccount(account.id);
    if (!removed) {
      throw new NotFoundException('Team member not found at your station');
    }
    return { ok: true };
  }
}
