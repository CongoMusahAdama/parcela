import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { HealthController } from './health/health.controller';
import { ParcelsModule } from './parcels/parcels.module';
import { SeedModule } from './seed/seed.module';
import { SmsModule } from './sms/sms.module';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
      }),
    }),
    SeedModule,
    StationsModule,
    ParcelsModule,
    SmsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
