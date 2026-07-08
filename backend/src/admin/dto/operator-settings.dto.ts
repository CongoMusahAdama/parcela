import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class OperatorSettingsDto {
  @IsOptional()
  @IsBoolean()
  smsAlertsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailDigestEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  requireLeadApprovalForStaff?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceBanner?: string;
}
