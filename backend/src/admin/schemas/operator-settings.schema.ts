import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OperatorSettingsDocument = HydratedDocument<OperatorSettings>;

@Schema({ _id: false })
export class OperatorAuditEntry {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  at!: string;

  @Prop({ required: true })
  actor!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  detail!: string;

  @Prop({ required: true, enum: ['info', 'warning', 'critical'] })
  severity!: 'info' | 'warning' | 'critical';
}

export const OperatorAuditEntrySchema = SchemaFactory.createForClass(OperatorAuditEntry);

@Schema({ collection: 'operator_settings', timestamps: true })
export class OperatorSettings {
  @Prop({ required: true, unique: true, enum: ['VIP', 'STC'], index: true })
  operator!: 'VIP' | 'STC';

  @Prop({ default: false })
  configured!: boolean;

  @Prop({ default: false })
  bookingsLocked!: boolean;

  @Prop({ default: false })
  staffOpsLocked!: boolean;

  @Prop({ default: false })
  leadOpsLocked!: boolean;

  @Prop({ default: true })
  smsAlertsEnabled!: boolean;

  @Prop({ default: true })
  emailDigestEnabled!: boolean;

  @Prop({ default: false })
  requireLeadApprovalForStaff!: boolean;

  @Prop({ default: '' })
  maintenanceBanner!: string;

  @Prop({ type: [OperatorAuditEntrySchema], default: [] })
  audit!: OperatorAuditEntry[];
}

export const OperatorSettingsSchema = SchemaFactory.createForClass(OperatorSettings);
