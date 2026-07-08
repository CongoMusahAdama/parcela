import { IsBoolean } from 'class-validator';

export class UpdatePersonDto {
  @IsBoolean()
  active!: boolean;
}
