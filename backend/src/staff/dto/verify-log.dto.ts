import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class VerifyLogDto {
  @IsString()
  @MinLength(2)
  busNumber!: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsString()
  @Matches(/^(\+?233|0)?[2-9]\d{8}$/, {
    message: 'Enter a valid Ghana driver phone number (e.g. 0244555666).',
  })
  driverPhone!: string;

  /** Staff chooses who pays. Required if not already set on the parcel. */
  @IsOptional()
  @IsEnum(['sender', 'receiver'])
  paymentWho?: 'sender' | 'receiver';

  /** Mark fee collected now (typically when sender pays at origin). Parcel can still leave unpaid. */
  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}
