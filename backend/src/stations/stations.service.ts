import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GHANA_STATIONS } from '../data/ghana-stations';
import { GHANA_CITIES, mergeGhanaCities, resolveGhanaCityName } from '../data/ghana-cities';
import { haversineKm } from '../common/utils/geo.util';
import { Station, StationDocument } from './schemas/station.schema';

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    @InjectModel(Station.name) private readonly stationModel: Model<StationDocument>,
  ) {}

  async findAll(params: {    q?: string;
    operator?: string;
    lat?: number;
    lng?: number;
    excludeId?: string;
  }) {
    const filter: Record<string, unknown> = { active: true };
    if (params.operator) filter.operator = params.operator;
    if (params.excludeId) filter.stationId = { $ne: params.excludeId };

    let stations = await this.stationModel.find(filter).lean();

    if (params.q?.trim()) {
      const q = params.q.trim().toLowerCase();
      stations = stations.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q),
      );
    }

    let result = stations.map((s) => this.toPublic(s));

    if (
      params.lat != null &&
      params.lng != null &&
      !Number.isNaN(params.lat) &&
      !Number.isNaN(params.lng)
    ) {
      result = result
        .map((s) => ({
          ...s,
          distanceKm: haversineKm(params.lat!, params.lng!, s.lat, s.lng),
        }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return result;
  }

  async findByStationId(stationId: string) {
    const station = await this.stationModel.findOne({ stationId, active: true }).lean();
    return station ? this.toPublic(station) : null;
  }

  async findByCityAndOperator(city: string, operator: string) {
    const stations = await this.stationModel
      .find({ active: true, city: city.trim(), operator })
      .sort({ name: 1 })
      .lean();
    return stations.map((s) => this.toPublic(s));
  }

  async findByOperatorCode(operatorCode: string) {
    const code = operatorCode.trim().toUpperCase();
    const stations = await this.stationModel
      .find({ operator: code, active: true })
      .sort({ city: 1, name: 1 })
      .lean();
    return stations.map((station) => this.toPublic(station));
  }

  async countNetworkByOperator(operatorCode: string) {
    const code = operatorCode.trim().toUpperCase();
    const stations = await this.stationModel.find({ operator: code, active: true }).select('city').lean();
    const cities = new Set(
      stations.map((station) => station.city.trim().toLowerCase()).filter(Boolean),
    );
    return {
      stationCount: stations.length,
      cityCount: cities.size,
    };
  }

  async seedOperatorTerminals(
    operatorCode: string,
    terminals: Array<{ name: string; city: string }>,
  ): Promise<{ created: number; skipped: number }> {
    const code = operatorCode.trim().toUpperCase();
    let created = 0;
    let skipped = 0;
    const existingCount = await this.stationModel.countDocuments({ operator: code, active: true });

    for (const [index, terminal] of terminals.entries()) {
      const name = terminal.name.trim();
      const city = resolveGhanaCityName(terminal.city);
      if (!name || !city) {
        skipped += 1;
        continue;
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);
      let stationId = `${code.toLowerCase()}-${slug || `terminal-${index + 1}`}`;
      let suffix = 0;
      while (await this.stationModel.findOne({ stationId }).lean()) {
        suffix += 1;
        stationId = `${code.toLowerCase()}-${slug || `terminal-${index + 1}`}-${suffix}`;
        if (suffix > 50) {
          skipped += 1;
          break;
        }
      }
      if (suffix > 50) continue;

      const coords = this.coordsForCity(city);
      await this.stationModel.create({
        stationId,
        name,
        code: `${code}-${String(existingCount + created + 1).padStart(2, '0')}`,
        address: `${city}, Ghana`,
        city,
        hours: 'Mon–Sun 6:00–20:00',
        lat: coords.lat,
        lng: coords.lng,
        operator: code,
        active: true,
      });
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} terminal(s) for operator ${code}`);
    }
    return { created, skipped };
  }

  async removeByOperator(operatorCode: string): Promise<number> {
    const code = operatorCode.trim().toUpperCase();
    const result = await this.stationModel.deleteMany({ operator: code });
    if ((result.deletedCount ?? 0) > 0) {
      this.logger.log(`Removed ${result.deletedCount} station(s) for operator ${code}`);
    }
    return result.deletedCount ?? 0;
  }

  async listGhanaCities() {
    const fromDb = await this.stationModel.distinct('city');
    return mergeGhanaCities(GHANA_CITIES, fromDb);
  }

  private coordsForCity(city: string) {
    const match = GHANA_STATIONS.find(
      (station) => station.city.toLowerCase() === city.trim().toLowerCase(),
    );
    if (match) return { lat: match.lat, lng: match.lng };
    return { lat: 5.6037, lng: -0.187 };
  }

  private toPublic(station: {
    stationId: string;
    name: string;
    code: string;
    address: string;
    city: string;
    hours: string;
    lat: number;
    lng: number;
    operator: string;
  }) {
    return {
      id: station.stationId,
      name: station.name,
      code: station.code,
      address: station.address,
      city: station.city,
      hours: station.hours,
      lat: station.lat,
      lng: station.lng,
      operator: station.operator,
    };
  }
}
