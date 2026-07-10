import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PlatformOperatorsService } from '../services/platform-operators.service';

/** Public operator branding for mobile + web sender apps (no platform auth). */
@Controller('operators')
@SkipThrottle({ auth: true })
export class PublicOperatorsController {
  constructor(private readonly operators: PlatformOperatorsService) {}

  @Get('branding')
  listBranding() {
    return this.operators.listPublicBranding();
  }
}
