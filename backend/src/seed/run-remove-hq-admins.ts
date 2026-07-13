import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PlatformPeopleService } from '../platform/services/platform-people.service';
import { StaffAuthService } from '../staff/staff-auth.service';

const TARGET_EMAILS = ['adamsmusah612@gmail.com'];

async function bootstrap() {
  process.env.SEED_ON_STARTUP = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const staffAuth = app.get(StaffAuthService);
    const people = app.get(PlatformPeopleService);

    const targets = staffAuth
      .getAccounts()
      .filter(
        (account) =>
          account.role === 'operator_admin' &&
          (TARGET_EMAILS.includes(account.email.trim().toLowerCase()) ||
            account.operator.trim().toUpperCase() === 'FWZ'),
      );

    if (targets.length === 0) {
      console.log('No matching HQ admin accounts found.');
      return;
    }

    for (const account of targets) {
      const result = await people.deleteHqAdmin(account.id, 'platform-script@local');
      console.log(
        `Removed HQ admin: ${account.displayName} (${result.email}) — ${result.operatorCode}`,
      );
    }

    console.log(`Done. Removed ${targets.length} HQ admin account(s). Restart the API if it is already running.`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('HQ admin removal failed:', error);
  process.exit(1);
});
