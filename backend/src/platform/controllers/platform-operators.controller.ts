import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  AddOperatorTerminalsDto,
  CreateTransportOperatorDto,
  RecordConfigurationLetterDto,
  SendRenewalReminderDto,
  UpdateTransportOperatorDto,
} from '../dto/transport-operator.dto';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import type { PlatformAuthService } from '../services/platform-auth.service';
import { PlatformOperatorsService } from '../services/platform-operators.service';
import { PlatformWorkspaceService } from '../services/platform-workspace.service';

type PlatformRequest = {
  platform: Awaited<ReturnType<PlatformAuthService['resolveAdminFromToken']>>;
};

@Controller('platform')
@UseGuards(PlatformAuthGuard)
@SkipThrottle({ auth: true })
export class PlatformOperatorsController {
  constructor(
    private readonly operators: PlatformOperatorsService,
    private readonly workspace: PlatformWorkspaceService,
  ) {}

  @Get('workspace')
  getWorkspace(@Req() req: PlatformRequest) {
    return this.workspace.getWorkspace(req.platform.admin.email);
  }

  @Get('operators')
  listOperators(@Req() req: PlatformRequest) {
    return this.operators.list(req.platform.admin.email);
  }

  @Get('operators/:operatorId')
  getOperator(@Param('operatorId') operatorId: string) {
    return this.operators.findById(operatorId);
  }

  @Post('operators')
  createOperator(@Body() dto: CreateTransportOperatorDto, @Req() req: PlatformRequest) {
    return this.operators.create(dto, req.platform.admin.email);
  }

  @Patch('operators/:operatorId')
  updateOperator(
    @Param('operatorId') operatorId: string,
    @Body() dto: UpdateTransportOperatorDto,
    @Req() req: PlatformRequest,
  ) {
    return this.operators.update(operatorId, dto, req.platform.admin.email);
  }

  @Post('operators/:operatorId/mark-configured')
  markConfigured(@Param('operatorId') operatorId: string, @Req() req: PlatformRequest) {
    return this.operators.markConfigured(operatorId, req.platform.admin.email);
  }

  @Post('operators/:operatorId/toggle-suspend')
  toggleSuspend(@Param('operatorId') operatorId: string, @Req() req: PlatformRequest) {
    return this.operators.toggleSuspend(operatorId, req.platform.admin.email);
  }

  @Get('operators/:operatorId/terminals')
  listTerminals(@Param('operatorId') operatorId: string) {
    return this.operators.listTerminals(operatorId);
  }

  @Post('operators/:operatorId/terminals')
  addTerminals(
    @Param('operatorId') operatorId: string,
    @Body() dto: AddOperatorTerminalsDto,
    @Req() req: PlatformRequest,
  ) {
    return this.operators.addTerminals(operatorId, dto, req.platform.admin.email);
  }

  @Post('operators/:operatorId/remove')
  removeOperator(@Param('operatorId') operatorId: string, @Req() req: PlatformRequest) {
    return this.operators.remove(operatorId, req.platform.admin.email);
  }

  @Delete('operators/:operatorId')
  deleteOperator(@Param('operatorId') operatorId: string, @Req() req: PlatformRequest) {
    return this.operators.remove(operatorId, req.platform.admin.email);
  }

  @Post('operators/:operatorId/renewal-reminder')
  sendRenewalReminder(
    @Param('operatorId') operatorId: string,
    @Body() dto: SendRenewalReminderDto,
    @Req() req: PlatformRequest,
  ) {
    return this.operators.sendRenewalReminder(operatorId, dto, req.platform.admin.email);
  }

  @Post('operators/:operatorId/configuration-letter')
  recordConfigurationLetter(
    @Param('operatorId') operatorId: string,
    @Body() dto: RecordConfigurationLetterDto,
    @Req() req: PlatformRequest,
  ) {
    return this.operators.recordConfigurationLetter(operatorId, dto, req.platform.admin.email);
  }
}
