import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
