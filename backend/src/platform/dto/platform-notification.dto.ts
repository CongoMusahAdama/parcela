import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { PLATFORM_NOTIFICATION_AUDIENCES } from '../schemas/platform-notification.schema';

export class CreatePlatformNotificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(480)
  body!: string;

  @IsIn(PLATFORM_NOTIFICATION_AUDIENCES)
  audience!: (typeof PLATFORM_NOTIFICATION_AUDIENCES)[number];
}
