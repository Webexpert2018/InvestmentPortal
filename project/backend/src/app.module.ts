import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { IraAccountsModule } from './modules/ira-accounts/ira-accounts.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { EmailModule } from './modules/email/email.module';
import { FundsModule } from './modules/funds/funds.module';
import { FundFlowsModule } from './modules/fund-flows/fund-flows.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { DocusignModule } from './modules/docusign/docusign.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Make env vars available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    AuthModule,
    UsersModule,
    PortfoliosModule,
    TransactionsModule,
    DocumentsModule,
    AuditLogsModule,
    IraAccountsModule,
    ComplianceModule,
    EmailModule,
    FundsModule,
    FundFlowsModule,
    InvestmentsModule,
    DocusignModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
