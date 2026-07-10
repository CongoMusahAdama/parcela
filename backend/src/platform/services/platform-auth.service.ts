import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ensureHashedSecret, verifySecret } from '../../common/utils/password.util';
import { PlatformAdmin, PlatformAdminDocument } from '../schemas/platform-admin.schema';

export type PlatformPublicAdmin = {
  id: string;
  email: string;
  displayName: string;
};

export type PlatformTokenPayload = {
  sub: string;
  typ: 'platform';
  iat: number;
  exp: number;
};

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(PlatformAdmin.name)
    private readonly adminModel: Model<PlatformAdminDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureSeedAdmin();
  }

  private get secret() {
    const secret = this.config.get<string>('staff.tokenSecret')?.trim() ?? '';
    if (!secret || secret.length < 32) {
      throw new Error('STAFF_TOKEN_SECRET must be set to at least 32 characters');
    }
    return secret;
  }

  private get tokenTtlMs() {
    return this.config.get<number>('staff.tokenTtlMs') ?? 8 * 60 * 60 * 1000;
  }

  getTokenTtlMs() {
    return this.tokenTtlMs;
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const admin = await this.adminModel.findOne({ email: normalized, active: true }).lean();
    if (!admin || !verifySecret(password, admin.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.adminModel.updateOne(
      { adminId: admin.adminId },
      { $set: { lastLoginAt: new Date() } },
    );

    const publicAdmin = this.toPublic(admin);
    const token = this.signToken(publicAdmin.id);
    return {
      token,
      admin: publicAdmin,
      signedInAt: new Date().toISOString(),
    };
  }

  verifyToken(token: string): PlatformTokenPayload & { admin: PlatformPublicAdmin } {
    const payload = this.parseToken(token);
    return payload;
  }

  async getAdminById(adminId: string): Promise<PlatformPublicAdmin | null> {
    const admin = await this.adminModel.findOne({ adminId, active: true }).lean();
    return admin ? this.toPublic(admin) : null;
  }

  getSessionPayload(admin: PlatformPublicAdmin, signedInAt: string) {
    return { admin, signedInAt };
  }

  private toPublic(admin: PlatformAdmin): PlatformPublicAdmin {
    return {
      id: admin.adminId,
      email: admin.email,
      displayName: admin.displayName,
    };
  }

  private signToken(adminId: string) {
    const iat = Date.now();
    const exp = iat + this.tokenTtlMs;
    const payload: PlatformTokenPayload = { sub: adminId, typ: 'platform', iat, exp };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private parseToken(token: string): PlatformTokenPayload & { admin: PlatformPublicAdmin } {
    const [body, sig] = token.split('.');
    if (!body || !sig) throw new UnauthorizedException('Invalid platform session');

    const expected = createHmac('sha256', this.secret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid platform session');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PlatformTokenPayload;
    if (payload.typ !== 'platform' || !payload.sub || Date.now() > payload.exp) {
      throw new UnauthorizedException('Platform session expired');
    }

    return { ...payload, admin: { id: payload.sub, email: '', displayName: '' } };
  }

  async resolveAdminFromToken(token: string): Promise<PlatformTokenPayload & { admin: PlatformPublicAdmin }> {
    const payload = this.parseToken(token);
    const admin = await this.getAdminById(payload.sub);
    if (!admin) throw new UnauthorizedException('Invalid platform session');
    return { ...payload, admin };
  }

  private async ensureSeedAdmin() {
    const email = (this.config.get<string>('platform.seedEmail') ?? 'platform@parcela.app')
      .trim()
      .toLowerCase();
    const password = this.config.get<string>('platform.seedPassword')?.trim() ?? '';

    if (!password) {
      const existing = await this.adminModel.findOne({ email }).lean();
      if (!existing) {
        this.logger.warn(
          'SEED_PLATFORM_PASSWORD not set — platform admin not seeded. Set it in .env to enable platform login.',
        );
      }
      return;
    }

    const hashed = ensureHashedSecret(password);
    const existing = await this.adminModel.findOne({ email }).lean();
    if (existing) {
      await this.adminModel.updateOne(
        { adminId: existing.adminId },
        { $set: { password: hashed, active: true } },
      );
      this.logger.log(`Platform admin ${email} ready (credentials synced from env)`);
      return;
    }

    await this.adminModel.create({
      adminId: 'platform-admin-01',
      email,
      displayName: 'Parcela Platform',
      password: hashed,
      active: true,
    });
    this.logger.log(`Seeded platform admin ${email}`);
  }
}
