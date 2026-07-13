import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WorkspaceResetService } from './workspace-reset.service';

async function bootstrap() {
  process.env.SEED_ON_STARTUP = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const reset = app.get(WorkspaceResetService);
    const result = await reset.resetForOnboarding();
    console.log('Workspace reset finished:', JSON.stringify(result, null, 2));
    console.log('Kept: platform admin login. Ghana station catalog re-seeds on next API startup.');
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Workspace reset failed:', error);
  process.exit(1);
});
