import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsModule } from '../sms/sms.module';
import { StaffModule } from '../staff/staff.module';
import { PlatformAuthController } from './controllers/platform-auth.controller';
import { PlatformOperatorsController } from './controllers/platform-operators.controller';
import { PlatformPeopleController } from './controllers/platform-people.controller';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { PlatformAdmin, PlatformAdminSchema } from './schemas/platform-admin.schema';
import { PlatformAuditEntry, PlatformAuditEntrySchema } from './schemas/platform-audit.schema';
import {
  TransportOperator,
  TransportOperatorSchema,
} from './schemas/transport-operator.schema';
import { PlatformAuditService } from './services/platform-audit.service';
import { PlatformAuthService } from './services/platform-auth.service';
import { PlatformOperatorsService } from './services/platform-operators.service';
import { PlatformPeopleService } from './services/platform-people.service';
import { PlatformWorkspaceService } from './services/platform-workspace.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformAdmin.name, schema: PlatformAdminSchema },
      { name: TransportOperator.name, schema: TransportOperatorSchema },
      { name: PlatformAuditEntry.name, schema: PlatformAuditEntrySchema },
    ]),
    StaffModule,
    SmsModule,
  ],
  controllers: [PlatformAuthController, PlatformOperatorsController, PlatformPeopleController],
  providers: [
    PlatformAuthService,
    PlatformAuthGuard,
    PlatformOperatorsService,
    PlatformPeopleService,
    PlatformAuditService,
    PlatformWorkspaceService,
  ],
  exports: [PlatformOperatorsService, PlatformAuditService],
})
export class PlatformModule {}
