import { Injectable, InternalServerErrorException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../../config/database';
// import axios from 'axios';
import { CreateAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class AccountsService {
  // private readonly API_BASE = 'https://sandbox.aet.dev/api/v3';

  constructor() {}

  async onModuleInit() {
    console.log('🔄 Checking IRA accounts table for email column and history table...');
    try {
      // 1. Ensure email column exists
      await db.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ira_accounts' AND column_name='email') THEN
                ALTER TABLE ira_accounts ADD COLUMN email VARCHAR(255);
            END IF;
        END $$;
      `);

      // 2. Create history table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS ira_account_status_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ira_account_id UUID NOT NULL,
          user_id UUID NOT NULL,
          email VARCHAR(255),
          old_status VARCHAR(50),
          new_status VARCHAR(50),
          changed_by_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Backfill email from users/investors table if it's null
      await db.query(`
        UPDATE ira_accounts ia
        SET email = u.email
        FROM users u
        WHERE ia.user_id = u.id AND ia.email IS NULL;
      `);
      
      await db.query(`
        UPDATE ira_accounts ia
        SET email = inv.email
        FROM investors inv
        WHERE ia.user_id = inv.id AND ia.email IS NULL;
      `);

      console.log('✅ IRA accounts system initialized successfully.');
    } catch (error) {
      console.error('❌ Error initializing IRA accounts system:', error);
    }
  }

  async getMyIraAccount(userId: string) {
    try {
      console.log('🔍 Fetching IRA accounts for user:', userId);
      const result = await db.query(
        'SELECT * FROM ira_accounts WHERE user_id = $1::uuid ORDER BY email ASC, account_type ASC',
        [userId]
      );
      return result.rows; // Returning all accounts
    } catch (error: any) {
      console.error('❌ Error fetching IRA accounts:', error.message || error);
      throw new InternalServerErrorException('Failed to fetch IRA accounts: ' + (error.message || 'Unknown error'));
    }
  }

  async getAccountTypes() {
    try {
      const result = await db.query('SELECT * FROM ira_account_types ORDER BY name ASC');
      return result.rows;
    } catch (error: any) {
      console.error('❌ Error fetching IRA account types:', error.message || error);
      throw new InternalServerErrorException('Failed to fetch IRA account types');
    }
  }

  async createAccount(userId: string, dto: CreateAccountDto, token: string) {
    try {
      console.log('📝 Saving IRA account details for user:', userId);
      
      // 0. Validation: Check if user already has an account of this type
      const checkResult = await db.query(
        'SELECT id FROM ira_accounts WHERE user_id = $1::uuid AND account_type = $2',
        [userId, dto.accountType]
      );

      if (checkResult.rows.length > 0) {
        throw new Error('DUPLICATE_ACCOUNT_TYPE');
      }

      // 1. Fetch user email for synchronization
      const emailResult = await db.query(
        'SELECT email FROM users WHERE id = $1 UNION SELECT email FROM investors WHERE id = $1',
        [userId]
      );
      const userEmail = emailResult.rows[0]?.email || null;

      // 2. Update/Upsert IRA Account - Now including email
      const upsertQuery = `
        INSERT INTO ira_accounts (
          user_id, account_number, account_type, custodian_name, beneficiary,
          middle_name, suffix, marital_status, mailing_address_same,
          mailing_address_1, mailing_address_2, mailing_city, mailing_state,
          mailing_zip_code, mailing_country, email
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (account_number) DO UPDATE SET
          account_type = EXCLUDED.account_type,
          custodian_name = EXCLUDED.custodian_name,
          beneficiary = EXCLUDED.beneficiary,
          middle_name = EXCLUDED.middle_name,
          suffix = EXCLUDED.suffix,
          marital_status = EXCLUDED.marital_status,
          mailing_address_same = EXCLUDED.mailing_address_same,
          mailing_address_1 = EXCLUDED.mailing_address_1,
          mailing_address_2 = EXCLUDED.mailing_address_2,
          mailing_city = EXCLUDED.mailing_city,
          mailing_state = EXCLUDED.mailing_state,
          mailing_zip_code = EXCLUDED.mailing_zip_code,
          mailing_country = EXCLUDED.mailing_country,
          email = EXCLUDED.email,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        userId,
        dto.accountNumber?.trim() || null,
        dto.accountType,
        dto.custodian?.trim() || null,
        dto.beneficiary || '',
        dto.middleName,
        dto.suffix,
        dto.maritalStatus,
        dto.mailingAddressSame ?? true,
        dto.mailingAddress1,
        dto.mailingAddress2,
        dto.mailingCity,
        dto.mailingState,
        dto.mailingZipCode,
        dto.mailingCountry,
        userEmail
      ];

      const result = await db.query(upsertQuery, values);

      // 2. Sync Profile Data to investors table
      const finalTaxId = dto.ssn || dto.taxId;
      if (finalTaxId) {
        console.log('🔄 Syncing SSN/TaxID to investors table...');
        await db.query(
          'UPDATE investors SET tax_id = $1 WHERE id = $2::uuid',
          [finalTaxId, userId]
        );
      }

      return {
        success: true,
        data: result.rows[0],
        message: 'IRA account saved locally successfully'
      };
    } catch (error: any) {
      if (error.message === 'DUPLICATE_ACCOUNT_TYPE') {
        throw new ConflictException('An account of this type already exists for this investor.');
      }
      console.error('❌ Error creating/updating IRA account:', error.message || error);
      throw new InternalServerErrorException(
        'Failed to save account: ' + (error.message || 'Unknown error')
      );
    }
  }

  async updateAccountStatus(accountId: string, status: string, requestingUserRole: string, requestingUserId?: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can update account status');
    }

    try {
      // 1. Fetch current data for audit log
      const currentResult = await db.query(
        'SELECT status, user_id, email FROM ira_accounts WHERE id = $1',
        [accountId]
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundException('IRA account not found');
      }

      const oldStatus = currentResult.rows[0].status;
      const investorId = currentResult.rows[0].user_id;
      const investorEmail = currentResult.rows[0].email;

      // 2. Update the main entry (Current state)
      const updateResult = await db.query(
        'UPDATE ira_accounts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, accountId]
      );

      // 3. INSERT NEW ENTRY in history table (Audit Log)
      await db.query(
        `INSERT INTO ira_account_status_history 
         (ira_account_id, user_id, email, old_status, new_status, changed_by_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [accountId, investorId, investorEmail, oldStatus, status, requestingUserId || null]
      );

      return {
        success: true,
        data: updateResult.rows[0],
        message: `Account status updated to ${status} and logged in history`
      };
    } catch (error: any) {
      console.error('❌ Error updating IRA account status:', error.message || error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Failed to update account status');
    }
  }
}