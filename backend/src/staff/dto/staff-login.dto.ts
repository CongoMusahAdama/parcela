import { IsString, MinLength } from 'class-validator';

export class StaffLoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
