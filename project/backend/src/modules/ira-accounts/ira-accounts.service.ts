import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';
import { CreateIraAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class IraAccountsService {

  async createIraAccount(userId: string, data: CreateIraAccountDto) {
    try {
      const result = await db.query(
        `INSERT INTO ira_accounts (user_id, account_type, account_number, custodian_name, beneficiary)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, data.accountType, data.accountNumber, data.custodian, data.beneficiary]
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
