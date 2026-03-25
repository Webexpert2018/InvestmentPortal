import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log('🌐 Environment:', process.env.NODE_ENV);
  
  const configService = app.get(ConfigService);
  // Try to get PORT from ConfigService first, then environment, then default
  const port = parseInt(
    configService.get('PORT') || process.env.PORT || '3001',
    10,
  );

  app.enableCors();

  // Ensure uploads directory exists
  const uploadDir = join(process.cwd(), 'uploads', 'profile-images');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
  }

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/public/uploads',
  });

  // Add validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,//changes hereeeeeeeee make it true
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

  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Railway
  console.log(`🚀 App Running On: http://0.0.0.0:${port}`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
