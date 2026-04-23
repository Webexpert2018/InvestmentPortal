import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RedemptionsService {
  constructor(private readonly notificationsService: NotificationsService) { }

  async create(userId: string, data: any) {
    const { investment_id, amount, reason, bank_info } = data;

    try {
      // 1. Fetch latest active NAV to ensure price accuracy
      const navResult = await db.query(
        `SELECT nav_per_unit FROM fund_nav_history 
         WHERE status = 'active' 
         ORDER BY effective_date DESC 
         LIMIT 1`
      );

      if (navResult.rows.length === 0) {
        throw new BadRequestException('The fund is currently not accepting redemptions (No active NAV found).');
      }

      const currentNav = parseFloat(navResult.rows[0].nav_per_unit);

      // 2. Validate investment exists and belongs to user
      // Note: investments table still uses 'user_id' as the column name
      const invQuery = `
        SELECT i.*, f.name as fund_name
        FROM investments i
        JOIN funds f ON i.fund_id = f.id
        WHERE i.id = $1 AND i.user_id = $2
      `;
      const invResult = await db.query(invQuery, [investment_id, userId]);

      if (invResult.rows.length === 0) {
        throw new NotFoundException('Investment not found');
      }

      const investment = invResult.rows[0];

      // 3. Calculate units to be redeemed
      const units = parseFloat(amount) / currentNav;

      // 3. Validation: Check if user has enough units
      const availableUnits = parseFloat(investment.revised_amount || investment.estimated_units);
      if (units > availableUnits) {
        throw new BadRequestException(
          `Insufficient units. requested: ${units.toFixed(4)}, available: ${availableUnits.toFixed(4)}`
        );
      }

      // 4. Create redemption request
      // Note: redemptions table has been updated to use 'investor_id'
      const query = `
        INSERT INTO redemptions (investor_id, investment_id, amount, units, reason, bank_info, status, is_reconciled)
        VALUES ($1, $2, $3, $4, $5, $6, 'Pending', NULL)
        RETURNING *
      `;
      const result = await db.query(query, [
        userId,
        investment_id,
        amount,
        units,
        reason,
        bank_info ? JSON.stringify(bank_info) : null,
      ]);

      // Notify admin/staff about new redemption request
      this.notificationsService.createNotification({
        targetRole: 'executive_admin',
        title: 'New Redemption Request',
        description: `A new redemption request of $${parseFloat(amount).toLocaleString()} has been submitted. Review and begin the verification process.`,
        type: 'redemption',
        link: `/dashboard/investor/${userId}`
      }).catch(err => console.error('Failed to create redemption notification:', err));

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      console.error('❌ Error creating redemption:', error);
      throw new InternalServerErrorException('Failed to create redemption request');
    }
  }

  async findAllForUser(userId: string) {
    try {
      const query = `
        SELECT r.*, f.name as fund_name, i.investment_amount as original_investment
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN funds f ON i.fund_id = f.id
        WHERE r.investor_id = $1
        ORDER BY r.created_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching redemptions:', error);
      throw new InternalServerErrorException('Failed to fetch redemptions');
    }
  }

  async findAll() {
    try {
      const query = `
        SELECT r.*, 
               inv.full_name as investor_name, 
               inv.profile_image_url as avatar_url,
               f.name as fund_name, 
               i.investment_amount as original_investment
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN funds f ON i.fund_id = f.id
        JOIN investors inv ON r.investor_id = inv.id
        ORDER BY r.created_at DESC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching all redemptions:', error);
      throw new InternalServerErrorException('Failed to fetch all redemptions');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const query = `
        SELECT r.*, f.name as fund_name, i.investment_amount as original_investment,
               inv.email as investor_email, i.account_type,
               (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1) as current_nav
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN funds f ON i.fund_id = f.id
        JOIN investors inv ON r.investor_id = inv.id
        WHERE r.id = $1 AND r.investor_id = $2
      `;
      const result = await db.query(query, [id, userId]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Redemption request not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error fetching redemption:', error);
      throw new InternalServerErrorException('Failed to fetch redemption request');
    }
  }

  async findOneGlobal(id: string) {
    try {
      const query = `
        SELECT r.*, 
               inv.full_name as investor_name, 
               inv.email as investor_email,
               inv.profile_image_url as avatar_url,
               f.name as fund_name, 
               i.investment_amount as original_investment,
               i.account_type,
               (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1) as current_nav
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN funds f ON i.fund_id = f.id
        JOIN investors inv ON r.investor_id = inv.id
        WHERE r.id = $1
      `;
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Redemption request not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error fetching redemption global:', error);
      throw new InternalServerErrorException('Failed to fetch redemption request');
    }
  }

  async cancel(id: string, userId: string) {
    try {
      const query = `
        UPDATE redemptions 
        SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND investor_id = $2 AND status = 'Pending'
        RETURNING *
      `;
      const result = await db.query(query, [id, userId]);
      if (result.rows.length === 0) {
        throw new BadRequestException('Redemption request not found or cannot be cancelled (must be in Pending status)');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('❌ Error cancelling redemption:', error);
      throw new InternalServerErrorException('Failed to cancel redemption request');
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      const query = `
        UPDATE redemptions 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await db.query(query, [status, id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Redemption request not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error updating redemption status:', error);
      throw new InternalServerErrorException('Failed to update redemption status');
    }
  }

  async updateInternalAmount(id: string, amount: number) {
    try {
      const query = `
        UPDATE redemptions 
        SET internal_amount = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await db.query(query, [amount, id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Redemption request not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error updating internal amount for redemption:', error);
      throw new InternalServerErrorException('Failed to update internal amount');
    }
  }

  async markAsReconciled(id: string, isReconciled: boolean) {
    try {
      const query = `
        UPDATE redemptions 
        SET is_reconciled = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await db.query(query, [isReconciled, id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Redemption request not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error marking redemption as reconciled:', error);
      throw new InternalServerErrorException('Failed to update reconciliation status');
    }
  }
}
