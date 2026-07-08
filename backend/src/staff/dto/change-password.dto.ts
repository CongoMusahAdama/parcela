import { IsString, MinLength } from 'class-validator';

/** Authenticated staff password change — account comes from the session cookie. */
export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
