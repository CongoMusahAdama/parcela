import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ADMIN_AUTH_COOKIE, readAuthToken } from '../common/utils/auth-cookie.util';
import { StaffAuthService } from '../staff/staff-auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly staffAuth: StaffAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: Record<string, string>;
      admin?: ReturnType<StaffAuthService['verifyToken']>;
    }>();

    const token = readAuthToken(
      request.headers.authorization,
      request.cookies,
      ADMIN_AUTH_COOKIE,
    );
    if (!token) {
      throw new UnauthorizedException('Admin authorization required');
    }

    const session = this.staffAuth.verifyToken(token);

    if (session.staff.role !== 'operator_admin') {
      throw new ForbiddenException('HQ admin access only');
    }

    request.admin = session;
    return true;
  }
}
