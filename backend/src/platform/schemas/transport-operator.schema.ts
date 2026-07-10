import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransportOperatorStatus = 'configure' | 'configured' | 'suspended' | 'draft';
export type TransportSubscriptionPlan = 'annual' | 'trial';
export type TransportRenewalReminder = '30d' | '14d' | '7d' | '1d';

export type TransportOperatorDocument = HydratedDocument<TransportOperator>;

@Schema({ collection: 'transport_operators', timestamps: true })
export class TransportOperator {
  @Prop({ required: true, unique: true, index: true })
  operatorId!: string;

  @Prop({ required: true, unique: true, uppercase: true, index: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({
    required: true,
    enum: ['configure', 'configured', 'suspended', 'draft'],
    default: 'configure',
  })
  status!: TransportOperatorStatus;

  @Prop({ default: '#fd7e14' })
  brandColor!: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ default: 'Ghana' })
  region!: string;

  @Prop({ default: 1, min: 1 })
  cityCount!: number;

  @Prop({ default: 1, min: 1 })
  stationCount!: number;

  @Prop({ default: false })
  hqConfigured!: boolean;

  @Prop()
  primaryAdminEmail?: string;

  @Prop()
  primaryAdminName?: string;

  @Prop({ default: '' })
  notes!: string;

  @Prop({ type: String, enum: ['annual', 'trial'], default: null })
  subscriptionPlan?: TransportSubscriptionPlan | null;

  @Prop()
  subscriptionPaidAt?: Date;

  @Prop()
  subscriptionExpiresAt?: Date;

  @Prop()
  subscriptionAmountGhs?: number;

  @Prop({ type: [String], default: [] })
  renewalRemindersSent!: TransportRenewalReminder[];

  @Prop()
  agreementDate?: string;

  @Prop()
  configurationLetterGeneratedAt?: Date;

  @Prop({ default: false })
  suspended!: boolean;
}

export const TransportOperatorSchema = SchemaFactory.createForClass(TransportOperator);
