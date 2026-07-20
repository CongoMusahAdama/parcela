import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsModule } from '../sms/sms.module';
import { StaffModule } from '../staff/staff.module';
import { StationsModule } from '../stations/stations.module';
import { OperatorSettings, OperatorSettingsSchema } from '../admin/schemas/operator-settings.schema';
import { Parcel, ParcelSchema } from '../parcels/schemas/parcel.schema';
import { PortalUpdatesModule } from './portal-updates.module';
import { PlatformAuthController } from './controllers/platform-auth.controller';
import { PlatformNotificationsController } from './controllers/platform-notifications.controller';
import { PlatformOperatorsController } from './controllers/platform-operators.controller';
import { PlatformPeopleController } from './controllers/platform-people.controller';
import { PublicOperatorsController } from './controllers/public-operators.controller';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { PlatformAdmin, PlatformAdminSchema } from './schemas/platform-admin.schema';
import { PlatformAuditEntry, PlatformAuditEntrySchema } from './schemas/platform-audit.schema';
import {
  TransportOperator,
  TransportOperatorSchema,
} from './schemas/transport-operator.schema';
import { PlatformAuditService } from './services/platform-audit.service';
import { PlatformAuthService } from './services/platform-auth.service';
import { PlatformNotificationsService } from './services/platform-notifications.service';
import { PlatformOperatorsService } from './services/platform-operators.service';
import { PlatformPeopleService } from './services/platform-people.service';
import { PlatformWorkspaceService } from './services/platform-workspace.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformAdmin.name, schema: PlatformAdminSchema },
      { name: TransportOperator.name, schema: TransportOperatorSchema },
      { name: PlatformAuditEntry.name, schema: PlatformAuditEntrySchema },
      { name: OperatorSettings.name, schema: OperatorSettingsSchema },
      { name: Parcel.name, schema: ParcelSchema },
    ]),
    PortalUpdatesModule,
    StaffModule,
    SmsModule,
    StationsModule,
  ],
  controllers: [
    PlatformAuthController,
    PlatformOperatorsController,
    PlatformPeopleController,
    PlatformNotificationsController,
    PublicOperatorsController,
  ],
  providers: [
    PlatformAuthService,
    PlatformAuthGuard,
    PlatformOperatorsService,
    PlatformPeopleService,
    PlatformNotificationsService,
    PlatformAuditService,
    PlatformWorkspaceService,
  ],
  exports: [PlatformOperatorsService, PlatformAuditService],
})
export class PlatformModule {}
