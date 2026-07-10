import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorSettings, OperatorSettingsSchema } from '../admin/schemas/operator-settings.schema';
import { Parcel, ParcelSchema } from '../parcels/schemas/parcel.schema';
import {
  PlatformAuditEntry,
  PlatformAuditEntrySchema,
} from '../platform/schemas/platform-audit.schema';
import {
  TransportOperator,
  TransportOperatorSchema,
} from '../platform/schemas/transport-operator.schema';
import { StaffAccount, StaffAccountSchema } from '../staff/schemas/staff-account.schema';
import { Station, StationSchema } from '../stations/schemas/station.schema';
import { SeedService } from './seed.service';
import { WorkspaceResetService } from './workspace-reset.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema },
      { name: Parcel.name, schema: ParcelSchema },
      { name: StaffAccount.name, schema: StaffAccountSchema },
      { name: TransportOperator.name, schema: TransportOperatorSchema },
      { name: PlatformAuditEntry.name, schema: PlatformAuditEntrySchema },
      { name: OperatorSettings.name, schema: OperatorSettingsSchema },
    ]),
  ],
  providers: [SeedService, WorkspaceResetService],
  exports: [SeedService, WorkspaceResetService],
})
export class SeedModule {}
