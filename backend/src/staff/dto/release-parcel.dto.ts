import { IsString, MinLength } from 'class-validator';

export class ReleaseParcelDto {
  @IsString()
  @MinLength(3)
  pickupCode!: string;
}
