import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS for frontend
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const origins = corsOrigins
    ? corsOrigins.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 CampusFeed Backend running on http://localhost:${port}`);
}
bootstrap();
