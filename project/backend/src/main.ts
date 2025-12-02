import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  app.enableCors();

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

bootstrap();
