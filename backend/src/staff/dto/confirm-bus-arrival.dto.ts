import { IsString, MinLength } from 'class-validator';

export class ConfirmBusArrivalDto {
  @IsString()
  @MinLength(2)
  busNumber!: string;
}
