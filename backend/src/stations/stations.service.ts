import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GHANA_STATIONS } from '../data/ghana-stations';
import { GHANA_CITIES, mergeGhanaCities, resolveGhanaCityName } from '../data/ghana-cities';
import { haversineKm } from '../common/utils/geo.util';
import {
  TransportOperator,
  TransportOperatorDocument,
} from '../platform/schemas/transport-operator.schema';
import { Station, StationDocument } from './schemas/station.schema';

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    @InjectModel(Station.name) private readonly stationModel: Model<StationDocument>,
    @InjectModel(TransportOperator.name)
    private readonly operatorModel: Model<TransportOperatorDocument>,
  ) {}

  /** Operator codes that are onboarded and bookable by senders (not suspended). */
  async listPublicOperatorCodes(): Promise<string[]> {
    const rows = await this.operatorModel
      .find({ status: { $ne: 'suspended' } })
      .select('code')
      .lean();
    return rows.map((row) => row.code.trim().toUpperCase()).filter(Boolean);
  }

  async findAll(params: {
    q?: string;
    operator?: string;
    lat?: number;
    lng?: number;
    excludeId?: string;
  }) {
    const publicOperators = await this.listPublicOperatorCodes();
    if (publicOperators.length === 0) {
      return [];
    }

    const filter: Record<string, unknown> = {
      active: true,
      operator: { $in: publicOperators },
    };
    if (params.operator) {
      const code = params.operator.trim().toUpperCase();
      if (!publicOperators.includes(code)) return [];
      filter.operator = code;
    }
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

      const slot = existingCount + created;
      const coords = this.coordsForCity(city, slot);
      await this.stationModel.create({
        stationId,
        name,
        code: `${code}-${String(slot + 1).padStart(2, '0')}`,
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

  /**
   * Hide catalog terminals whose transport was never onboarded (e.g. legacy VIP/STC seed).
   * Keeps stations for every active/configure TransportOperator.
   */
  async deactivateStationsForMissingOperators(): Promise<number> {
    const publicOperators = await this.listPublicOperatorCodes();
    const filter =
      publicOperators.length === 0
        ? { active: true }
        : { active: true, operator: { $nin: publicOperators } };
    const result = await this.stationModel.updateMany(filter, { $set: { active: false } });
    const count = result.modifiedCount ?? 0;
    if (count > 0) {
      this.logger.log(`Deactivated ${count} station(s) for operators not in the platform catalog`);
    }
    return count;
  }

  /**
   * Spread stacked city-center pins so HQ-added terminals are separately visible on the map.
   */
  async spreadStackedOperatorStations(operatorCode?: string): Promise<number> {
    const filter: Record<string, unknown> = { active: true };
    if (operatorCode) filter.operator = operatorCode.trim().toUpperCase();

    const stations = await this.stationModel.find(filter).sort({ operator: 1, city: 1, name: 1 });
    const byKey = new Map<string, typeof stations>();
    for (const station of stations) {
      const key = `${station.operator}::${station.city.trim().toLowerCase()}::${station.lat.toFixed(4)},${station.lng.toFixed(4)}`;
      const group = byKey.get(key) ?? [];
      group.push(station);
      byKey.set(key, group);
    }

    let updated = 0;
    for (const group of byKey.values()) {
      if (group.length < 2) continue;
      for (const [index, station] of group.entries()) {
        const next = this.offsetCoords({ lat: station.lat, lng: station.lng }, index);
        if (next.lat === station.lat && next.lng === station.lng) continue;
        station.lat = next.lat;
        station.lng = next.lng;
        await station.save();
        updated += 1;
      }
    }
    if (updated > 0) {
      this.logger.log(`Spread ${updated} stacked station pin(s) for map visibility`);
    }
    return updated;
  }

  async listGhanaCities() {
    const fromDb = await this.stationModel.distinct('city');
    return mergeGhanaCities(GHANA_CITIES, fromDb);
  }

  private coordsForCity(city: string, slot = 0) {
    const match = GHANA_STATIONS.find(
      (station) => station.city.toLowerCase() === city.trim().toLowerCase(),
    );
    const base = match
      ? { lat: match.lat, lng: match.lng }
      : { lat: 5.6037, lng: -0.187 };
    return this.offsetCoords(base, slot);
  }

  /** ~350–450m radial offset so multiple terminals in one city don't share one pin. */
  private offsetCoords(base: { lat: number; lng: number }, slot: number) {
    if (slot <= 0) return base;
    const angle = slot * 2.399963; // golden-angle radians
    const radiusDeg = 0.0035 + (slot % 5) * 0.0009;
    return {
      lat: base.lat + Math.sin(angle) * radiusDeg,
      lng: base.lng + Math.cos(angle) * radiusDeg,
    };
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
