import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { ensureHashedSecret } from '../common/utils/password.util';
import { normalizeGhanaPhone } from '../common/utils/phone.util';
import { Parcel, ParcelDocument } from '../parcels/schemas/parcel.schema';
import { SmsService } from '../sms/sms.service';
import type { StaffAccountRecord } from '../staff/data/staff-accounts';
import { StaffAuthService, toPublicAccount } from '../staff/staff-auth.service';
import { StationsService } from '../stations/stations.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import {
  OperatorControlsService,
  type OperatorCode,
  type OperatorControlSettings,
  type OperatorLocks,
} from './operator-controls.service';
import {
  TransportOperator,
  TransportOperatorDocument,
} from '../platform/schemas/transport-operator.schema';

type AdminBranchStatus = 'healthy' | 'attention' | 'offline';

type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  branchId?: string;
};

type ReportColumn = { key: string; label: string };
type ReportRow = Record<string, string | number | null | undefined>;
type ReportSummaryMetric = { label: string; value: string; highlight?: boolean };

@Injectable()
export class AdminService {
  constructor(
    private readonly staffAuth: StaffAuthService,
    private readonly stationsService: StationsService,
    private readonly smsService: SmsService,
    private readonly operatorControls: OperatorControlsService,
    private readonly config: ConfigService,
    @InjectModel(Parcel.name) private readonly parcelModel: Model<ParcelDocument>,
    @InjectModel(TransportOperator.name)
    private readonly transportOperatorModel: Model<TransportOperatorDocument>,
  ) {}

  private async getOperatorBranding(operatorCode: string | null | undefined) {
    if (!operatorCode?.trim()) return null;
    const doc = await this.transportOperatorModel
      .findOne({ code: operatorCode.trim().toUpperCase() })
      .lean();
    if (!doc) return null;
    return {
      operatorName: doc.name,
      brandColor: doc.brandColor ?? '#fd7e14',
      logoDataUrl: doc.logoDataUrl ?? null,
    };
  }

  getOrCreateSettings(operator: OperatorCode) {
    return this.operatorControls.getOrCreateSettings(operator);
  }

  async getSessionPayload(staff: ReturnType<typeof toPublicAccount>, signedInAt: string) {
    const settings = await this.operatorControls.getOrCreateSettings(staff.operator);
    // Demo seed: hq.admin@parcela.app starts unconfigured until setup/complete;
    // other HQ admins treat the operator as already onboarded.
    const isPendingSetupAdmin = staff.email.toLowerCase() === 'hq.admin@parcela.app';
    const operatorConfigured = isPendingSetupAdmin ? settings.configured : true;
    const branding = await this.getOperatorBranding(staff.operator);

    return {
      admin: {
        id: staff.id,
        email: staff.email,
        displayName: staff.displayName,
        operator: staff.operator,
        operatorConfigured,
        operatorName: branding?.operatorName ?? null,
        brandColor: branding?.brandColor ?? null,
        logoDataUrl: branding?.logoDataUrl ?? null,
        mustChangePassword: staff.mustChangePassword ?? false,
      },
      signedInAt,
    };
  }

  /** Parcels for this transport only: origin or destination is one of the operator's stations. */
  private async operatorParcelMatch(operator: OperatorCode) {
    const stations = await this.stationsService.findAll({ operator });
    const stationIds = stations.map((s) => s.id);
    return {
      stations,
      stationIds,
      match: {
        $or: [
          { originStationId: { $in: stationIds } },
          { destinationStationId: { $in: stationIds } },
        ],
      } as Record<string, unknown>,
    };
  }

  async getOverview(operator: OperatorCode) {
    const branding = await this.getOperatorBranding(operator);
    const { stations, match: parcelMatch } = await this.operatorParcelMatch(operator);
    const accounts = this.staffAuth
      .getAccounts()
      .filter((account) => account.operator === operator);

    const leads = accounts.filter((a) => a.role === 'station_lead' && a.active);
    const staff = accounts.filter((a) => a.role === 'station_staff');

    const parcelStats = await this.parcelModel.aggregate<{
      _id: string;
      total: number;
      collected: number;
      in_transit: number;
      ready_for_collection: number;
    }>([
      { $match: parcelMatch },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ['$originStationId', stations.map((s) => s.id)] },
              '$originStationId',
              '$destinationStationId',
            ],
          },
          total: { $sum: 1 },
          collected: {
            $sum: { $cond: [{ $eq: ['$status', 'collected'] }, 1, 0] },
          },
          in_transit: {
            $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] },
          },
          ready_for_collection: {
            $sum: { $cond: [{ $eq: ['$status', 'ready_for_collection'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsByStation = new Map(parcelStats.map((row) => [row._id, row]));

    const alerts: Array<{
      id: string;
      severity: 'info' | 'warning';
      message: string;
      branchName?: string;
    }> = [];

    const branches = stations.map((station) => {
      const stationStaff = staff.filter((a) => a.stationId === station.id);
      const lead = leads.find((a) => a.stationId === station.id);
      const stats = statsByStation.get(station.id);
      const totalParcels = stats?.total ?? 0;
      const totalCollected = stats?.collected ?? 0;
      const inTransit = stats?.in_transit ?? 0;
      const readyForCollection = stats?.ready_for_collection ?? 0;
      const staffOnline = stationStaff.filter(
        (a) => a.active && this.staffAuth.getStaffPresence(a.id).online,
      ).length;

      let status: AdminBranchStatus = 'healthy';
      if (!lead) {
        status = 'attention';
        alerts.push({
          id: `no-lead-${station.id}`,
          severity: 'warning',
          message: `No active branch lead assigned`,
          branchName: station.name,
        });
      } else if (inTransit >= 15) {
        status = 'attention';
        alerts.push({
          id: `high-transit-${station.id}`,
          severity: 'warning',
          message: `${inTransit} parcels currently in transit`,
          branchName: station.name,
        });
      } else if (stationStaff.filter((a) => a.active).length === 0) {
        status = 'offline';
        alerts.push({
          id: `no-staff-${station.id}`,
          severity: 'info',
          message: `No active counter staff`,
          branchName: station.name,
        });
      }

      return {
        id: station.id,
        name: station.name,
        code: station.code,
        city: station.city,
        leadName: lead?.displayName ?? null,
        totalStaff: stationStaff.filter((a) => a.active).length,
        totalParcels,
        totalCollected,
        inTransit,
        readyForCollection,
        staffOnline,
        status,
      };
    });

    const totals = branches.reduce(
      (acc, branch) => {
        acc.totalParcels += branch.totalParcels;
        acc.inTransit += branch.inTransit;
        acc.readyForCollection += branch.readyForCollection;
        acc.totalCollected += branch.totalCollected;
        return acc;
      },
      { totalParcels: 0, inTransit: 0, readyForCollection: 0, totalCollected: 0 },
    );

    return {
      operatorLabel: branding?.operatorName ?? `${operator} Transport`,
      branchCount: stations.length,
      activeLeads: leads.length,
      activeStaff: staff.filter((a) => a.active).length,
      totalParcels: totals.totalParcels,
      inTransit: totals.inTransit,
      readyForCollection: totals.readyForCollection,
      totalCollected: totals.totalCollected,
      alerts,
      branches,
    };
  }

  async listStations(operator: OperatorCode) {
    const stations = await this.stationsService.findAll({ operator });
    const accounts = this.staffAuth
      .getAccounts()
      .filter((account) => account.operator === operator);

    return stations.map((station) => {
      const lead = accounts.find(
        (a) => a.role === 'station_lead' && a.stationId === station.id && a.active,
      );
      const staffCount = accounts.filter(
        (a) => a.role === 'station_staff' && a.stationId === station.id && a.active,
      ).length;

      return {
        ...station,
        leadName: lead?.displayName ?? null,
        leadPhone: lead?.phone ?? null,
        leadEmail: lead?.email ?? null,
        leadActive: lead?.active ?? false,
        totalStaff: staffCount,
      };
    });
  }

  listLeads(operator: OperatorCode) {
    return this.staffAuth
      .getAccounts()
      .filter((account) => account.operator === operator && account.role === 'station_lead')
      .map((account) => toPublicAccount(account));
  }

  async upsertLead(operator: OperatorCode, dto: CreateLeadDto) {
    const station = await this.stationsService.findByStationId(dto.stationId);
    if (!station || station.operator !== operator) {
      throw new NotFoundException('Station not found for this operator');
    }

    const phone = normalizeGhanaPhone(dto.leadPhone);
    const displayName = dto.leadName.trim();
    if (!displayName) {
      throw new BadRequestException('Lead name is required');
    }

    const email =
      dto.leadEmail?.trim().toLowerCase() ||
      `${displayName.toLowerCase().replace(/\s+/g, '.')}@parcela.lead`;

    const existingLead = this.staffAuth
      .getAccounts()
      .find(
        (account) =>
          account.role === 'station_lead' &&
          account.operator === operator &&
          account.stationId === station.id,
      );

    const phoneTaken = this.staffAuth
      .getAccounts()
      .some(
        (account) =>
          account.id !== existingLead?.id && normalizeGhanaPhone(account.phone) === phone,
      );
    if (phoneTaken) {
      throw new ConflictException('An account with this phone already exists');
    }

    const emailTaken = this.staffAuth
      .getAccounts()
      .some(
        (account) =>
          account.id !== existingLead?.id && account.email.toLowerCase() === email,
      );
    if (emailTaken) {
      throw new ConflictException('An account with this email already exists');
    }

    const tempPin = this.generateTempPin();
    const location = `${station.city} · ${station.name}`;

    if (existingLead) {
      existingLead.displayName = displayName;
      existingLead.phone = dto.leadPhone.trim();
      existingLead.email = email;
      existingLead.pin = ensureHashedSecret(tempPin);
      existingLead.active = true;
      existingLead.mustChangePassword = true;
      existingLead.stationName = station.name;
      existingLead.stationCode = station.code;
      existingLead.location = location;
      this.staffAuth.saveAccount(existingLead);

      const smsSent = await this.sendLeadCredentialsSms(
        existingLead,
        tempPin,
        station.name,
      );
      return { lead: toPublicAccount(existingLead), smsSent };
    }

    const record: StaffAccountRecord = {
      id: `lead-${station.id}-${Date.now()}`,
      displayName,
      email,
      phone: dto.leadPhone.trim(),
      password: ensureHashedSecret(tempPin),
      pin: ensureHashedSecret(tempPin),
      active: true,
      role: 'station_lead',
      operator,
      stationId: station.id,
      stationName: station.name,
      stationCode: station.code,
      location,
      mustChangePassword: true,
    };

    const lead = this.staffAuth.addAccount(record);
    const smsSent = await this.sendLeadCredentialsSms(
      { ...record, phone: dto.leadPhone.trim() },
      tempPin,
      station.name,
    );
    return { lead, smsSent };
  }

  async removeLead(operator: OperatorCode, stationId: string) {
    const lead = this.staffAuth
      .getAccounts()
      .find(
        (account) =>
          account.role === 'station_lead' &&
          account.operator === operator &&
          account.stationId === stationId,
      );

    if (!lead) {
      throw new NotFoundException('Branch lead not found for this station');
    }

    lead.active = false;
    this.staffAuth.saveAccount(lead);
    return { ok: true, lead: toPublicAccount(lead) };
  }

  async sendLeadCredentials(operator: OperatorCode, stationId: string) {
    const lead = this.staffAuth
      .getAccounts()
      .find(
        (account) =>
          account.role === 'station_lead' &&
          account.operator === operator &&
          account.stationId === stationId &&
          account.active,
      );

    if (!lead) {
      throw new NotFoundException('Active branch lead not found for this station');
    }

    const tempPin = this.generateTempPin();
    lead.pin = ensureHashedSecret(tempPin);
    lead.mustChangePassword = true;
    this.staffAuth.saveAccount(lead);

    const smsSent = await this.sendLeadCredentialsSms(lead, tempPin, lead.stationName);
    return { lead: toPublicAccount(lead), smsSent };
  }

  listPeople(operator: OperatorCode, query?: string) {
    const q = query?.trim().toLowerCase();
    return this.staffAuth
      .getAccounts()
      .filter(
        (account) =>
          account.operator === operator &&
          (account.role === 'station_staff' || account.role === 'station_lead') &&
          (!q ||
            account.displayName.toLowerCase().includes(q) ||
            account.email.toLowerCase().includes(q) ||
            account.phone.includes(q) ||
            account.stationName.toLowerCase().includes(q)),
      )
      .map((account) => {
        const presence = this.staffAuth.getStaffPresence(account.id);
        return {
          ...toPublicAccount(account),
          online: presence.online,
          lastLoginAt: presence.lastLoginAt,
          lastLogoutAt: presence.lastLogoutAt,
        };
      });
  }

  setPersonActive(operator: OperatorCode, accountId: string, active: boolean, actorId: string) {
    if (accountId === actorId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const account = this.staffAuth.findAccountById(accountId);
    if (
      !account ||
      account.operator !== operator ||
      (account.role !== 'station_staff' && account.role !== 'station_lead')
    ) {
      throw new NotFoundException('Person not found for this operator');
    }

    account.active = active;
    this.staffAuth.saveAccount(account);
    return toPublicAccount(account);
  }

  async listParcels(
    operator: OperatorCode,
    filters: {
      q?: string;
      status?: string;
      city?: string;
      branchId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const { stations, stationIds, match: baseMatch } = await this.operatorParcelMatch(operator);
    const match: Record<string, unknown> = { ...baseMatch };
    const andClauses: Record<string, unknown>[] = [];

    if (filters.status && filters.status !== 'all') {
      match.status = filters.status;
    }

    if (filters.branchId && filters.branchId !== 'all') {
      if (!stationIds.includes(filters.branchId)) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      andClauses.push({
        $or: [
          { originStationId: filters.branchId },
          { destinationStationId: filters.branchId },
        ],
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
      match.createdAt = createdAt;
    }

    const q = filters.q?.trim();
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andClauses.push({
        $or: [
          { bookingReference: regex },
          { senderName: regex },
          { senderPhone: regex },
          { recipientName: regex },
          { recipientPhone: regex },
          { originStationName: regex },
          { destinationStationName: regex },
          { busNumber: regex },
        ],
      });
    }

    if (filters.city && filters.city !== 'all' && (!filters.branchId || filters.branchId === 'all')) {
      const cityStationIds = stations.filter((s) => s.city === filters.city).map((s) => s.id);
      andClauses.push({
        $or: [
          { originStationId: { $in: cityStationIds } },
          { destinationStationId: { $in: cityStationIds } },
        ],
      });
    }

    if (andClauses.length) {
      match.$and = andClauses;
    }

    const [total, docs] = await Promise.all([
      this.parcelModel.countDocuments(match),
      this.parcelModel.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const stationById = new Map(stations.map((s) => [s.id, s]));

    const items = docs.map((p) => {
      const origin = stationById.get(p.originStationId);
      const destination = stationById.get(p.destinationStationId);
      const createdAt =
        (p as { createdAt?: Date }).createdAt?.toISOString?.() ??
        (p as { createdAt?: string }).createdAt ??
        null;
      const updatedAt =
        (p as { updatedAt?: Date }).updatedAt?.toISOString?.() ??
        (p as { updatedAt?: string }).updatedAt ??
        null;

      return {
        bookingReference: p.bookingReference,
        status: p.status,
        senderName: p.senderName,
        senderPhone: p.senderPhone,
        recipientName: p.recipientName,
        recipientPhone: p.recipientPhone,
        originStationId: p.originStationId,
        originStationName: p.originStationName,
        originStationCode: p.originStationCode,
        originCity: origin?.city ?? null,
        destinationStationId: p.destinationStationId,
        destinationStationName: p.destinationStationName,
        destinationCity: destination?.city ?? null,
        itemCount: Array.isArray(p.items) ? p.items.length : 0,
        busNumber: p.busNumber ?? null,
        arrivedAt: p.arrivedAt ? new Date(p.arrivedAt).toISOString() : null,
        createdAt,
        updatedAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getControls(operator: OperatorCode) {
    const settings = await this.operatorControls.getOrCreateSettings(operator);
    return this.operatorControls.toPublic(settings);
  }

  setLocks(operator: OperatorCode, locks: Partial<OperatorLocks>, actor: string) {
    return this.operatorControls.setLocks(operator, locks, actor);
  }

  setSettings(operator: OperatorCode, input: Partial<OperatorControlSettings>, actor: string) {
    return this.operatorControls.setSettings(operator, input, actor);
  }

  isBookingsLocked(operator: OperatorCode) {
    return this.operatorControls.isBookingsLocked(operator);
  }

  isStaffOpsLocked(operator: OperatorCode) {
    return this.operatorControls.isStaffOpsLocked(operator);
  }

  isLeadOpsLocked(operator: OperatorCode) {
    return this.operatorControls.isLeadOpsLocked(operator);
  }

  completeSetup(operator: OperatorCode, actor: string) {
    return this.operatorControls.completeSetup(operator, actor);
  }

  async buildReport(operator: OperatorCode, moduleId: string, filters: ReportFilters) {
    const overview = await this.getOverview(operator);
    let branches = overview.branches;

    if (filters.city && filters.city !== 'all') {
      branches = branches.filter((b) => b.city === filters.city);
    }
    if (filters.branchId && filters.branchId !== 'all') {
      branches = branches.filter((b) => b.id === filters.branchId);
    }

    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    const daySpan =
      dateFrom && dateTo
        ? Math.max(
            1,
            Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000)) + 1,
          )
        : 7;

    switch (moduleId) {
      case 'activities':
        return this.buildActivitiesReport(operator, branches, dateFrom, dateTo, daySpan);
      case 'cross-branch':
        return this.buildCrossBranchReport(branches);
      case 'delayed-parcels':
        return this.buildDelayedParcelsReport(operator, branches, dateFrom, dateTo);
      case 'branch-performance':
        return this.buildBranchPerformanceReport(branches);
      case 'parcel-register':
        return this.buildParcelRegisterReport(operator, branches, dateFrom, dateTo);
      default:
        throw new BadRequestException(`Unknown report module: ${moduleId}`);
    }
  }

  private async buildParcelRegisterReport(
    operator: OperatorCode,
    branches: Awaited<ReturnType<AdminService['getOverview']>>['branches'],
    dateFrom: Date | null,
    dateTo: Date | null,
  ): Promise<{ columns: ReportColumn[]; rows: ReportRow[]; summary: ReportSummaryMetric[] }> {
    const stationIds = new Set(branches.map((b) => b.id));
    const { match: baseMatch } = await this.operatorParcelMatch(operator);
    const match: Record<string, unknown> = { ...baseMatch };
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = dateFrom;
      if (dateTo) createdAt.$lte = dateTo;
      match.createdAt = createdAt;
    }

    type ParcelLean = {
      bookingReference: string;
      status: string;
      senderName: string;
      senderPhone: string;
      recipientName: string;
      recipientPhone: string;
      originStationId: string;
      originStationName: string;
      destinationStationId: string;
      destinationStationName: string;
      busNumber?: string;
      items?: unknown[];
      createdAt?: Date;
      arrivedAt?: Date;
    };

    const parcels = (await this.parcelModel
      .find(match)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()) as ParcelLean[];

    const branchById = new Map(branches.map((b) => [b.id, b]));
    const rows: ReportRow[] = parcels
      .filter(
        (p) =>
          stationIds.size === 0 ||
          stationIds.has(p.originStationId) ||
          stationIds.has(p.destinationStationId),
      )
      .map((p) => {
        const origin = branchById.get(p.originStationId);
        const destination = branchById.get(p.destinationStationId);
        return {
          reference: p.bookingReference,
          status: p.status,
          bookedAt: p.createdAt
            ? new Date(p.createdAt).toLocaleString('en-GH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '—',
          sender: p.senderName,
          senderPhone: p.senderPhone,
          recipient: p.recipientName,
          recipientPhone: p.recipientPhone,
          origin: p.originStationName,
          originCity: origin?.city ?? '—',
          destination: p.destinationStationName,
          destinationCity: destination?.city ?? '—',
          items: Array.isArray(p.items) ? p.items.length : 0,
          bus: p.busNumber ?? '—',
          arrivedAt: p.arrivedAt
            ? new Date(p.arrivedAt).toLocaleString('en-GH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '—',
        };
      });

    const byStatus: Record<string, number> = {};
    for (const row of rows) {
      const key = String(row.status ?? 'unknown');
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    }

    return {
      columns: [
        { key: 'reference', label: 'Parcel code' },
        { key: 'bookedAt', label: 'Booked at' },
        { key: 'status', label: 'Status' },
        { key: 'sender', label: 'Sender' },
        { key: 'senderPhone', label: 'Sender phone' },
        { key: 'recipient', label: 'Receiver' },
        { key: 'recipientPhone', label: 'Receiver phone' },
        { key: 'origin', label: 'Origin' },
        { key: 'originCity', label: 'Origin city' },
        { key: 'destination', label: 'Destination' },
        { key: 'destinationCity', label: 'Dest. city' },
        { key: 'items', label: 'Items' },
        { key: 'bus', label: 'Bus' },
        { key: 'arrivedAt', label: 'Arrived at' },
      ],
      rows,
      summary: [
        { label: 'Parcels', value: String(rows.length), highlight: true },
        { label: 'In transit', value: String(byStatus.in_transit ?? 0) },
        {
          label: 'Awaiting pickup',
          value: String(byStatus.ready_for_collection ?? 0),
        },
        { label: 'Collected', value: String(byStatus.collected ?? 0) },
      ],
    };
  }

  private async buildActivitiesReport(
    operator: OperatorCode,
    branches: Awaited<ReturnType<AdminService['getOverview']>>['branches'],
    dateFrom: Date | null,
    dateTo: Date | null,
    daySpan: number,
  ): Promise<{ columns: ReportColumn[]; rows: ReportRow[]; summary: ReportSummaryMetric[] }> {
    const { match: baseMatch } = await this.operatorParcelMatch(operator);
    const match: Record<string, unknown> = { ...baseMatch };
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = dateFrom;
      if (dateTo) createdAt.$lte = dateTo;
      match.createdAt = createdAt;
    }

    const stationIds = new Set(branches.map((b) => b.id));
    const parcels = await this.parcelModel.find(match).lean();

    const rows: ReportRow[] = branches.map((branch) => {
      const branchParcels = parcels.filter(
        (p) =>
          (p.originStationId === branch.id || p.destinationStationId === branch.id) &&
          stationIds.has(branch.id),
      );
      const logged = branchParcels.length;
      const collected = branchParcels.filter((p) => p.status === 'collected').length;
      const inTransit = branchParcels.filter((p) => p.status === 'in_transit').length;
      const awaiting = branchParcels.filter((p) => p.status === 'ready_for_collection').length;
      return {
        branch: branch.name,
        city: branch.city,
        code: branch.code,
        logged,
        collected,
        inTransit,
        awaiting,
      };
    });

    const totals = { logged: 0, collected: 0, inTransit: 0, awaiting: 0 };
    for (const row of rows) {
      totals.logged += Number(row.logged ?? 0);
      totals.collected += Number(row.collected ?? 0);
      totals.inTransit += Number(row.inTransit ?? 0);
      totals.awaiting += Number(row.awaiting ?? 0);
    }

    return {
      columns: [
        { key: 'branch', label: 'Branch' },
        { key: 'city', label: 'City' },
        { key: 'code', label: 'Code' },
        { key: 'logged', label: 'Logged' },
        { key: 'collected', label: 'Collected' },
        { key: 'inTransit', label: 'In transit' },
        { key: 'awaiting', label: 'Awaiting pickup' },
      ],
      rows,
      summary: [
        { label: 'Period days', value: String(daySpan) },
        { label: 'Parcels logged', value: String(totals.logged), highlight: true },
        { label: 'Collected', value: String(totals.collected) },
        { label: 'In transit', value: String(totals.inTransit) },
      ],
    };
  }

  private buildCrossBranchReport(
    branches: Awaited<ReturnType<AdminService['getOverview']>>['branches'],
  ): { columns: ReportColumn[]; rows: ReportRow[]; summary: ReportSummaryMetric[] } {
    const rows: ReportRow[] = branches.map((branch) => ({
      branch: branch.name,
      city: branch.city,
      code: branch.code,
      lead: branch.leadName ?? '—',
      staff: branch.totalStaff,
      parcels: branch.totalParcels,
      collected: branch.totalCollected,
      inTransit: branch.inTransit,
      status: branch.status,
    }));

    const totalParcels = branches.reduce((sum, b) => sum + b.totalParcels, 0);
    const totalCollected = branches.reduce((sum, b) => sum + b.totalCollected, 0);

    return {
      columns: [
        { key: 'branch', label: 'Branch' },
        { key: 'city', label: 'City' },
        { key: 'code', label: 'Code' },
        { key: 'lead', label: 'Lead' },
        { key: 'staff', label: 'Staff' },
        { key: 'parcels', label: 'Parcels' },
        { key: 'collected', label: 'Collected' },
        { key: 'inTransit', label: 'In transit' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      summary: [
        { label: 'Branches', value: String(branches.length) },
        { label: 'Total parcels', value: String(totalParcels), highlight: true },
        { label: 'Collected', value: String(totalCollected) },
      ],
    };
  }

  private async buildDelayedParcelsReport(
    operator: OperatorCode,
    branches: Awaited<ReturnType<AdminService['getOverview']>>['branches'],
    dateFrom: Date | null,
    dateTo: Date | null,
  ): Promise<{ columns: ReportColumn[]; rows: ReportRow[]; summary: ReportSummaryMetric[] }> {
    const stationIds = new Set(branches.map((b) => b.id));
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const { match: baseMatch } = await this.operatorParcelMatch(operator);
    const match: Record<string, unknown> = {
      ...baseMatch,
      status: { $in: ['in_transit', 'ready_for_collection'] },
      updatedAt: { $lte: cutoff },
    };
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = dateFrom;
      if (dateTo) createdAt.$lte = dateTo;
      match.createdAt = createdAt;
    }

    type DelayedParcel = {
      bookingReference: string;
      originStationId: string;
      destinationStationId: string;
      destinationStationName: string;
      status: string;
      recipientName: string;
      updatedAt?: Date;
      createdAt?: Date;
    };

    const parcels = (await this.parcelModel
      .find(match)
      .sort({ updatedAt: 1 })
      .limit(200)
      .lean()) as DelayedParcel[];
    const branchById = new Map(branches.map((b) => [b.id, b]));

    const rows: ReportRow[] = parcels
      .filter(
        (p) =>
          stationIds.has(p.originStationId) || stationIds.has(p.destinationStationId),
      )
      .map((p) => {
        const branch =
          branchById.get(p.destinationStationId) ?? branchById.get(p.originStationId);
        const stuckSince = p.updatedAt ?? p.createdAt ?? new Date();
        const hoursStuck = Math.round(
          (Date.now() - new Date(stuckSince).getTime()) / (60 * 60 * 1000),
        );
        return {
          reference: p.bookingReference,
          branch: branch?.name ?? p.destinationStationName,
          city: branch?.city ?? '—',
          status: p.status,
          hoursStuck,
          recipient: p.recipientName,
        };
      });

    return {
      columns: [
        { key: 'reference', label: 'Booking ref' },
        { key: 'branch', label: 'Branch' },
        { key: 'city', label: 'City' },
        { key: 'status', label: 'Status' },
        { key: 'hoursStuck', label: 'Hours stuck' },
        { key: 'recipient', label: 'Recipient' },
      ],
      rows,
      summary: [
        { label: 'Delayed parcels', value: String(rows.length), highlight: true },
        {
          label: 'Threshold',
          value: '48h without status change',
        },
      ],
    };
  }

  private buildBranchPerformanceReport(
    branches: Awaited<ReturnType<AdminService['getOverview']>>['branches'],
  ): { columns: ReportColumn[]; rows: ReportRow[]; summary: ReportSummaryMetric[] } {
    const rows: ReportRow[] = branches.map((branch) => {
      const collectionRate =
        branch.totalParcels > 0
          ? Math.round((branch.totalCollected / branch.totalParcels) * 100)
          : 0;
      return {
        branch: branch.name,
        city: branch.city,
        code: branch.code,
        lead: branch.leadName ?? 'Unassigned',
        staff: branch.totalStaff,
        staffOnline: branch.staffOnline,
        parcels: branch.totalParcels,
        collected: branch.totalCollected,
        collectionRate: `${collectionRate}%`,
        status: branch.status,
      };
    });

    const attention = branches.filter((b) => b.status === 'attention').length;

    return {
      columns: [
        { key: 'branch', label: 'Branch' },
        { key: 'city', label: 'City' },
        { key: 'code', label: 'Code' },
        { key: 'lead', label: 'Lead' },
        { key: 'staff', label: 'Staff' },
        { key: 'staffOnline', label: 'Online' },
        { key: 'parcels', label: 'Parcels' },
        { key: 'collected', label: 'Collected' },
        { key: 'collectionRate', label: 'Collection rate' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      summary: [
        { label: 'Branches', value: String(branches.length) },
        { label: 'Need attention', value: String(attention), highlight: attention > 0 },
      ],
    };
  }

  private generateTempPin() {
    return String(randomInt(100000, 1000000));
  }

  private async sendLeadCredentialsSms(
    lead: Pick<StaffAccountRecord, 'phone' | 'displayName'>,
    tempPin: string,
    stationName: string,
  ) {
    const webUrl = (
      this.config.get<string>('app.publicWebUrl') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    const message = [
      `Parcela branch lead access for ${stationName} is ready.`,
      `Sign in: ${webUrl}/lead/login`,
      `Phone: ${lead.phone}`,
      `Temporary PIN: ${tempPin}`,
    ].join(' ');
    return this.smsService.sendSms(lead.phone, message);
  }
}
