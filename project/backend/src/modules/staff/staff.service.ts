import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  async findAll(role?: string) {
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
    const result = await db.query(
      `SELECT s.*, f.name as associated_fund_name 
       FROM staff s 
       LEFT JOIN funds f ON s.associated_fund_id = f.id 
       WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return result.rows[0];
  }

  async create(createStaffDto: CreateStaffDto) {
    const { full_name, email, phone, password, role, associated_fund_id, profile_image_url } = createStaffDto;

    // Check if email already exists in staff table
    const existingStaff = await db.query('SELECT id FROM staff WHERE email = $1', [email]);
    if (existingStaff.rows.length > 0) {
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
    const fields = [];
    const values = [];
    let placeholderIndex = 1;

    for (const [key, value] of Object.entries(updateStaffDto)) {
      if (value !== undefined) {
        if (key === 'password') {
          fields.push(`password_hash = $${placeholderIndex++}`);
          values.push(await bcrypt.hash(value, 10));
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
    const query = `UPDATE staff SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${placeholderIndex} RETURNING *`;
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return result.rows[0];
  }

  async remove(id: string) {
    const result = await db.query('DELETE FROM staff WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return { message: 'Staff member deleted successfully' };
  }
}
