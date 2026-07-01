import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const reset = process.argv.includes('--reset');
  // Avoid double-seeding: onModuleInit also calls seedAll when SEED_ON_STARTUP is true
  process.env.SEED_ON_STARTUP = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const seed = app.get(SeedService);
    await seed.seedAll({ reset });
    console.log('Database seed finished successfully.');
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
