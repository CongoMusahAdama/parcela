import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OperatorTerminalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;
}

export class CreateTransportOperatorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(8)
  @Matches(/^[A-Za-z0-9]+$/)
  code!: string;

  @IsString()
  @MaxLength(80)
  region!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  brandColor?: string;

  @IsOptional()
  @IsString()
  logoDataUrl?: string;

  @IsInt()
  @Min(1)
  cityCount!: number;

  @IsInt()
  @Min(1)
  stationCount!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatorTerminalDto)
  terminals?: OperatorTerminalDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsString()
  agreementDate!: string;

  @IsString()
  @MinLength(2)
  hqName!: string;

  @IsEmail()
  hqEmail!: string;

  @IsOptional()
  @IsString()
  hqPhone?: string;

  @IsOptional()
  @IsBoolean()
  issueLoginsNow?: boolean;

  @IsIn(['annual', 'trial'])
  subscriptionPlan!: 'annual' | 'trial';

  @IsString()
  subscriptionDuration!: string;

  @IsOptional()
  @IsString()
  subscriptionPaidAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  subscriptionAmountGhs?: number;
}

export class UpdateTransportOperatorDto {
  @IsOptional()
  @IsIn(['configure', 'configured', 'suspended', 'draft'])
  status?: 'configure' | 'configured' | 'suspended' | 'draft';

  @IsOptional()
  @IsBoolean()
  hqConfigured?: boolean;

  @IsOptional()
  @IsString()
  agreementDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  brandColor?: string;

  @IsOptional()
  @IsString()
  logoDataUrl?: string | null;

  @IsOptional()
  @IsIn(['annual', 'trial'])
  subscriptionPlan?: 'annual' | 'trial' | null;

  @IsOptional()
  @IsString()
  subscriptionPaidAt?: string;

  @IsOptional()
  @IsString()
  subscriptionExpiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  subscriptionAmountGhs?: number;
}

export class AddOperatorTerminalsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatorTerminalDto)
  terminals!: OperatorTerminalDto[];
}

export class SendRenewalReminderDto {
  @IsIn(['30d', '14d', '7d', '1d'])
  reminder!: '30d' | '14d' | '7d' | '1d';
}

export class RecordConfigurationLetterDto {
  @IsOptional()
  @IsString()
  agreementDate?: string;
}
