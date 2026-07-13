import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;
}
