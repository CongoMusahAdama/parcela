import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BookingItemDto {
  @IsEnum(['document', 'box', 'envelope', 'other'])
  parcelType!: 'document' | 'box' | 'envelope' | 'other';

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description!: string;

  @IsBoolean()
  fragile!: boolean;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  stationId!: string;

  @IsString()
  @IsNotEmpty()
  destinationStationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  senderName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  senderPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  recipientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  recipientPhone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items!: BookingItemDto[];

  /** Optional — set by staff walk-in. Public online bookings leave this unset. */
  @IsOptional()
  @IsEnum(['sender', 'receiver'])
  paymentWho?: 'sender' | 'receiver';

  /** When true with paymentWho=sender, marks the walk-in fee as collected now. */
  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}
