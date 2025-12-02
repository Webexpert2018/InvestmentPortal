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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ⬇️ DATABASE CONFIG FOR RAILWAY POSTGRES
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,  // Use Railway DB URL
      autoLoadEntities: true,
      synchronize: true, // ❗ Only for development, turn OFF later

      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    }),

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
