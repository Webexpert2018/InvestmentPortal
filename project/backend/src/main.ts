import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Enable CORS if needed
  app.enableCors();

  // Setup Swagger only in dev or if explicitly enabled
  if (configService.get<string>('NODE_ENV') !== 'production' || true) {
    const config = new DocumentBuilder()
      .setTitle('Investment Portal API')
      .setDescription('API documentation for Investment Portal')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`Swagger available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
