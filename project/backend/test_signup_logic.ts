import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/modules/auth/auth.service';
import { db } from './src/config/database';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const timestamp = Date.now();
  console.log('Testing Admin Signup...');
  await authService.signup(`admin_${timestamp}@test.com`, 'Pass123!', 'Admin', 'User', '1234567890', '1990-01-01', 'admin');

  console.log('Testing Accountant Signup...');
  await authService.signup(`acc_${timestamp}@test.com`, 'Pass123!', 'Acc', 'User', '1234567890', '1990-01-01', 'accountant');

  console.log('Testing Investor Signup...');
  await authService.signup(`inv_${timestamp}@test.com`, 'Pass123!', 'Inv', 'User', '1234567890', '1990-01-01', 'investor');

  console.log('\n--- Final Database State ---');
  const users = await db.query('SELECT email, role FROM users WHERE email LIKE $1', [`%_${timestamp}@test.com`]);
  console.log('Users Table:');
  console.table(users.rows);

  const investors = await db.query('SELECT email, role FROM investors WHERE email LIKE $1', [`%Inv_${timestamp}@test.com`]);
  // Wait, email for investor will be inv_{timestamp}@test.com
  const investorsReal = await db.query('SELECT email, role FROM investors WHERE email LIKE $1', [`%_${timestamp}@test.com`]);
  console.log('Investors Table:');
  console.table(investorsReal.rows);

  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
