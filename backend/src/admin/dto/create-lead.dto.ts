import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  stationId!: string;

  @IsString()
  @MinLength(1)
  leadName!: string;

  @IsString()
  @MinLength(1)
  leadPhone!: string;

  @IsOptional()
  @IsEmail()
  leadEmail?: string;
}
