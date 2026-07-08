import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  displayName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  stationId?: string;
}
