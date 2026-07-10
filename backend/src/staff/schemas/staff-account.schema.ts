import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StaffAccountDocument = HydratedDocument<StaffAccount>;

@Schema({ collection: 'staff_accounts', timestamps: true })
export class StaffAccount {
  @Prop({ required: true, unique: true, index: true })
  accountId!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  pin!: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ required: true, enum: ['station_staff', 'station_lead', 'operator_admin'] })
  role!: 'station_staff' | 'station_lead' | 'operator_admin';

  @Prop({ required: true, index: true })
  operator!: string;

  @Prop({ required: true, index: true })
  stationId!: string;

  @Prop({ required: true })
  stationName!: string;

  @Prop({ required: true })
  stationCode!: string;

  @Prop()
  location?: string;

  @Prop({ default: false })
  mustChangePassword!: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLogoutAt?: Date;
}

export const StaffAccountSchema = SchemaFactory.createForClass(StaffAccount);
