import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../../config/database';
import { CreateNavEntryDto } from './dto/create-nav-entry.dto';

@Injectable()
export class NavManagementService {
  async getSummary() {
    // 1. Fetch latest active NAV
    const navResult = await db.query(
      `SELECT total_fund_value, nav_per_unit, effective_date 
       FROM fund_nav_history 
       WHERE status = 'active' 
       ORDER BY effective_date DESC 
       LIMIT 1`
    );
    const activeNav = navResult.rows[0];

    // 2. Fetch total investors count
    const investorResult = await db.query('SELECT COUNT(*) as count FROM investors');
    const investorCount = parseInt(investorResult.rows[0].count);

    return {
      currentNav: activeNav ? parseFloat(activeNav.nav_per_unit) : 0,
      totalFundValue: activeNav ? parseFloat(activeNav.total_fund_value) : 0,
      investorCount: investorCount,
      btcTrend: '+6.2%', // Placeholder as requested
      lastUpdated: activeNav ? activeNav.effective_date : null,
    };
  }

  async getHistory() {
    const result = await db.query(
      'SELECT * FROM fund_nav_history ORDER BY effective_date DESC'
    );
    return result.rows.map(row => ({
      ...row,
      total_fund_value: parseFloat(row.total_fund_value),
      total_units: parseFloat(row.total_units),
      nav_per_unit: parseFloat(row.nav_per_unit),
    }));
  }

  async createEntry(dto: CreateNavEntryDto, userId: string) {
    const { effective_date, total_fund_value, total_units, nav_per_unit, note, status } = dto;

    // Validation: No future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(effective_date) > today) {
      throw new BadRequestException('Effective date cannot be in the future');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // If status is 'active', we need to deactivate current active entries
      if (status === 'active') {
        await client.query(
          "UPDATE fund_nav_history SET status = 'inactive' WHERE status = 'active'"
        );
      }

      const result = await client.query(
        `INSERT INTO fund_nav_history (
          effective_date, total_fund_value, total_units, nav_per_unit, note, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [effective_date, total_fund_value, total_units, nav_per_unit, note || null, status || 'inactive', userId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating NAV entry:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getEntryById(id: string) {
    const result = await db.query(
      'SELECT * FROM fund_nav_history WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) {
      throw new BadRequestException('NAV entry not found');
    }
    const row = result.rows[0];
    return {
      ...row,
      total_fund_value: parseFloat(row.total_fund_value),
      total_units: parseFloat(row.total_units),
      nav_per_unit: parseFloat(row.nav_per_unit),
    };
  }

  async updateEntry(id: string, dto: Partial<CreateNavEntryDto>, userId: string) {
    const { effective_date, total_fund_value, total_units, nav_per_unit, note, status } = dto;

    const existingResult = await db.query('SELECT status FROM fund_nav_history WHERE id = $1', [id]);
    if (!existingResult.rows[0]) {
      throw new BadRequestException('NAV entry not found');
    }
    const currentStatus = existingResult.rows[0].status;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // If status is changing to 'active', deactivate others
      if (status === 'active' && currentStatus !== 'active') {
        await client.query(
          "UPDATE fund_nav_history SET status = 'inactive' WHERE status = 'active' AND id != $1",
          [id]
        );
      }

      const updates: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (effective_date) {
        // Validation: No future dates
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(effective_date) > today) {
          throw new BadRequestException('Effective date cannot be in the future');
        }
        updates.push(`effective_date = $${i++}`);
        values.push(effective_date);
      }
      if (total_fund_value !== undefined) {
        updates.push(`total_fund_value = $${i++}`);
        values.push(total_fund_value);
      }
      if (total_units !== undefined) {
        updates.push(`total_units = $${i++}`);
        values.push(total_units);
      }
      if (nav_per_unit !== undefined) {
        updates.push(`nav_per_unit = $${i++}`);
        values.push(nav_per_unit);
      }
      if (note !== undefined) {
        updates.push(`note = $${i++}`);
        values.push(note);
      }
      if (status) {
        updates.push(`status = $${i++}`);
        values.push(status);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length > 0) {
        values.push(id);
        const query = `UPDATE fund_nav_history SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`;
        await client.query(query, values);
      }

      await client.query('COMMIT');
      return this.getEntryById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteEntry(id: string) {
    const result = await db.query('DELETE FROM fund_nav_history WHERE id = $1 RETURNING status', [id]);
    if (result.rowCount === 0) {
      throw new BadRequestException('NAV entry not found');
    }
    return { success: true };
  }
}
