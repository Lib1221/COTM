import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

function corsOrigins(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw === '*') {
    return process.env.NODE_ENV === 'production'
      ? ['http://localhost:3000']
      : true;
  }
  return raw.split(',').map((origin) => origin.trim());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      // Swagger UI needs inline scripts/styles; keep the rest of helmet on.
      contentSecurityPolicy: false,
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
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Construction Management System API')
    .setDescription(
      'REST API for projects, BOQ, materials, inventory, and progress.',
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
void bootstrap();
