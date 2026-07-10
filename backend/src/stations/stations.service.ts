import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async findByCityAndOperator(city: string, operator: 'VIP' | 'STC') {
    const stations = await this.stationModel
      .find({ active: true, city: city.trim(), operator })
      .sort({ name: 1 })
      .lean();
    return stations.map((s) => this.toPublic(s));
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
    operator: 'VIP' | 'STC';
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
