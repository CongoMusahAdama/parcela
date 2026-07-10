import { Injectable } from '@nestjs/common';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformOperatorsService } from './platform-operators.service';
import { PlatformPeopleService } from './platform-people.service';

@Injectable()
export class PlatformWorkspaceService {
  constructor(
    private readonly operators: PlatformOperatorsService,
    private readonly people: PlatformPeopleService,
    private readonly audit: PlatformAuditService,
  ) {}

  async getWorkspace(actorEmail?: string) {
    const [operators, hqAdmins, users, audit] = await Promise.all([
      this.operators.list(actorEmail),
      this.people.listHqAdmins(),
      this.people.listUsers(),
      this.audit.list(200),
    ]);

    const stats = {
      operatorsTotal: operators.length,
      operatorsConfigured: operators.filter((row) => row.status === 'configured').length,
      operatorsConfigure: operators.filter((row) => row.status === 'configure').length,
      hqAdminsActive: hqAdmins.filter((row) => row.status === 'active').length,
      hqAdminsPending: hqAdmins.filter((row) => row.status === 'pending_setup').length,
      usersTotal: users.length,
      usersActive: users.filter((row) => row.status === 'active').length,
      stationsSeeded: operators.reduce((sum, row) => sum + row.stationCount, 0),
    };

    return { operators, hqAdmins, users, audit, stats };
  }
}
