import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOriginsRaw = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:*'];

  const allowLocalhostAnyPort = allowedOriginsRaw.includes('http://localhost:*');
  const explicitOrigins = allowedOriginsRaw.filter((origin) => origin !== 'http://localhost:*');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (explicitOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (allowLocalhostAnyPort && /^http:\/\/localhost(?::\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ['POST', 'OPTIONS'],
  });

  const port = parseInt(process.env.PORT ?? process.env.NEST_PORT ?? '3001', 10);
  await app.listen(port);
  console.log(`NestJS gateway escuchando en puerto ${port}`);
}

void bootstrap();

