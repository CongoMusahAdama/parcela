import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  derivePickupCodeFromReference,
  deriveTrackingToken,
  generateBookingItemId,
  generateBookingReference,
} from '../common/utils/codes.util';
import { SmsService } from '../sms/sms.service';
import { StationsService } from '../stations/stations.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { toPreBooking, toTrackedParcel } from './parcel.mapper';
import { Parcel, ParcelDocument } from './schemas/parcel.schema';

@Injectable()
export class ParcelsService {
  private readonly logger = new Logger(ParcelsService.name);

  constructor(
    @InjectModel(Parcel.name) private readonly parcelModel: Model<ParcelDocument>,
    private readonly stationsService: StationsService,
    private readonly smsService: SmsService,
    private readonly config: ConfigService,
  ) {}

  private trackingUrl(token: string) {
    const base = this.config.get<string>('app.publicWebUrl') ?? 'http://localhost:3001';
    return `${base.replace(/\/$/, '')}/track/t/${token}`;
  }

  private async uniqueBookingReference(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const ref = generateBookingReference();
      const pickupCode = derivePickupCodeFromReference(ref);
      const trackingToken = deriveTrackingToken(ref);
      const exists = await this.parcelModel.exists({
        $or: [{ bookingReference: ref }, { pickupCode }, { trackingToken }],
      });
      if (!exists) return ref;
    }
    throw new BadRequestException('Could not generate booking reference');
  }

  async createBooking(dto: CreateBookingDto) {
    const origin = await this.stationsService.findByStationId(dto.stationId);
    if (!origin) throw new NotFoundException('Origin station not found');

    const destination = await this.stationsService.findByStationId(dto.destinationStationId);
    if (!destination) throw new NotFoundException('Destination station not found');

    if (origin.id === destination.id) {
      throw new BadRequestException('Origin and destination must differ');
    }

    const bookingReference = await this.uniqueBookingReference();
    const pickupCode = derivePickupCodeFromReference(bookingReference);
    const trackingToken = deriveTrackingToken(bookingReference);

    const parcel = await this.parcelModel.create({
      bookingReference,
      pickupCode,
      trackingToken,
      status: 'pending_dropoff',
      originStationId: origin.id,
      originStationName: origin.name,
      originStationCode: origin.code,
      operator: origin.operator,
      destinationStationId: destination.id,
      destinationStationName: destination.name,
      destinationOperator: destination.operator,
      senderName: dto.senderName.trim(),
      senderPhone: dto.senderPhone.trim(),
      recipientName: dto.recipientName.trim(),
      recipientPhone: dto.recipientPhone.trim(),
      items: dto.items.map((item) => ({
        id: generateBookingItemId(),
        parcelType: item.parcelType,
        description: item.description.trim(),
        fragile: item.fragile,
      })),
    });

    const url = this.trackingUrl(trackingToken);
    void this.smsService
      .sendBookingConfirmation({
        senderPhone: parcel.senderPhone,
        senderName: parcel.senderName,
        bookingReference: parcel.bookingReference,
        pickupCode: parcel.pickupCode,
        originStationName: parcel.originStationName,
        trackingUrl: url,
      })
      .catch((err) => this.logger.warn(`Booking SMS failed: ${String(err)}`));

    return toPreBooking(parcel.toObject(), url);
  }

  async getByBookingReference(ref: string) {
    const parcel = await this.parcelModel.findOne({
      bookingReference: ref.trim().toUpperCase(),
    });
    if (!parcel) throw new NotFoundException('Booking not found');
    const destination = await this.stationsService.findByStationId(parcel.destinationStationId);
    return toPreBooking(parcel.toObject(), this.trackingUrl(parcel.trackingToken));
  }

  async lookupByQuery(query: string) {
    const normalized = query.trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Query required');

    const parcel = await this.parcelModel.findOne({
      $or: [{ pickupCode: normalized }, { bookingReference: normalized }],
    });
    if (!parcel) throw new NotFoundException('Parcel not found');

    const destination = await this.stationsService.findByStationId(parcel.destinationStationId);
    return toTrackedParcel(parcel.toObject(), destination);
  }

  async lookupByToken(token: string) {
    const normalized = token.trim().toLowerCase();
    if (!normalized) throw new BadRequestException('Token required');

    const parcel = await this.parcelModel.findOne({ trackingToken: normalized });
    if (!parcel) throw new NotFoundException('Parcel not found');

    const destination = await this.stationsService.findByStationId(parcel.destinationStationId);
    return toTrackedParcel(parcel.toObject(), destination);
  }

  async listPendingDropoffs(stationId?: string) {
    const filter: Record<string, unknown> = { status: 'pending_dropoff' };
    if (stationId) filter.originStationId = stationId;
    const parcels = await this.parcelModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return parcels;
  }
}
