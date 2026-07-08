import { IsBoolean, IsOptional } from 'class-validator';

export class OperatorLocksDto {
  @IsOptional()
  @IsBoolean()
  bookingsLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  staffOpsLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  leadOpsLocked?: boolean;
}
