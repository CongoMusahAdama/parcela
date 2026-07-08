import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { SmsModule } from '../sms/sms.module';
import { StationsModule } from '../stations/stations.module';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { Parcel, ParcelSchema } from './schemas/parcel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Parcel.name, schema: ParcelSchema }]),
    StationsModule,
    SmsModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
