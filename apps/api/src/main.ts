import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';

function corsOrigins(): boolean | string[] {
  const raw = env.corsOrigin;
  if (!raw || raw === '*') {
    return env.isProduction ? ['http://localhost:3000'] : true;
  }
  return raw.split(',').map((origin) => origin.trim());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: env.isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const http = app.getHttpAdapter().getInstance() as {
    set?: (key: string, value: unknown) => void;
  };
  http.set?.('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: env.enableSwagger ? false : undefined,
    }),
  );
  app.enableCors({ origin: corsOrigins(), credentials: true });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  if (env.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Liben CMS API')
      .setDescription(
        'REST API for projects, BOQ, materials, inventory, and progress.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(env.port);
  Logger.log(`API running on http://localhost:${env.port}/api`, 'Bootstrap');
  if (env.enableSwagger) {
    Logger.log(
      `Swagger docs: http://localhost:${env.port}/api/docs`,
      'Bootstrap',
    );
  }
}
void bootstrap();
