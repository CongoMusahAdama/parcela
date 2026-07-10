import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperatorSettings, OperatorSettingsDocument } from '../admin/schemas/operator-settings.schema';
import { Parcel, ParcelDocument } from '../parcels/schemas/parcel.schema';
import {
  PlatformAuditEntry,
  PlatformAuditDocument,
} from '../platform/schemas/platform-audit.schema';
import {
  TransportOperator,
  TransportOperatorDocument,
} from '../platform/schemas/transport-operator.schema';
import { StaffAccount, StaffAccountDocument } from '../staff/schemas/staff-account.schema';

export type WorkspaceResetResult = {
  parcels: number;
  staffAccounts: number;
  transportOperators: number;
  platformAudit: number;
  operatorSettings: number;
};

/**
 * Wipes tenant data for a fresh platform onboard.
 * Keeps: platform_admins, station catalog (Ghana terminals reference data).
 */
@Injectable()
export class WorkspaceResetService {
  private readonly logger = new Logger(WorkspaceResetService.name);

  constructor(
    @InjectModel(Parcel.name) private readonly parcelModel: Model<ParcelDocument>,
    @InjectModel(StaffAccount.name) private readonly staffModel: Model<StaffAccountDocument>,
    @InjectModel(TransportOperator.name)
    private readonly operatorModel: Model<TransportOperatorDocument>,
    @InjectModel(PlatformAuditEntry.name)
    private readonly auditModel: Model<PlatformAuditDocument>,
    @InjectModel(OperatorSettings.name)
    private readonly operatorSettingsModel: Model<OperatorSettingsDocument>,
  ) {}

  async resetForOnboarding(): Promise<WorkspaceResetResult> {
    this.logger.warn('Workspace reset — removing operators, users, parcels, and audit data');

    const [parcels, staffAccounts, transportOperators, platformAudit, operatorSettings] =
      await Promise.all([
        this.parcelModel.deleteMany({}),
        this.staffModel.deleteMany({}),
        this.operatorModel.deleteMany({}),
        this.auditModel.deleteMany({}),
        this.operatorSettingsModel.deleteMany({}),
      ]);

    const result: WorkspaceResetResult = {
      parcels: parcels.deletedCount ?? 0,
      staffAccounts: staffAccounts.deletedCount ?? 0,
      transportOperators: transportOperators.deletedCount ?? 0,
      platformAudit: platformAudit.deletedCount ?? 0,
      operatorSettings: operatorSettings.deletedCount ?? 0,
    };

    this.logger.log(
      `Workspace reset complete — parcels=${result.parcels}, staff=${result.staffAccounts}, operators=${result.transportOperators}, audit=${result.platformAudit}, operator_settings=${result.operatorSettings}`,
    );

    return result;
  }
}
