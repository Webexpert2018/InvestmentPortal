import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { IraAccountsModule } from './modules/ira-accounts/ira-accounts.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,        // Railway host
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production', // Only true in dev
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // Application modules
    AuthModule,
    UsersModule,
    PortfoliosModule,
    TransactionsModule,
    DocumentsModule,
    AuditLogsModule,
    IraAccountsModule,
    ComplianceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
