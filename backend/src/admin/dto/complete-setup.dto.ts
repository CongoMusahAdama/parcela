import { IsIn, IsOptional } from 'class-validator';

export class CompleteSetupDto {
  @IsOptional()
  @IsIn(['VIP', 'STC'])
  operator?: 'VIP' | 'STC';
}
