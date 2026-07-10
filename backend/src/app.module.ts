import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { getEnvFilePaths } from './config/env-paths';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';
import { ParcelsModule } from './parcels/parcels.module';
import { PlatformModule } from './platform/platform.module';
import { SeedModule } from './seed/seed.module';
import { SmsModule } from './sms/sms.module';
import { StaffModule } from './staff/staff.module';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: getEnvFilePaths(),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    SeedModule,
    StationsModule,
    ParcelsModule,
    StaffModule,
    AdminModule,
    PlatformModule,
    SmsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
