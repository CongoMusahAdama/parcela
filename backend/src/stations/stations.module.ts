import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TransportOperator,
  TransportOperatorSchema,
} from '../platform/schemas/transport-operator.schema';
import { Station, StationSchema } from './schemas/station.schema';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema },
      { name: TransportOperator.name, schema: TransportOperatorSchema },
    ]),
  ],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
