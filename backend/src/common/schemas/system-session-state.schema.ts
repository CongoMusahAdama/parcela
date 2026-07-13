import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type SystemSessionStateDocument = HydratedDocument<SystemSessionState>;

@Schema({ collection: 'system_session_state', timestamps: true })
export class SystemSessionState {
  @Prop({ required: true, unique: true, default: 'global' })
  key!: string;

  /** Tokens issued before this timestamp (ms) are rejected. */
  @Prop({ required: true, default: 0 })
  revokedAfterMs!: number;
}

export const SystemSessionStateSchema = SchemaFactory.createForClass(SystemSessionState);
