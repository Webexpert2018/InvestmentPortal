import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -------------------------------
  // ✅ CORS Configuration
  // -------------------------------
  // Allow frontend URL from environment, fallback to localhost for dev
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // -------------------------------
  // ✅ Global Validation Pipe
  // -------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // -------------------------------
  // ✅ Swagger Documentation
  // -------------------------------
  // Enable Swagger only if SHOW_SWAGGER is true (default true for local dev)
  const showSwagger = process.env.SHOW_SWAGGER !== 'false';

  if (showSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Bitcoin IRA Platform API')
      .setDescription('API documentation for Bitcoin IRA backend')
      .setVersion('1.0')
      .addBearerAuth() // Adds Authorization header
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(`📘 Swagger Docs: http://localhost:${process.env.PORT || 3001}/api/docs`);
  }

  // -------------------------------
  // ✅ App Listen
  // -------------------------------
  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);

  console.log(`🚀 Bitcoin IRA Platform API (NestJS) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}

bootstrap();
