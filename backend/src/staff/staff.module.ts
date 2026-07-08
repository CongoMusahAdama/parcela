import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { ParcelsModule } from '../parcels/parcels.module';
import { SmsModule } from '../sms/sms.module';
import { StationsModule } from '../stations/stations.module';
import { LeadAuthGuard } from './lead-auth.guard';
import { LeadController } from './lead.controller';
import { LeadTeamService } from './lead-team.service';
import { StaffAccount, StaffAccountSchema } from './schemas/staff-account.schema';
import { StaffAuthGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StaffAccount.name, schema: StaffAccountSchema }]),
    ParcelsModule,
    SmsModule,
    StationsModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [StaffController, LeadController],
  providers: [StaffAuthService, StaffAuthGuard, LeadAuthGuard, LeadTeamService],
  exports: [StaffAuthService, MongooseModule],
})
export class StaffModule {}
