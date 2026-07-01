import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GHANA_STATIONS } from '../data/ghana-stations';
import { Parcel, ParcelDocument } from '../parcels/schemas/parcel.schema';
import { Station, StationDocument } from '../stations/schemas/station.schema';

/** Legacy demo pickup codes seeded before demo data was removed */
const LEGACY_DEMO_PICKUP_CODES = [
  'PKP-4829',
  'PKP-7102',
  'PKP-3351',
  'PKP-PEND',
  'PKP-DONE',
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Station.name) private readonly stationModel: Model<StationDocument>,
    @InjectModel(Parcel.name) private readonly parcelModel: Model<ParcelDocument>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<boolean>('seed.onStartup') !== false) {
      await this.seedAll();
    }
  }

  async seedAll(options?: { reset?: boolean }) {
    const reset = options?.reset ?? this.config.get<boolean>('seed.reset') === true;

    if (reset) {
      this.logger.warn('SEED_RESET=true — clearing legacy demo parcels');
    }

    await this.clearLegacyDemoParcels();

    const stations = await this.seedStations();
    this.logger.log(`Seed complete: ${stations.upserted} stations upserted`);
    return { stations };
  }

  async clearLegacyDemoParcels() {
    const result = await this.parcelModel.deleteMany({
      pickupCode: { $in: LEGACY_DEMO_PICKUP_CODES },
    });
    if (result.deletedCount > 0) {
      this.logger.log(`Removed ${result.deletedCount} legacy demo parcel(s)`);
    }
  }

  async seedStations() {
    const ops = GHANA_STATIONS.map((s) => ({
      updateOne: {
        filter: { stationId: s.id },
        update: {
          $set: {
            stationId: s.id,
            name: s.name,
            code: s.code,
            address: s.address,
            city: s.city,
            hours: s.hours,
            lat: s.lat,
            lng: s.lng,
            operator: s.operator,
            active: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await this.stationModel.bulkWrite(ops);
    const upserted = (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
    this.logger.log(
      `Stations: ${GHANA_STATIONS.length} synced (${result.upsertedCount ?? 0} new, ${result.modifiedCount ?? 0} updated)`,
    );
    return { total: GHANA_STATIONS.length, upserted };
  }
}
