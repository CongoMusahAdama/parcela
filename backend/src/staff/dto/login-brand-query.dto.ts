import { IsIn, IsString } from 'class-validator';

export class LoginBrandQueryDto {
  @IsString()
  phone!: string;

  @IsIn(['staff', 'lead', 'hq'])
  portal!: 'staff' | 'lead' | 'hq';
}
