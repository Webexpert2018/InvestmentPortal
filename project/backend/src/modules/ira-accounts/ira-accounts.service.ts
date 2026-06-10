import { Injectable, InternalServerErrorException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../../config/database';
import axios from 'axios';
import * as crypto from 'crypto';
import { CreateAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class AccountsService {
  private readonly API_BASE = process.env.AET_API_BASE || 'https://sandbox.aet.dev/api/v3';
  private readonly API_SECRET = process.env.AET_API_SECRET || '3AAHp5pgKaZ4yhVgbRbDng==';
  private readonly API_KEY = process.env.AET_API_KEY || 'PCmkpq87iBsvoJSmhKi3usqu3PxshXDVxikw2auK106e6813';

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

  private generateSignature(method: string, path: string, body: string, timestamp: string): string {
    const payload = timestamp + method.toUpperCase() + path + body;
    console.log('🔑 Signing payload:', payload);
    return crypto
      .createHmac('sha256', this.API_SECRET)
      .update(payload)
      .digest('base64');
  }

  private mapAccountType(type: string): string {
    const t = type.toLowerCase().trim();
    if (t === 'traditional' || t === 'traditional ira') return 'Traditional';
    if (t === 'roth' || t === 'roth ira') return 'Roth';
    if (t === 'sep' || t === 'sep ira') return 'SEP';
    if (t === 'simple' || t === 'simple ira') return 'Simple';
    if (t === 'roth sep') return 'Roth SEP';
    if (t === 'roth simple' || t === 'roth simple ira') return 'Roth SIMPLE';
    if (t === 'db plan' || t === 'dbp' || t === 'defined benefit plan') return 'DBP';
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private mapStateToFullName(state?: string): string {
    if (!state) {
      console.log('📍 State mapping input was empty. Defaulting to: New York');
      return 'New York';
    }
    const cleanState = state.trim().toUpperCase();
    const statesMap: { [key: string]: string } = {
      AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
      CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
      HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
      KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
      MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
      MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
      NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
      OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
      SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
      VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
    };

    let result = statesMap[cleanState];
    if (!result) {
      // Rigorous Title Casing (e.g. "new york" -> "New York", "MARYLAND" -> "Maryland")
      result = state
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    console.log(`📍 State mapping: "${state}" -> "${result}"`);
    return result;
  }

  private mapMaritalStatus(status?: string): string {
    if (!status) return 'Single';
    const s = status.trim().toLowerCase();
    if (s === 'married') return 'Married';
    if (s === 'single') return 'Single';
    if (s === 'divorced') return 'Divorced';
    if (s === 'widowed') return 'Widowed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private sanitizeZipCode(zip?: string): string {
    if (!zip) return '10001';
    const cleaned = zip.trim().replace(/[^0-9]/g, '');
    if (cleaned.length === 5 || cleaned.length === 9) {
      return cleaned;
    }
    return cleaned.slice(0, 5) || '10001';
  }

  private async makeSignedRequest(method: 'POST' | 'GET', pathForSignature: string, relativeUrl: string, bodyObj?: any) {
    const timestamp = Date.now().toString();
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';
    const signature = this.generateSignature(method, pathForSignature, bodyStr, timestamp);

    const url = `${this.API_BASE}${relativeUrl}`;
    console.log(`🚀 Sending signed request to AET: ${method} ${url}`);

    const headers = {
      'Authorization': `Bearer ${this.API_KEY}`,
      'Timestamp': timestamp,
      'Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios({
        method,
        url,
        data: bodyObj,
        headers,
        timeout: 20000 // 20 seconds timeout for remote sandbox
      });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`❌ AET API request failed:`, errorMsg);
      throw new InternalServerErrorException(`External API Error: ${errorMsg}`);
    }
  }

  async getMyIraAccount(userId: string) {
    try {
      console.log('🔍 Fetching IRA accounts for user:', userId);
      const result = await db.query(
        'SELECT * FROM ira_accounts WHERE user_id = $1::uuid ORDER BY email ASC, account_type ASC',
        [userId]
      );
      return result.rows;
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
      console.log('📝 Initializing IRA account creation workflow for user:', userId);
      
      // 0. Validation: Check if user already has an local account of this type
      const checkResult = await db.query(
        'SELECT id FROM ira_accounts WHERE user_id = $1::uuid AND account_type = $2',
        [userId, dto.accountType]
      );

      if (checkResult.rows.length > 0) {
        throw new Error('DUPLICATE_ACCOUNT_TYPE');
      }

      // 1. Fetch user details from databases
      const emailResult = await db.query(
        'SELECT email FROM users WHERE id = $1 UNION SELECT email FROM investors WHERE id = $1',
        [userId]
      );
      const userEmail = emailResult.rows[0]?.email || null;

      const investorResult = await db.query(
        'SELECT * FROM investors WHERE id = $1::uuid',
        [userId]
      );
      const investor = investorResult.rows[0];

      let externalId = investor?.external_id || null;

      // 2. If external_id does not exist, create the user on the external platform first
      if (!externalId) {
        console.log('🔍 External ID not found. Registering user on AET Sandbox platform...');
        
        let firstName = dto.firstName || '';
        let lastName = dto.lastName || '';
        if (!firstName && investor?.full_name) {
          const parts = investor.full_name.trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }
        if (!firstName) firstName = 'First';
        if (!lastName) lastName = 'Last';

        const rawSsn = dto.ssn || dto.taxId || investor?.tax_id || '000000000';
        const sanitizedSsn = rawSsn.replace(/[^0-9]/g, '');

        const dob = dto.dob || (investor?.dob ? new Date(investor.dob).toISOString().split('T')[0] : '1990-01-01');

        const address1 = dto.physicalAddress1 || investor?.address_line1 || '123 Main St';
        const address2 = dto.physicalAddress2 || investor?.address_line2 || '';

        const userPayload: any = {
          ssn: sanitizedSsn,
          rep_id: '100217',
          email: dto.email || investor?.email || userEmail,
          first_name: firstName,
          last_name: lastName,
          send_email: false,
          address_1: address1,
          address_2: address2 || address1,
          city: dto.city || investor?.city || 'New York',
          state: this.mapStateToFullName(dto.state || investor?.state),
          zip: this.sanitizeZipCode(dto.zipCode || investor?.zip_code),
          marital_status: this.mapMaritalStatus(dto.maritalStatus || 'Single')
        };

        if (investor?.investor_type !== 'minor') {
          userPayload.date_of_birth = dob;
        }

        const userResponse = await this.makeSignedRequest('POST', 'api/v3/users', '/users', userPayload);
        externalId = userResponse?.data?.id?.toString() || null;

        if (!externalId) {
          throw new InternalServerErrorException('Failed to retrieve external user ID from AET platform response.');
        }

        console.log(`✅ User registered on AET with ID: ${externalId}. Saving external_id to local investor record.`);
        await db.query(
          'UPDATE investors SET external_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2::uuid',
          [externalId, userId]
        );
      } else {
        console.log(`ℹ️ Investor already registered with AET. External ID: ${externalId}`);
      }

      // 3. Create the IRA account on the external platform
      console.log(`🚀 Requesting new IRA account on AET platform for external ID: ${externalId}...`);
      const accountPayload = {
        type: this.mapAccountType(dto.accountType)
      };

      const accountResponse = await this.makeSignedRequest(
        'POST',
        `/api/v3/users/${externalId}/accounts`,
        `/users/${externalId}/accounts`,
        accountPayload
      );

      const externalAccount = accountResponse?.data?.[0] || accountResponse?.data;
      const externalAccountNumber = externalAccount?.account_number || null;
      const externalAccountId = externalAccount?.id?.toString() || null;

      if (!externalAccountNumber) {
        console.warn('⚠️ AET response did not contain an account number. Using random fallback.');
      }

      // 4. Save the account details locally in the database
      const upsertQuery = `
        INSERT INTO ira_accounts (
          user_id, account_number, account_type, custodian_name, beneficiary,
          middle_name, suffix, marital_status, mailing_address_same,
          mailing_address_1, mailing_address_2, mailing_city, mailing_state,
          mailing_zip_code, mailing_country, email, external_account_id, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active'
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
          external_account_id = EXCLUDED.external_account_id,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        userId,
        externalAccountNumber || dto.accountNumber?.trim() || `AET-${Math.floor(100000 + Math.random() * 900000)}`,
        dto.accountType,
        dto.custodian?.trim() || 'American Estate & Trust',
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
        userEmail,
        externalAccountId
      ];

      const result = await db.query(upsertQuery, values);

      // 5. Sync Profile Data to investors table (SSN/TaxID)
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
        message: 'IRA account saved locally and synced with external platform successfully'
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
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations', 'accountant'];
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