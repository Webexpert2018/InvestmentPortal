import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  async findAll(role?: string) {
    if (role === 'executive_admin') {
      const result = await db.query(
        `SELECT id, first_name || ' ' || last_name as full_name, email, phone, role, status, 
                0 as assigned_investors_count, null as profile_image_url, created_at, updated_at,
                null as associated_fund_name, null as associated_fund_id
         FROM users 
         WHERE role = 'executive_admin'
         ORDER BY created_at DESC`
      );
      return result.rows;
    }

    let query = `
      SELECT s.id, s.full_name, s.email, s.phone, s.role, s.status, 
             s.assigned_investors_count, s.profile_image_url, s.created_at, s.updated_at,
             f.name as associated_fund_name, f.id as associated_fund_id
      FROM staff s
      LEFT JOIN funds f ON s.associated_fund_id = f.id
    `;
    const params = [];

    if (role) {
      query += ' WHERE s.role = $1';
      params.push(role);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async findOne(id: string) {
    // 1. Try staff table
    const staffResult = await db.query(
      `SELECT s.*, f.name as associated_fund_name 
       FROM staff s 
       LEFT JOIN funds f ON s.associated_fund_id = f.id 
       WHERE s.id = $1`,
      [id]
    );
    if (staffResult.rows.length > 0) {
      return staffResult.rows[0];
    }

    // 2. Try users table
    const userResult = await db.query(
      `SELECT id, first_name || ' ' || last_name as full_name, first_name, last_name, email, phone, role, status, created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [id]
    );
    if (userResult.rows.length > 0) {
      return userResult.rows[0];
    }

    throw new NotFoundException('Staff member not found');
  }


  async create(createStaffDto: CreateStaffDto) {
    const { full_name, email, phone, password, role, associated_fund_id, profile_image_url } = createStaffDto;

    // Strict prohibition of creating executive_admin through this service
    if (role === 'executive_admin') {
      throw new ConflictException('Executive Admin accounts cannot be created here. Please use the registration flow.');
    }

    // Check if email already exists in ANY table to avoid duplicates
    const [existingStaff, existingUser] = await Promise.all([
      db.query('SELECT id FROM staff WHERE email = $1', [email]),
      db.query('SELECT id FROM users WHERE email = $1', [email])
    ]);

    if (existingStaff.rows.length > 0 || existingUser.rows.length > 0) {
      throw new ConflictException('Staff with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO staff (full_name, email, phone, password_hash, role, associated_fund_id, assigned_investors_count, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, full_name, email, role, status, profile_image_url, created_at`,
      [full_name, email, phone, passwordHash, role, associated_fund_id || null, 0, profile_image_url || null]
    );

    return result.rows[0];
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    // Detect which table the account belongs to
    const existing = await this.findOne(id);
    const tableName = existing.role === 'executive_admin' ? 'users' : 'staff';

    const fields = [];
    const values = [];
    let placeholderIndex = 1;

    for (const [key, value] of Object.entries(updateStaffDto)) {
      if (value !== undefined) {
        if (key === 'password') {
          fields.push(`password_hash = $${placeholderIndex++}`);
          values.push(await bcrypt.hash(value, 10));
        } else if (tableName === 'users' && key === 'full_name') {
           // Handle name split for users table if updated
           const nameParts = (value as string).split(' ');
           fields.push(`first_name = $${placeholderIndex++}`);
           values.push(nameParts[0]);
           fields.push(`last_name = $${placeholderIndex++}`);
           values.push(nameParts.slice(1).join(' '));
        } else {
          fields.push(`${key} = $${placeholderIndex++}`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    values.push(id);
    const query = `UPDATE ${tableName} SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${placeholderIndex} RETURNING *`;
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return result.rows[0];
  }

  async remove(id: string) {
    // Try deleting from both tables
    const staffDelete = await db.query('DELETE FROM staff WHERE id = $1 RETURNING id', [id]);
    if (staffDelete.rows.length > 0) {
      return { message: 'Staff member deleted successfully' };
    }

    const userDelete = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (userDelete.rows.length > 0) {
      return { message: 'Administrative user deleted successfully' };
    }

    throw new NotFoundException('Staff member not found');
  }

}
