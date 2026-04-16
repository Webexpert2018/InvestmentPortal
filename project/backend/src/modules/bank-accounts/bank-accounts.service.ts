import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class BankAccountsService {
  async findAll(userId: string) {
    try {
      console.log('📋 [findAll] Fetching bank accounts for user:', userId);

      const query = `
        SELECT id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, status, created_at, updated_at
        FROM user_bank_accounts
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [userId]);
      console.log(`✅ [findAll] Found ${result.rows.length} bank accounts for user: ${userId}`);
      return result.rows;
    } catch (error) {
      console.error('❌ [findAll] Error fetching bank accounts:', error);
      throw new InternalServerErrorException('Failed to fetch bank accounts');
    }
  }

  async create(userId: string, data: any, user: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description } = data;
    const accountRole = user.role;
    if (!accountRole) {
      throw new InternalServerErrorException('User role not found in request');
    }
    
    try {
      console.log('📝 [create] Creating bank account for user:', userId, 'role:', accountRole);
      console.log('📝 [create] Data:', { bank_name, beneficiary_name, account_number });

      // Validate required fields
      if (!bank_name?.trim()) throw new InternalServerErrorException('Bank name is required');
      if (!account_number?.trim()) throw new InternalServerErrorException('Account number is required');
      if (!routing_number?.trim()) throw new InternalServerErrorException('Routing number is required');
      if (!beneficiary_name?.trim()) throw new InternalServerErrorException('Beneficiary name is required');
      if (!bank_address?.trim()) throw new InternalServerErrorException('Bank address is required');

      const query = `
        INSERT INTO user_bank_accounts (
          user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await db.query(query, [
        userId,
        accountRole,
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
          userId,
          'CREATE_BANK_ACCOUNT',
          'bank_account',
          result.rows[0].id,
          JSON.stringify({ bank_name, beneficiary_name, role: accountRole, timestamp: new Date().toISOString() })
        ]
      ).catch(err => console.warn('⚠️ [create] Audit log failed:', err));

      return result.rows[0];
    } catch (error: any) {
      console.error('❌ [create] Error creating bank account:', error.message);
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create bank account');
    }
  }

  async delete(userId: string, accountId: string) {
    try {
      console.log('🗑️ [delete] Deleting bank account:', accountId, 'for user:', userId);
      
      const query = `
        DELETE FROM user_bank_accounts
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await db.query(query, [accountId, userId]);
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ [delete] Bank account not found: ${accountId} for user ${userId}`);
        throw new NotFoundException('Bank account not found');
      }

      console.log('✅ [delete] Bank account deleted successfully:', accountId);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          'DELETE_BANK_ACCOUNT',
          'bank_account',
          accountId,
          JSON.stringify({ bank_name: result.rows[0].bank_name, role: result.rows[0].role, timestamp: new Date().toISOString() })
        ]
      ).catch(err => console.warn('⚠️ [delete] Audit log failed:', err));

      return { message: 'Bank account deleted successfully', id: accountId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ [delete] Error deleting bank account:', error);
      throw new InternalServerErrorException('Failed to delete bank account');
    }
  }

  async update(userId: string, accountId: string, data: any, user: any) {
    const { bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, status } = data; // role ignored for security
    try {
      console.log('✏️ [update] Updating bank account:', accountId, 'for user:', userId);
      let query = 'UPDATE user_bank_accounts SET updated_at = CURRENT_TIMESTAMP';
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

      query += ` WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`;
      values.push(accountId, userId);

      console.log(`✏️ [update] Query values:`, values);
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ [update] Bank account not found: ${accountId} for user ${userId}`);
        throw new NotFoundException('Bank account not found');
      }

      console.log('✅ [update] Bank account updated successfully:', accountId);

      // Add audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
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

