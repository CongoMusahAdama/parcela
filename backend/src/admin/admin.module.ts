import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Parcel, ParcelSchema } from '../parcels/schemas/parcel.schema';
import { SmsModule } from '../sms/sms.module';
import { StaffAccount, StaffAccountSchema } from '../staff/schemas/staff-account.schema';
import { StaffModule } from '../staff/staff.module';
import { StationsModule } from '../stations/stations.module';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OperatorControlsService } from './operator-controls.service';
import {
  OperatorSettings,
  OperatorSettingsSchema,
} from './schemas/operator-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OperatorSettings.name, schema: OperatorSettingsSchema },
      { name: StaffAccount.name, schema: StaffAccountSchema },
      { name: Parcel.name, schema: ParcelSchema },
    ]),
    forwardRef(() => StaffModule),
    StationsModule,
    SmsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard, OperatorControlsService],
  exports: [AdminService, OperatorControlsService],
})
export class AdminModule {}
