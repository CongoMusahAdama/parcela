import { IsEmail, MinLength } from 'class-validator';

export class PlatformLoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}
