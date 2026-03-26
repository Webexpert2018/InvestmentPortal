"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs = __importStar(require("fs"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('🌐 Environment:', process.env.NODE_ENV);
    const configService = app.get(config_1.ConfigService);
    // Try to get PORT from ConfigService first, then environment, then default
    const port = parseInt(configService.get('PORT') || process.env.PORT || '3001', 10);
    app.enableCors();
    // Ensure uploads directory exists
    const uploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'profile-images');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('📁 Created uploads directory:', uploadDir);
    }
    // Serve static files from uploads directory
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/public/uploads',
    });
    // Add validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, //changes hereeeeeeeee make it true
        transform: true,
    }));
    // Swagger Always Enabled (optional)
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Investment Portal API')
        .setDescription('API Documentation for Investment Portal')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    console.log(`🚀 Swagger URL: http://localhost:${port}/api/docs`);
    await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Railway
    console.log(`🚀 App Running On: http://0.0.0.0:${port}`);
}
bootstrap().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map