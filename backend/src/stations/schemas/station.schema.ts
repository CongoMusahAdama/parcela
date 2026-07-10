import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StationDocument = HydratedDocument<Station>;

@Schema({ collection: 'stations', timestamps: true })
export class Station {
  @Prop({ required: true, unique: true, index: true })
  stationId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  hours!: string;

  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lng!: number;

  @Prop({ required: true, index: true })
  operator!: string;

  @Prop({ default: true })
  active!: boolean;
}

export const StationSchema = SchemaFactory.createForClass(Station);

StationSchema.index({ name: 'text', city: 'text', code: 'text', address: 'text' });
