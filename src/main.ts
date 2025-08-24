import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Static uploads folder
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // CORS
  app.enableCors({
    origin: 'http://localhost:3000', // غيّر حسب frontend
    credentials: true,
  });

  // ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


  // PostgreSQL connection
  const dataSource = app.get(DataSource);
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
      console.log('✅ PostgreSQL connected successfully');
    } catch (err) {
      console.error('❌ PostgreSQL connection error:', err);
    }
  } else {
    console.log('✅ PostgreSQL already initialized');
  }

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('The e-commerce API description')
    .setVersion('1.0')
    .addTag('e-commerce')
    // .addServer('http://68.168.218.11/ecommerce-api') // <- مهم
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI available at /docs
  SwaggerModule.setup('', app, document);

  // Start server
  const port = process.env.PORT ?? 5003;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📄 Swagger UI available on http://localhost:${port}/docs`);
}

bootstrap();
