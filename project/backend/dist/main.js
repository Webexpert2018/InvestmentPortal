"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    // ---------------------------------------------------------
    // ✅ SWAGGER DOCUMENTATION SETUP
    // ---------------------------------------------------------
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bitcoin IRA Platform API')
        .setDescription('API documentation for Bitcoin IRA backend')
        .setVersion('1.0')
        .addBearerAuth() // Adds Authorization header
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    console.log('📘 Swagger Docs: http://localhost:3001/api/docs');
    // ---------------------------------------------------------
    const PORT = process.env.PORT || 3001;
    await app.listen(PORT);
    console.log(`🚀 Bitcoin IRA Platform API (NestJS) running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map