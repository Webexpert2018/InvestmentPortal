import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { db } from '../../config/database';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(private emailService: EmailService) { }
  async getProfile(userId: string) {
    // First, check the users table (Admin/Staff)
    let result = await db.query(`
      SELECT 
        u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.status, u.created_at, u.profile_image_url
      FROM users u
      WHERE u.id = $1`,
      [userId]
    );

    let user = result.rows[0];

    // If not found in users, check the investors table
    if (!user) {
      result = await db.query(`
        SELECT 
          id, email, 'investor' as role, full_name, phone, status, created_at,
          dob, address_line1, address_line2, city, state, zip_code, country, 
          tax_id, profile_image_url, kyc_status 
        FROM investors
        WHERE id = $1`,
        [userId]
      );
      user = result.rows[0];
      
      if (user && user.full_name) {
        // Map full_name to firstName/lastName for frontend consistency
        const [firstName, ...lastNameParts] = user.full_name.split(' ');
        user.firstName = firstName;
        user.lastName = lastNameParts.join(' ');
      }
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      phone: user.phone,
      status: user.status,
      createdAt: user.created_at,
      dob: user.dob,
      addressLine1: user.address_line1,
      addressLine2: user.address_line2,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      country: user.country,
      taxId: user.tax_id,
      profileImageUrl: user.profile_image_url,
      kycStatus: user.kyc_status
    };
  }

  async updateProfile(
    userId: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    dob?: string,
    addressLine1?: string,
    addressLine2?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string,
    taxId?: string,
    profileImageUrl?: string,
  ) {
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (dob !== undefined) {
      updates.push(`dob = $${paramIndex++}`);
      values.push(dob === '' ? null : dob);
    }
    if (addressLine1 !== undefined) {
      updates.push(`address_line1 = $${paramIndex++}`);
      values.push(addressLine1);
    }
    if (addressLine2 !== undefined) {
      updates.push(`address_line2 = $${paramIndex++}`);
      values.push(addressLine2);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(state);
    }
    if (zipCode !== undefined) {
      updates.push(`zip_code = $${paramIndex++}`);
      values.push(zipCode);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(country);
    }
    if (taxId !== undefined) {
      updates.push(`tax_id = $${paramIndex++}`);
      values.push(taxId);
    }
    if (profileImageUrl !== undefined) {
      updates.push(`profile_image_url = $${paramIndex++}`);
      values.push(profileImageUrl);
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, first_name, last_name, phone, status, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url`,
      values,
    );

    console.log(`[UsersService] Updated profile for user ${userId}. New profile_image_url: ${result.rows[0].profile_image_url}`);

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
      dob: user.dob,
      addressLine1: user.address_line1,
      addressLine2: user.address_line2,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      country: user.country,
      taxId: user.tax_id,
      profileImageUrl: user.profile_image_url,
    };
  }

  async getAllUsers(requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenException('Only admins can view all users');
    }

    const result = await db.query(`
      SELECT 
        id, email, role, full_name as "firstName", '' as "lastName", phone, status, created_at as "createdAt", 
        kyc_status as "kycStatus", profile_image_url as "profileImageUrl",
        (SELECT COALESCE(SUM(investment_amount), 0) FROM investments WHERE user_id = investors.id) as total_invested
      FROM investors
      ORDER BY created_at DESC
    `);

    return result.rows.map((user) => ({
      ...user,
      firstName: user.firstName,
      lastName: user.lastName,
      invested: `$${parseFloat(user.total_invested).toFixed(2)}`,
      avatar: user.firstName[0].toUpperCase(),
    }));
  }

  async getUserById(targetUserId: string, requestingUserId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin' && requestingUserId !== targetUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    // First, check the users table (Admin/Staff)
    let result = await db.query(
      'SELECT id, email, role, first_name, last_name, phone, status, created_at, profile_image_url FROM users WHERE id = $1',
      [targetUserId]
    );

    let user = result.rows[0];

    // If not found in users, check the investors table
    if (!user) {
      result = await db.query(`
        SELECT 
          id, email, 'investor' as role, full_name, phone, status, created_at,
          dob, address_line1, address_line2, city, state, zip_code, country, 
          tax_id, profile_image_url, kyc_status 
        FROM investors
        WHERE id = $1`,
        [targetUserId]
      );
      user = result.rows[0];
      
      if (user && user.full_name) {
        // Map full_name to firstName/lastName for frontend consistency
        const [firstName, ...lastNameParts] = user.full_name.split(' ');
        user.firstName = firstName;
        user.lastName = lastNameParts.join(' ');
      }
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      phone: user.phone,
      status: user.status,
      createdAt: user.created_at,
      dob: user.dob,
      addressLine1: user.address_line1,
      addressLine2: user.address_line2,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      country: user.country,
      taxId: user.tax_id,
      profileImageUrl: user.profile_image_url,
      kycStatus: user.kyc_status
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

  async updateKycStatus(userId: string, kycStatus: string, requestingUserRole: string, requestingUserId?: string) {
    if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
      throw new ForbiddenException('You do not have permission to update this KYC status');
    }

    const result = await db.query(
      'UPDATE investors SET kyc_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, kyc_status',
      [kycStatus.toLowerCase(), userId]
    );

    const investor = result.rows[0];

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    return { id: investor.id, kycStatus: investor.kyc_status };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const userResult = await db.query(
      'SELECT email, first_name, password_hash FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Send password changed notification
    this.emailService.sendPasswordChangedEmail(user.email || '', user.first_name || 'User', newPassword)
      .catch(err => console.error(`Failed to send password changed email to ${user.email}:`, err));

    return { message: 'Password updated successfully' };
  }
}
