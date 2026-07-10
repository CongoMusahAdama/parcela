import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformAdminDocument = HydratedDocument<PlatformAdmin>;

@Schema({ collection: 'platform_admins', timestamps: true })
export class PlatformAdmin {
  @Prop({ required: true, unique: true, index: true })
  adminId!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const PlatformAdminSchema = SchemaFactory.createForClass(PlatformAdmin);
