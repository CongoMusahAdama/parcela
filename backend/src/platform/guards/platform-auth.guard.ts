import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PLATFORM_AUTH_COOKIE, readAuthToken } from '../../common/utils/auth-cookie.util';
import { PlatformAuthService } from '../services/platform-auth.service';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private readonly platformAuth: PlatformAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: Record<string, string>;
      platform?: Awaited<ReturnType<PlatformAuthService['resolveAdminFromToken']>>;
    }>();

    const token = readAuthToken(
      request.headers.authorization,
      request.cookies,
      PLATFORM_AUTH_COOKIE,
    );
    if (!token) {
      throw new UnauthorizedException('Platform authorization required');
    }

    request.platform = await this.platformAuth.resolveAdminFromToken(token);
    return true;
  }
}
