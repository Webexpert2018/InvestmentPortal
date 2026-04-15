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
    
    // If not found in users, check the staff table
    if (!user) {
      result = await db.query(`
        SELECT 
          id, email, role, full_name, phone, status, created_at, profile_image_url
        FROM staff
        WHERE id = $1`,
        [userId]
      );
      user = result.rows[0];
    }

    // If still not found, check the investors table
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
    }

    // Standardize Name Fields for Staff and Investors
    if (user && user.full_name) {
      const nameParts = user.full_name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
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
    // Determine which table handles this user
    let tableName: string | null = null;
    let nameFieldType: 'split' | 'full' = 'split';

    // 1. Check users table
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length > 0) {
      tableName = 'users';
      nameFieldType = 'split';
    } else {
      // 2. Check investors table
      const investorCheck = await db.query('SELECT id FROM investors WHERE id = $1', [userId]);
      if (investorCheck.rows.length > 0) {
        tableName = 'investors';
        nameFieldType = 'full';
      } else {
        // 3. Check staff table
        const staffCheck = await db.query('SELECT id FROM staff WHERE id = $1', [userId]);
        if (staffCheck.rows.length > 0) {
          tableName = 'staff';
          nameFieldType = 'full';
        }
      }
    }

    if (!tableName) {
      throw new NotFoundException('User profile not found in any registration table');
    }

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle names based on table structure
    if (nameFieldType === 'full') {
      if (firstName !== undefined || lastName !== undefined) {
        const currentRes = await db.query(`SELECT full_name FROM ${tableName} WHERE id = $1`, [userId]);
        const currentFullName = currentRes.rows[0]?.full_name || '';
        const [currFirst, ...currLastParts] = currentFullName.split(' ');
        
        const finalFirst = firstName !== undefined ? firstName : currFirst;
        const finalLast = lastName !== undefined ? lastName : currLastParts.join(' ');
        const fullName = `${finalFirst} ${finalLast}`.trim();

        updates.push(`full_name = $${paramIndex++}`);
        values.push(fullName);
      }
    } else {
      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
    }

    // Common fields across all tables
    const fieldMap: Record<string, any> = {
      phone,
      dob,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      state,
      zip_code: zipCode,
      country,
      tax_id: taxId,
      profile_image_url: profileImageUrl,
    };

    for (const [colName, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        updates.push(`${colName} = $${paramIndex++}`);
        values.push(val === '' ? null : val);
      }
    }

    values.push(userId);

    const returning = nameFieldType === 'full' 
      ? 'id, email, full_name, role, phone, status, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url'
      : 'id, email, first_name, last_name, role, phone, status, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url';

    const result = await db.query(
      `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING ${returning}`,
      values,
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundException('User update failed');

    console.log(`[UsersService] Updated ${tableName} (${userId}): ${profileImageUrl ? 'image' : 'profile data'}`);

    // Return normalized object
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: nameFieldType === 'full' ? user.full_name?.split(' ')[0] : user.first_name,
      lastName: nameFieldType === 'full' ? user.full_name?.split(' ').slice(1).join(' ') : user.last_name,
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
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
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
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole) && requestingUserId !== targetUserId) {
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
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
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
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole) && requestingUserId !== userId) {
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
