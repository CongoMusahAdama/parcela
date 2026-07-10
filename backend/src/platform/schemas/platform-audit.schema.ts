import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformAuditDocument = HydratedDocument<PlatformAuditEntry>;

@Schema({ collection: 'platform_audit', timestamps: true })
export class PlatformAuditEntry {
  @Prop({ required: true, unique: true, index: true })
  entryId!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  detail!: string;

  @Prop()
  operatorCode?: string;

  @Prop()
  actorEmail?: string;

  @Prop()
  at?: Date;
}

export const PlatformAuditEntrySchema = SchemaFactory.createForClass(PlatformAuditEntry);
