import {

  CanActivate,

  ExecutionContext,

  ForbiddenException,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';

import { readAuthToken, LEAD_AUTH_COOKIE } from '../common/utils/auth-cookie.util';

import { StaffAuthService } from './staff-auth.service';



@Injectable()

export class LeadAuthGuard implements CanActivate {

  constructor(private readonly staffAuth: StaffAuthService) {}



  canActivate(context: ExecutionContext): boolean {

    const request = context.switchToHttp().getRequest<{

      headers: { authorization?: string };

      cookies?: Record<string, string>;

      lead?: ReturnType<StaffAuthService['verifyToken']>;

    }>();



    const token = readAuthToken(

      request.headers.authorization,

      request.cookies,

      LEAD_AUTH_COOKIE,

    );

    if (!token) {

      throw new UnauthorizedException('Branch lead authorization required');

    }



    const session = this.staffAuth.verifyToken(token);



    if (session.staff.role !== 'station_lead') {

      throw new ForbiddenException('Branch lead access only');

    }



    request.lead = session;

    return true;

  }

}

