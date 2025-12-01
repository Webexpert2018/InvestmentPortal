import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.enableCors({
  //   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  //   credentials: true,
  // });
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ---------------------------------------------------------
  // ✅ SWAGGER DOCUMENTATION SETUP
  // ---------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('Bitcoin IRA Platform API')
    .setDescription('API documentation for Bitcoin IRA backend')
    .setVersion('1.0')
    .addBearerAuth() // Adds Authorization header
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  console.log('📘 Swagger Docs: http://localhost:3001/api/docs');
  // ---------------------------------------------------------

  const PORT = process.env.PORT || 3001;

  await app.listen(PORT);
  console.log(`🚀 Bitcoin IRA Platform API (NestJS) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}

bootstrap();
