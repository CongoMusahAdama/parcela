import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePlatformNotificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(480)
  body!: string;

  @IsIn(['staff', 'general'])
  audience!: 'staff' | 'general';
}
