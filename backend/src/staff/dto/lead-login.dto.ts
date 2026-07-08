import { IsString, MinLength } from 'class-validator';

export class LeadLoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(4)
  pin!: string;
}
