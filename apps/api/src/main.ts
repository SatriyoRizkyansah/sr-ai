import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded files statically
  const uploadsDir = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 3001);
  console.log(
    `🚀 DocMind API running on http://localhost:${process.env.PORT ?? 3001}`,
  );
}
bootstrap();
