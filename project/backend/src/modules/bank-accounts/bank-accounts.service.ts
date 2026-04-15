import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class BankAccountsService {
  async findAll(investorId: string) {
    try {
      console.log('📋 [findAll] Fetching bank accounts for investor:', investorId);
      
      // Check if investor exists
      const investorCheck = await db.query(
        'SELECT id FROM investors WHERE id = $1',
        [investorId]
      );
      
      if (investorCheck.rows.length === 0) {
        console.warn(`⚠️ [findAll] Investor not found: ${investorId} - Returning empty array`);
        return [];
      }

      const query = `
        SELECT id, investor_id, bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, status, created_at, updated_at
        FROM investor_bank_accounts 
        WHERE investor_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [investorId]);
      console.log(`✅ [findAll] Found ${result.rows.length} bank accounts for investor: ${investorId}`);
      return result.rows;
    } catch (error) {
      console.error('❌ [findAll] Error fetching bank accounts:', error);
      throw new InternalServerErrorException('Failed to fetch bank accounts');
    }
  }

  async create(investorId: string, data: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description } = data;
    
    try {
      console.log('📝 [create] Creating bank account for investor:', investorId);
      console.log('📝 [create] Data:', { bank_name, beneficiary_name, account_number });

      // Verify investor exists before creating bank account
      const investorCheck = await db.query(
        'SELECT id, email FROM investors WHERE id = $1',
        [investorId]
      );

      if (investorCheck.rows.length === 0) {
        console.error(`❌ [create] Investor not found: ${investorId}`);
        throw new InternalServerErrorException(`Investor with ID ${investorId} not found in system`);
      }

      console.log('✅ [create] Investor verified:', investorCheck.rows[0].email);

      // Validate required fields
      if (!bank_name?.trim()) throw new InternalServerErrorException('Bank name is required');
      if (!account_number?.trim()) throw new InternalServerErrorException('Account number is required');
      if (!routing_number?.trim()) throw new InternalServerErrorException('Routing number is required');
      if (!beneficiary_name?.trim()) throw new InternalServerErrorException('Beneficiary name is required');
      if (!bank_address?.trim()) throw new InternalServerErrorException('Bank address is required');

      const query = `
        INSERT INTO investor_bank_accounts (
          investor_id, bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await db.query(query, [
        investorId,
        bank_name.trim(),
        account_number.trim(),
        routing_number.trim(),
        beneficiary_name.trim(),
        bank_address.trim(),
        bank_description?.trim() || null,
      ]);

      console.log('✅ [create] Bank account created successfully:', result.rows[0].id);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'CREATE_BANK_ACCOUNT',
          'bank_account',
          result.rows[0].id,
          JSON.stringify({ bank_name, beneficiary_name, timestamp: new Date().toISOString() })
        ]
      ).catch(err => console.warn('⚠️ [create] Audit log failed:', err));

      return result.rows[0];
    } catch (error: any) {
      console.error('❌ [create] Error creating bank account:', error.message);
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create bank account');
    }
  }

  async delete(investorId: string, accountId: string) {
    try {
      console.log('🗑️ [delete] Deleting bank account:', accountId, 'for investor:', investorId);
      
      const query = `
        DELETE FROM investor_bank_accounts 
        WHERE id = $1 AND investor_id = $2
        RETURNING *
      `;
      const result = await db.query(query, [accountId, investorId]);
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ [delete] Bank account not found: ${accountId} for investor ${investorId}`);
        throw new NotFoundException('Bank account not found');
      }

      console.log('✅ [delete] Bank account deleted successfully:', accountId);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'DELETE_BANK_ACCOUNT',
          'bank_account',
          accountId,
          JSON.stringify({ bank_name: result.rows[0].bank_name, timestamp: new Date().toISOString() })
        ]
      ).catch(err => console.warn('⚠️ [delete] Audit log failed:', err));

      return { message: 'Bank account deleted successfully', id: accountId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ [delete] Error deleting bank account:', error);
      throw new InternalServerErrorException('Failed to delete bank account');
    }
  }

  async update(investorId: string, accountId: string, data: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, status } = data;
    try {
      console.log('✏️ [update] Updating bank account:', accountId, 'for investor:', investorId);
      let query = 'UPDATE investor_bank_accounts SET updated_at = CURRENT_TIMESTAMP';
      const values: any[] = [];
      let paramCount = 1;

      if (bank_name !== undefined && bank_name !== null) {
        query += `, bank_name = $${paramCount++}`;
        values.push(bank_name.trim());
      }
      if (account_number !== undefined && account_number !== null) {
        query += `, account_number = $${paramCount++}`;
        values.push(account_number.trim());
      }
      if (routing_number !== undefined && routing_number !== null) {
        query += `, routing_number = $${paramCount++}`;
        values.push(routing_number.trim());
      }
      if (beneficiary_name !== undefined && beneficiary_name !== null) {
        query += `, beneficiary_name = $${paramCount++}`;
        values.push(beneficiary_name.trim());
      }
      if (bank_address !== undefined && bank_address !== null) {
        query += `, bank_address = $${paramCount++}`;
        values.push(bank_address.trim());
      }
      if (bank_description !== undefined) {
        query += `, bank_description = $${paramCount++}`;
        values.push(bank_description ? bank_description.trim() : null);
      }
      if (status !== undefined && status !== null) {
        query += `, status = $${paramCount++}`;
        values.push(status);
      }

      query += ` WHERE id = $${paramCount++} AND investor_id = $${paramCount++} RETURNING *`;
      values.push(accountId, investorId);

      console.log(`✏️ [update] Query values:`, values);
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ [update] Bank account not found: ${accountId} for investor ${investorId}`);
        throw new NotFoundException('Bank account not found');
      }

      console.log('✅ [update] Bank account updated successfully:', accountId);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          investorId,
          'UPDATE_BANK_ACCOUNT',
          'bank_account',
          accountId,
          JSON.stringify({ updated_fields: Object.keys(data), timestamp: new Date().toISOString() })
        ]
      ).catch(err => console.warn('⚠️ [update] Audit log failed:', err));

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ [update] Error updating bank account:', error);
      throw new InternalServerErrorException('Failed to update bank account');
    }
  }
}
