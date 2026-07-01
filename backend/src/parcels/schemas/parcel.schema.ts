import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParcelTrackStatus =
  | 'pending_dropoff'
  | 'in_transit'
  | 'arrived'
  | 'ready_for_collection'
  | 'collected';

export type ParcelType = 'document' | 'box' | 'envelope' | 'other';

@Schema({ _id: false })
export class BookingItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, enum: ['document', 'box', 'envelope', 'other'] })
  parcelType!: ParcelType;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: false })
  fragile!: boolean;
}

export const BookingItemSchema = SchemaFactory.createForClass(BookingItem);

export type ParcelDocument = HydratedDocument<Parcel>;

@Schema({ collection: 'parcels', timestamps: true })
export class Parcel {
  @Prop({ required: true, unique: true, index: true })
  bookingReference!: string;

  @Prop({ required: true, unique: true, index: true })
  pickupCode!: string;

  @Prop({ required: true, unique: true, index: true })
  trackingToken!: string;

  @Prop({
    required: true,
    enum: [
      'pending_dropoff',
      'in_transit',
      'arrived',
      'ready_for_collection',
      'collected',
    ],
    default: 'pending_dropoff',
  })
  status!: ParcelTrackStatus;

  @Prop({ required: true })
  originStationId!: string;

  @Prop({ required: true })
  originStationName!: string;

  @Prop({ required: true })
  originStationCode!: string;

  @Prop({ required: true, enum: ['VIP', 'STC'] })
  operator!: 'VIP' | 'STC';

  @Prop({ required: true })
  destinationStationId!: string;

  @Prop({ required: true })
  destinationStationName!: string;

  @Prop({ enum: ['VIP', 'STC'] })
  destinationOperator?: 'VIP' | 'STC';

  @Prop({ required: true })
  senderName!: string;

  @Prop({ required: true })
  senderPhone!: string;

  @Prop({ required: true })
  recipientName!: string;

  @Prop({ required: true })
  recipientPhone!: string;

  @Prop({ type: [BookingItemSchema], required: true })
  items!: BookingItem[];

  @Prop()
  busNumber?: string;

  @Prop()
  driverName?: string;

  @Prop()
  driverPhone?: string;

  @Prop()
  expectedArrival?: Date;

  @Prop()
  arrivedAt?: Date;
}

export const ParcelSchema = SchemaFactory.createForClass(Parcel);

ParcelSchema.index({ status: 1, originStationId: 1, createdAt: -1 });
