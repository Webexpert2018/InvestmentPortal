import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class UsersService {
  async getProfile(userId: string) {
    const result = await db.query(
      'SELECT id, email, role, first_name, last_name, phone, status, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      status: user.status,
      createdAt: user.created_at,
    };
  }

  async updateProfile(userId: string, firstName?: string, lastName?: string, phone?: string) {
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, first_name, last_name, phone, status`,
      values
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      status: user.status,
    };
  }

  async getAllUsers(requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenException('Only admins can view all users');
    }

    const result = await db.query(
      'SELECT id, email, role, first_name, last_name, phone, status, created_at FROM users ORDER BY created_at DESC'
    );

    return result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      status: user.status,
      createdAt: user.created_at,
    }));
  }

  async getUserById(targetUserId: string, requestingUserId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin' && requestingUserId !== targetUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const result = await db.query(
      'SELECT id, email, role, first_name, last_name, phone, status, created_at FROM users WHERE id = $1',
      [targetUserId]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      status: user.status,
      createdAt: user.created_at,
    };
  }

  async updateUserStatus(userId: string, status: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenException('Only admins can update user status');
    }

    const result = await db.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, status',
      [status, userId]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { id: user.id, email: user.email, status: user.status };
  }
}
