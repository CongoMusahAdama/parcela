import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SystemSessionState,
  SystemSessionStateDocument,
} from '../schemas/system-session-state.schema';

const GLOBAL_KEY = 'global';

@Injectable()
export class SessionRevocationService implements OnModuleInit {
  private readonly logger = new Logger(SessionRevocationService.name);
  private revokedAfterMs = 0;

  constructor(
    @InjectModel(SystemSessionState.name)
    private readonly model: Model<SystemSessionStateDocument>,
  ) {}

  async onModuleInit() {
    const doc = await this.model.findOne({ key: GLOBAL_KEY }).lean();
    this.revokedAfterMs = doc?.revokedAfterMs ?? 0;
    if (this.revokedAfterMs > 0) {
      this.logger.log(
        `Session revocation active — tokens issued before ${new Date(this.revokedAfterMs).toISOString()} are invalid`,
      );
    }
  }

  getRevokedAfterMs() {
    return this.revokedAfterMs;
  }

  assertActive(tokenIssuedAtMs: number) {
    if (tokenIssuedAtMs < this.revokedAfterMs) {
      throw new UnauthorizedException('Session ended — sign in again');
    }
  }

  async revokeAllSessions() {
    const now = Date.now();
    this.revokedAfterMs = now;
    await this.model.updateOne(
      { key: GLOBAL_KEY },
      { $set: { revokedAfterMs: now } },
      { upsert: true },
    );
    this.logger.warn(`All portal sessions revoked at ${new Date(now).toISOString()}`);
    return { revokedAt: new Date(now).toISOString() };
  }
}
