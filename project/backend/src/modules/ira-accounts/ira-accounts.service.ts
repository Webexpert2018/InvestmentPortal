import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { db } from '../../config/database';
// import axios from 'axios';
import { CreateAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class AccountsService {
  // private readonly API_BASE = 'https://sandbox.aet.dev/api/v3';

  constructor() {}

  async getMyIraAccount(userId: string) {
    try {
      console.log('🔍 Fetching IRA accounts for user:', userId);
      const result = await db.query(
        'SELECT * FROM ira_accounts WHERE user_id = $1::uuid ORDER BY created_at DESC',
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

      // 1. Update/Upsert IRA Account - Now using account_number as the conflict target
      const upsertQuery = `
        INSERT INTO ira_accounts (
          user_id, account_number, account_type, custodian_name, beneficiary,
          middle_name, suffix, marital_status, mailing_address_same,
          mailing_address_1, mailing_address_2, mailing_city, mailing_state,
          mailing_zip_code, username, referral_source, ssn, mailing_country
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
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
          username = EXCLUDED.username,
          referral_source = EXCLUDED.referral_source,
          ssn = EXCLUDED.ssn,
          mailing_country = EXCLUDED.mailing_country,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        userId,
        dto.accountNumber,
        dto.accountType,
        dto.custodian,
        dto.beneficiary,
        dto.middleName,
        dto.suffix,
        dto.maritalStatus,
        dto.mailingAddressSame ?? true,
        dto.mailingAddress1,
        dto.mailingAddress2,
        dto.mailingCity,
        dto.mailingState,
        dto.mailingZipCode,
        dto.username,
        dto.referralSource,
        dto.ssn,
        dto.mailingCountry
      ];

      const result = await db.query(upsertQuery, values);

      // 2. Sync Profile Data to investors table
      if (dto.ssn) {
        console.log('🔄 Syncing SSN to investors tax_id...');
        await db.query(
          'UPDATE investors SET tax_id = $1 WHERE id = $2::uuid',
          [dto.ssn, userId]
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
}