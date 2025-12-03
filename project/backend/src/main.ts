import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('🌐 Environment:', process.env.NODE_ENV);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  app.enableCors();

  // Add validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Always Enabled (optional)
  const config = new DocumentBuilder()
    .setTitle('Investment Portal API')
    .setDescription('API Documentation for Investment Portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  console.log(`🚀 Swagger URL: http://localhost:${port}/api/docs`);

  await app.listen(port);
  console.log(`🚀 App Running On: http://localhost:${port}`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
