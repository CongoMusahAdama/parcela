import {
  BadRequestException,
  ForbiddenException,
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
import {
  buildTrackingLinks,
  type TrackingLinks,
} from '../common/utils/tracking-links.util';
import { SmsService } from '../sms/sms.service';
import { StationsService } from '../stations/stations.service';
import { OperatorControlsService } from '../admin/operator-controls.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { toPreBooking, toStaffParcelDetail, toStaffParcelSummary, toTrackedParcel } from './parcel.mapper';
import { Parcel, ParcelDocument } from './schemas/parcel.schema';

@Injectable()
export class ParcelsService {
  private readonly logger = new Logger(ParcelsService.name);

  constructor(
    @InjectModel(Parcel.name) private readonly parcelModel: Model<ParcelDocument>,
    private readonly stationsService: StationsService,
    private readonly smsService: SmsService,
    private readonly config: ConfigService,
    private readonly operatorControls: OperatorControlsService,
  ) {}

  private trackingLinks(token: string): TrackingLinks {
    return buildTrackingLinks(token, {
      webBaseUrl: this.config.get<string>('app.publicWebUrl') ?? 'http://localhost:3001',
      mobileScheme: this.config.get<string>('app.mobileDeepLinkScheme') ?? 'parcela',
    });
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

    if (await this.operatorControls.isBookingsLocked(origin.operator)) {
      throw new ForbiddenException('Bookings are temporarily locked for this operator');
    }

    if (await this.operatorControls.isOperatorSuspended(origin.operator)) {
      throw new ForbiddenException('This transport is temporarily suspended on Parcela');
    }

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

    const links = this.trackingLinks(trackingToken);
    void this.smsService
      .sendBookingConfirmation({
        senderPhone: parcel.senderPhone,
        senderName: parcel.senderName,
        bookingReference: parcel.bookingReference,
        pickupCode: parcel.pickupCode,
        originStationName: parcel.originStationName,
        trackingAppUrl: links.app,
      })
      .catch((err) => this.logger.warn(`Booking SMS failed: ${String(err)}`));

    return toPreBooking(parcel.toObject(), links);
  }

  async getByBookingReference(ref: string) {
    const parcel = await this.parcelModel.findOne({
      bookingReference: ref.trim().toUpperCase(),
    });
    if (!parcel) throw new NotFoundException('Booking not found');
    const destination = await this.stationsService.findByStationId(parcel.destinationStationId);
    return toPreBooking(parcel.toObject(), this.trackingLinks(parcel.trackingToken));
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

  async listByStation(stationId: string) {
    const normalized = stationId.trim();
    if (!normalized) throw new BadRequestException('stationId required');

    const parcels = await this.parcelModel
      .find({
        $or: [{ originStationId: normalized }, { destinationStationId: normalized }],
      })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return parcels.map((parcel) => toStaffParcelSummary(parcel, normalized));
  }

  async getBranchSummary(stationId: string) {
    const parcels = await this.listByStation(stationId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const counts = {
      total: parcels.length,
      pending_dropoff: 0,
      in_transit: 0,
      arrived: 0,
      ready_for_collection: 0,
      collected: 0,
      outgoing: 0,
      incoming: 0,
      updatedToday: 0,
    };

    for (const parcel of parcels) {
      if (parcel.status === 'pending_dropoff' && parcel.originStationId === stationId) {
        counts.pending_dropoff++;
      } else if (parcel.status === 'in_transit') counts.in_transit++;
      else if (parcel.status === 'arrived' && parcel.destinationStationId === stationId) {
        counts.arrived++;
      } else if (
        parcel.status === 'ready_for_collection' &&
        parcel.destinationStationId === stationId
      ) {
        counts.ready_for_collection++;
      } else if (parcel.status === 'collected') counts.collected++;

      if (parcel.direction === 'outgoing') counts.outgoing++;
      if (parcel.direction === 'incoming') counts.incoming++;
      if (new Date(parcel.updatedAt) >= todayStart) counts.updatedToday++;
    }

    return {
      stationId,
      counts,
      generatedAt: new Date().toISOString(),
    };
  }

  async getStaffParcelByReference(reference: string, stationId: string) {
    const parcel = await this.parcelModel.findOne({
      bookingReference: reference.trim().toUpperCase(),
    });
    if (!parcel) throw new NotFoundException('Parcel not found');

    const belongsToStation =
      parcel.originStationId === stationId || parcel.destinationStationId === stationId;
    if (!belongsToStation) {
      throw new ForbiddenException('Parcel is not linked to your station');
    }

    return toStaffParcelDetail(parcel.toObject(), stationId);
  }

  async verifyAndLogParcel(
    reference: string,
    stationId: string,
    input: { busNumber: string; driverName?: string; driverPhone: string },
  ) {
    const parcel = await this.parcelModel.findOne({
      bookingReference: reference.trim().toUpperCase(),
    });
    if (!parcel) throw new NotFoundException('Parcel not found');

    if (parcel.originStationId !== stationId) {
      throw new ForbiddenException('Only origin station staff can verify and log parcels');
    }
    if (parcel.status !== 'pending_dropoff') {
      throw new BadRequestException('Parcel is not awaiting drop-off');
    }

    parcel.status = 'in_transit';
    parcel.busNumber = input.busNumber.trim().toUpperCase();
    parcel.driverName = input.driverName?.trim() || undefined;
    parcel.driverPhone = input.driverPhone.replace(/\s/g, '').trim();
    await parcel.save();

    return toStaffParcelDetail(parcel.toObject(), stationId);
  }

  async confirmBusArrival(stationId: string, busNumber: string) {
    const normalizedBus = busNumber.trim().toUpperCase();
    const parcels = await this.parcelModel.find({
      destinationStationId: stationId,
      busNumber: normalizedBus,
      status: 'in_transit',
    });

    if (parcels.length === 0) {
      throw new NotFoundException('No in-transit parcels found for this bus at your station');
    }

    const now = new Date();
    const updated: string[] = [];
    const smsResults: Array<{ bookingReference: string; sent: boolean }> = [];

    for (const parcel of parcels) {
      parcel.status = 'ready_for_collection';
      parcel.arrivedAt = now;
      await parcel.save();
      updated.push(parcel.bookingReference);

      const links = this.trackingLinks(parcel.trackingToken);
      const sent = await this.smsService.sendArrivalNotification({
        recipientPhone: parcel.recipientPhone,
        recipientName: parcel.recipientName,
        pickupCode: parcel.pickupCode,
        stationName: parcel.destinationStationName,
        trackingAppUrl: links.app,
      });
      smsResults.push({ bookingReference: parcel.bookingReference, sent });
    }

    return {
      busNumber: normalizedBus,
      parcelCount: updated.length,
      bookingReferences: updated,
      sms: smsResults,
    };
  }

  async releaseParcel(reference: string, stationId: string, pickupCode: string) {
    const parcel = await this.parcelModel.findOne({
      bookingReference: reference.trim().toUpperCase(),
    });
    if (!parcel) throw new NotFoundException('Parcel not found');

    if (parcel.destinationStationId !== stationId) {
      throw new ForbiddenException('Only destination station staff can release parcels');
    }
    if (parcel.status !== 'ready_for_collection') {
      throw new BadRequestException('Parcel is not ready for collection');
    }

    const normalizedCode = pickupCode.trim().toUpperCase();
    if (parcel.pickupCode.toUpperCase() !== normalizedCode) {
      throw new BadRequestException('Pickup code does not match');
    }

    parcel.status = 'collected';
    await parcel.save();

    return toStaffParcelDetail(parcel.toObject(), stationId);
  }
}
