import { IsString, MinLength } from 'class-validator';

/** Branch lead PIN change — account comes from the session cookie. */
export class ChangePinDto {
  @IsString()
  currentPin!: string;

  @IsString()
  @MinLength(4)
  newPin!: string;
}
