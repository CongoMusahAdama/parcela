import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

/** Operator logos are accepted up to ~600 KB as data URLs — keep above that. */
const API_BODY_LIMIT = '1mb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const config = app.get(ConfigService);

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: API_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: API_BODY_LIMIT }));

  app.getHttpAdapter().getInstance().use(
    (err: { type?: string }, _req: unknown, res: { status: (code: number) => { json: (body: object) => void } }, next: (error?: unknown) => void) => {
      if (err?.type === 'entity.too.large') {
        res.status(413).json({
          statusCode: 413,
          message: 'Request is too large. Use a logo under 400 KB or remove the logo and try again.',
        });
        return;
      }
      next(err);
    },
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = config.get<string[]>('corsOrigins') ?? [];
  app.enableCors({
    origin: origins.length ? origins : ['http://localhost:3001'],
    credentials: true,
  });

  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  const port = config.get<number>('port') ?? 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`Parcela API running on http://localhost:${port}/api`);
}
bootstrap();
