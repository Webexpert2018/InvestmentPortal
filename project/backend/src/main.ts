import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

let cachedApp: NestExpressApplication;
let isInitializing = false;
let initializationPromise: Promise<NestExpressApplication> | null = null;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const app = await NestFactory.create<NestExpressApplication>(AppModule);

      const configService = app.get(ConfigService);
      const port = parseInt(
        configService.get('PORT') || process.env.PORT || '3001',
        10,
      );

      app.enableCors();

      const isVercel = process.env.VERCEL === '1';
      const uploadDir = isVercel
        ? join('/tmp', 'uploads', 'profile-images')
        : join(process.cwd(), 'uploads', 'profile-images');

      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch (err) {
          console.error('⚠️ Could not create uploads directory:', err);
        }
      }

      app.useStaticAssets(isVercel ? join('/tmp', 'uploads') : join(process.cwd(), 'uploads'), {
        prefix: '/public/uploads',
        setHeaders: (res, path) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          if (path.endsWith('.pdf')) {
            res.setHeader('Content-Disposition', 'inline');
          }
        }
      });

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
      );

      const config = new DocumentBuilder()
        .setTitle('Investment Portal API')
        .setDescription('API Documentation for Investment Portal')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
        customJs: [
          'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.js',
          'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.js',
        ],
      });

      if (!isVercel) {
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 App Running On: http://0.0.0.0:${port}`);
      } else {
        await app.init();
      }

      cachedApp = app;
      return app;
    } catch (err) {
      console.error('💥 Bootstrap error:', err);
      initializationPromise = null;
      throw err;
    }
  })();

  return initializationPromise;
}

// Support for local development
if (process.env.VERCEL !== '1') {
  bootstrap().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
}

// Support for Vercel Serverless Functions
export default async (req: any, res: any) => {
  try {
    const app = await bootstrap();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error: any) {
    console.error('❌ CRITICAL: Vercel Function Invocation Failed:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error during initialization',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
