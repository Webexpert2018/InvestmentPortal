import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class BankAccountsService {
  async findAll(investorId: string) {
    try {
      const query = `
        SELECT * FROM investor_bank_accounts 
        WHERE investor_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [investorId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching bank accounts:', error);
      throw new InternalServerErrorException('Failed to fetch bank accounts');
    }
  }

  async create(investorId: string, data: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address } = data;
    try {
      const query = `
        INSERT INTO investor_bank_accounts (
          investor_id, bank_name, account_number, routing_number, beneficiary_name, bank_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await db.query(query, [
        investorId,
        bank_name,
        account_number,
        routing_number,
        beneficiary_name,
        bank_address,
      ]);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'CREATE_BANK_ACCOUNT',
          'bank_account',
          result.rows[0].id,
          JSON.stringify({ bank_name })
        ]
      ).catch(err => console.warn('⚠️ Log failed:', err));

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating bank account:', error);
      throw new InternalServerErrorException('Failed to create bank account');
    }
  }

  async delete(investorId: string, accountId: string) {
    try {
      const query = `
        DELETE FROM investor_bank_accounts 
        WHERE id = $1 AND investor_id = $2
        RETURNING *
      `;
      const result = await db.query(query, [accountId, investorId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException('Bank account not found');
      }

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'DELETE_BANK_ACCOUNT',
          'bank_account',
          accountId,
          JSON.stringify({ bank_name: result.rows[0].bank_name })
        ]
      ).catch(err => console.warn('⚠️ Log failed:', err));

      return { message: 'Bank account deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error deleting bank account:', error);
      throw new InternalServerErrorException('Failed to delete bank account');
    }
  }

  async update(investorId: string, accountId: string, data: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address, status } = data;
    try {
      let query = 'UPDATE investor_bank_accounts SET updated_at = CURRENT_TIMESTAMP';
      const values: any[] = [];
      let paramCount = 1;

      if (bank_name !== undefined) {
        query += `, bank_name = $${paramCount++}`;
        values.push(bank_name);
      }
      if (account_number !== undefined) {
        query += `, account_number = $${paramCount++}`;
        values.push(account_number);
      }
      if (routing_number !== undefined) {
        query += `, routing_number = $${paramCount++}`;
        values.push(routing_number);
      }
      if (beneficiary_name !== undefined) {
        query += `, beneficiary_name = $${paramCount++}`;
        values.push(beneficiary_name);
      }
      if (bank_address !== undefined) {
        query += `, bank_address = $${paramCount++}`;
        values.push(bank_address);
      }
      if (status !== undefined) {
        query += `, status = $${paramCount++}`;
        values.push(status);
      }

      query += ` WHERE id = $${paramCount++} AND investor_id = $${paramCount++} RETURNING *`;
      values.push(accountId, investorId);

      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundException('Bank account not found');
      }

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'UPDATE_BANK_ACCOUNT',
          'bank_account',
          accountId,
          JSON.stringify({ bank_name })
        ]
      ).catch(err => console.warn('⚠️ Log failed:', err));

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error updating bank account:', error);
      throw new InternalServerErrorException('Failed to update bank account');
    }
  }
}
