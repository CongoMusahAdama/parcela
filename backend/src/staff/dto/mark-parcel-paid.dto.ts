import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class MarkParcelPaidDto {
  @IsOptional()
  @IsEnum(['sender', 'receiver'])
  paymentWho?: 'sender' | 'receiver';

  /** When true (default), marks the parcel paid. */
  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}
