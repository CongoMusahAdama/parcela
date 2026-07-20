import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformNotificationDocument = HydratedDocument<PlatformNotification>;

export type PlatformNotificationAudience = 'staff' | 'general';

@Schema({ collection: 'platform_notifications', timestamps: true })
export class PlatformNotification {
  @Prop({ required: true, unique: true, index: true })
  notificationId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ required: true, enum: ['staff', 'general'], index: true })
  audience!: PlatformNotificationAudience;

  @Prop({ required: true, default: 0 })
  recipientCount!: number;

  @Prop({ required: true, default: 0 })
  sentCount!: number;

  @Prop({ required: true, default: 0 })
  failedCount!: number;

  @Prop()
  actorEmail?: string;

  @Prop()
  sentAt?: Date;
}

export const PlatformNotificationSchema =
  SchemaFactory.createForClass(PlatformNotification);
