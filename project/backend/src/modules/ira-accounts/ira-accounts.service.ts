import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';
import { CreateIraAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class IraAccountsService {

  async createIraAccount(userId: string, data: CreateIraAccountDto) {
    try {
      const result = await db.query(
        `INSERT INTO ira_accounts (
          user_id, account_type, account_number, custodian_name, beneficiary,
          middle_name, suffix, marital_status, mailing_address_same,
          mailing_address_1, mailing_address_2, mailing_city, mailing_state, mailing_zip_code, mailing_country,
          username, referral_source,
          first_name, last_name, email, dob, phone, tax_id,
          physical_address_1, physical_address_2, city, state, zip_code, country
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
         RETURNING *`,
        [
          userId, data.accountType, data.accountNumber, data.custodian, data.beneficiary,
          data.middleName, data.suffix, data.maritalStatus, data.mailingAddressSame,
          data.mailingAddress1, data.mailingAddress2, data.mailingCity, data.mailingState, data.mailingZipCode, data.mailingCountry,
          data.username, data.referralSource,
          data.firstName, data.lastName, data.email, data.dob, data.phone, data.taxId,
          data.physicalAddress1, data.physicalAddress2, data.city, data.state, data.zipCode, data.country
        ]
      );
      
      return result.rows[0];
    } catch (error) {
       console.error(error);
       throw new InternalServerErrorException('Failed to create IRA account');
    }
  }

  async getMyIraAccount(userId: string) {
      const result = await db.query(
        'SELECT * FROM ira_accounts WHERE user_id = $1',
        [userId]
      );
      return result.rows[0];
  }


  
}
