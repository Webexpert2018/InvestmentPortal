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

      app.enableCors({
        origin: true, // This will reflect the origin of the request
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
      });

      const isVercel = process.env.VERCEL === '1';
      const uploadsBaseDir = isVercel
        ? join('/tmp', 'uploads')
        : join(process.cwd(), 'uploads');
      
      const profileImagesDir = join(uploadsBaseDir, 'profile-images');

      if (!fs.existsSync(profileImagesDir)) {
        try {
          fs.mkdirSync(profileImagesDir, { recursive: true });
        } catch (err) {
          console.error('⚠️ Could not create profile images directory:', err);
        }
      }

      // Serve the ephemeral uploads directory (for any new uploads while running)
      console.log(`📂 Serving ephemeral uploads from: ${uploadsBaseDir}`);
      app.useStaticAssets(uploadsBaseDir, {
        prefix: '/public/uploads/',
        setHeaders: (res, path) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          if (path.endsWith('.pdf')) {
            res.setHeader('Content-Disposition', 'inline');
          }
        }
      });

      // Serve the bundled public directory (for static assets pushed to GitHub)
      console.log(`📂 Serving bundled public assets from: ${join(process.cwd(), 'public')}`);
      app.useStaticAssets(join(process.cwd(), 'public'), {
        prefix: '/public/',
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
  // 🔍 Diagnostic Check: Ensure critical env vars are present
  const missingVars = [];
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
  if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

  if (missingVars.length > 0 && (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production')) {
    console.error(`❌ MISSING CONFIGURATION: ${missingVars.join(', ')}`);
    return res.status(500).json({
      statusCode: 500,
      message: 'Backend Configuration Error',
      error: `Missing environment variables: ${missingVars.join(', ')}. Please add them in the Vercel Dashboard -> Settings -> Environment Variables.`,
    });
  }

  try {
    const app = await bootstrap();
    const server = app.getHttpAdapter().getInstance();

    // Handle Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(204).end();
    }

    return server(req, res);
  } catch (error: any) {
    console.error('❌ CRITICAL: Vercel Function Invocation Failed:', error);
    // If we're here, it's a real code or connection error, not just a missing env var
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error during initialization',
      error: error.message || 'Unknown error',
      details: 'Check Vercel logs for the full stack trace.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
