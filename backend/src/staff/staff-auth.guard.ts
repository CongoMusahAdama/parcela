import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { readAuthToken, STAFF_AUTH_COOKIE } from '../common/utils/auth-cookie.util';
import { StaffAuthService } from './staff-auth.service';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly staffAuth: StaffAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: Record<string, string>;
      staff?: ReturnType<StaffAuthService['verifyToken']>;
    }>();

    const token = readAuthToken(
      request.headers.authorization,
      request.cookies,
      STAFF_AUTH_COOKIE,
    );
    if (!token) {
      throw new UnauthorizedException('Staff authorization required');
    }

    const session = this.staffAuth.verifyToken(token);

    if (session.staff.role !== 'station_staff') {
      throw new ForbiddenException('Counter staff access only');
    }

    request.staff = session;
    return true;
  }
}
