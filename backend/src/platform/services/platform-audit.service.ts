import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  PlatformAuditEntry,
  PlatformAuditDocument,
} from '../schemas/platform-audit.schema';

@Injectable()
export class PlatformAuditService {
  constructor(
    @InjectModel(PlatformAuditEntry.name)
    private readonly auditModel: Model<PlatformAuditDocument>,
  ) {}

  async list(limit = 100) {
    const rows = await this.auditModel
      .find()
      .sort({ at: -1 })
      .limit(limit)
      .lean<Array<PlatformAuditEntry & { at?: Date; createdAt?: Date }>>();
    return rows.map((row) => ({
      id: row.entryId,
      action: row.action,
      detail: row.detail,
      at:
        row.at instanceof Date
          ? row.at.toISOString()
          : row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : new Date().toISOString(),
    }));
  }

  async record(params: {
    action: string;
    detail: string;
    actorEmail?: string;
    operatorCode?: string;
  }) {
    const entry = await this.auditModel.create({
      entryId: `pa-${Date.now()}-${randomBytes(3).toString('hex')}`,
      action: params.action,
      detail: params.detail,
      actorEmail: params.actorEmail,
      operatorCode: params.operatorCode,
      at: new Date(),
    });
    return {
      id: entry.entryId,
      action: entry.action,
      detail: entry.detail,
      at: entry.at?.toISOString() ?? new Date().toISOString(),
    };
  }
}
