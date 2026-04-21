import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { db } from '../../config/database';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private emailService: EmailService) { }
  async getProfile(userId: string) {
    // First, check the users table (Admin/Staff)
    let result = await db.query(`
      SELECT 
        id, email, role, first_name as "firstName", last_name as "lastName", phone, status, created_at as "createdAt", 
        profile_image_url as "profileImageUrl", dob, address_line1 as "addressLine1", address_line2 as "addressLine2", 
        city, state, zip_code as "zipCode", country, tax_id as "taxId", kyc_status as "kycStatus"
      FROM users
      WHERE id = $1`,
      [userId]
    );

    let user = result.rows[0];
    
    // If not found in users, check the staff table
    if (!user) {
      result = await db.query(`
        SELECT 
          id, email, role, full_name, phone, status, created_at as "createdAt", 
          profile_image_url as "profileImageUrl", dob, address_line1 as "addressLine1", 
          address_line2 as "addressLine2", city, state, zip_code as "zipCode", country, 
          tax_id as "taxId", 'approved' as "kycStatus"
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
          id, email, 'investor' as role, full_name, phone, status, created_at as "createdAt",
          dob, address_line1 as "addressLine1", address_line2 as "addressLine2", 
          city, state, zip_code as "zipCode", country, tax_id as "taxId", 
          profile_image_url as "profileImageUrl", kyc_status as "kycStatus" 
        FROM investors
        WHERE id = $1`,
        [userId]
      );
      user = result.rows[0];
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Standardize Name Fields for Staff and Investors (who use full_name)
    if (user.full_name && (!user.firstName || !user.lastName)) {
      const nameParts = user.full_name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      status: user.status || 'active',
      createdAt: user.createdAt,
      dob: user.dob,
      addressLine1: user.addressLine1 || '',
      addressLine2: user.addressLine2 || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      taxId: user.taxId || '',
      profileImageUrl: user.profileImageUrl || '',
      kycStatus: user.kycStatus || 'pending'
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
        (SELECT COALESCE(SUM(investment_amount), 0) FROM investments WHERE user_id = investors.id) as total_invested,
        (SELECT COALESCE(SUM(estimated_units), 0) FROM investments WHERE user_id = investors.id) as total_units
      FROM investors
      ORDER BY 
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        created_at DESC
    `);

    return result.rows.map((user) => ({
      ...user,
      firstName: user.firstName,
      lastName: user.lastName,
      invested: `$${parseFloat(user.total_invested).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      units: parseFloat(user.total_units).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      avatar: (user.firstName && user.firstName.length > 0) ? user.firstName[0].toUpperCase() : '?',
    }));
  }

  async getUserById(targetUserId: string, requestingUserId: string, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole) && requestingUserId !== targetUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    // First, check the users table (Admin/Staff)
    let result = await db.query(`
      SELECT 
        id, email, role, first_name as "firstName", last_name as "lastName", phone, status, created_at as "createdAt", 
        profile_image_url as "profileImageUrl", dob, address_line1 as "addressLine1", address_line2 as "addressLine2", 
        city, state, zip_code as "zipCode", country, tax_id as "taxId", kyc_status as "kycStatus"
      FROM users
      WHERE id = $1`,
      [targetUserId]
    );

    let user = result.rows[0];

    // If not found in users, check the staff table
    if (!user) {
      result = await db.query(`
        SELECT 
          id, email, role, full_name, phone, status, created_at as "createdAt", 
          profile_image_url as "profileImageUrl", dob, address_line1 as "addressLine1", 
          address_line2 as "addressLine2", city, state, zip_code as "zipCode", country, 
          tax_id as "taxId", 'approved' as "kycStatus"
        FROM staff
        WHERE id = $1`,
        [targetUserId]
      );
      user = result.rows[0];
    }

    // If still not found, check the investors table
    if (!user) {
      result = await db.query(`
        SELECT 
          i.id, i.email, 'investor' as role, i.full_name, i.phone, i.status, i.created_at as "createdAt",
          i.dob, i.address_line1 as "addressLine1", i.address_line2 as "addressLine2", 
          i.city, i.state, i.zip_code as "zipCode", i.country, 
          i.tax_id as "taxId", i.profile_image_url as "profileImageUrl", i.kyc_status as "kycStatus", i.assigned_ir_id,
          s.full_name as assigned_ir_name, s.email as assigned_ir_email
        FROM investors i
        LEFT JOIN staff s ON i.assigned_ir_id = s.id
        WHERE i.id = $1`,
        [targetUserId]
      );
      user = result.rows[0];
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Standardize Name Fields for Staff and Investors (who use full_name)
    if (user.full_name && (!user.firstName || !user.lastName)) {
      const nameParts = user.full_name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      status: user.status || 'active',
      createdAt: user.createdAt,
      dob: user.dob,
      addressLine1: user.addressLine1 || '',
      addressLine2: user.addressLine2 || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      taxId: user.taxId || '',
      profileImageUrl: user.profileImageUrl || '',
      kycStatus: user.kycStatus || 'pending',
      assignedIrId: user.assigned_ir_id,
      assignedIrName: user.assigned_ir_name,
      assignedIrEmail: user.assigned_ir_email
    };
  }

  async updateUserStatus(userId: string, status: string, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can update user status');
    }

    // Determine which table handles this user
    let tableName: string | null = null;
    
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length > 0) {
      tableName = 'users';
    } else {
      const investorCheck = await db.query('SELECT id FROM investors WHERE id = $1', [userId]);
      if (investorCheck.rows.length > 0) {
        tableName = 'investors';
      } else {
        const staffCheck = await db.query('SELECT id FROM staff WHERE id = $1', [userId]);
        if (staffCheck.rows.length > 0) {
          tableName = 'staff';
        }
      }
    }

    if (!tableName) {
      throw new NotFoundException('User not found');
    }

    const result = await db.query(
      `UPDATE ${tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, status`,
      [status, userId]
    );

    return result.rows[0];
  }

  async updateKycStatus(userId: string, kycStatus: string, requestingUserRole: string, requestingUserId?: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole) && requestingUserId !== userId) {
      throw new ForbiddenException('You do not have permission to update this KYC status');
    }

    // Determine which table handles this user
    let tableName: string | null = null;
    
    // Check investors table (primary for KYC)
    const investorCheck = await db.query('SELECT id FROM investors WHERE id = $1', [userId]);
    if (investorCheck.rows.length > 0) {
      tableName = 'investors';
    } else {
      // Check users table (some admins/staff might have KYC status)
      const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length > 0) {
        tableName = 'users';
      }
    }

    if (!tableName) {
      throw new NotFoundException('User not found or role does not support KYC');
    }

    const result = await db.query(
      `UPDATE ${tableName} SET kyc_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, kyc_status`,
      [kycStatus.toLowerCase(), userId]
    );

    const updatedUser = result.rows[0];
    return { id: updatedUser.id, kycStatus: updatedUser.kyc_status };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Determine which table handles this user
    let tableName: string | null = null;
    let nameField: string = 'first_name';
    let queryResult = await db.query('SELECT email, first_name, password_hash FROM users WHERE id = $1', [userId]);
    
    if (queryResult.rows.length > 0) {
      tableName = 'users';
    } else {
      queryResult = await db.query('SELECT email, full_name, password_hash FROM investors WHERE id = $1', [userId]);
      if (queryResult.rows.length > 0) {
        tableName = 'investors';
        nameField = 'full_name';
      } else {
        queryResult = await db.query('SELECT email, full_name, password_hash FROM staff WHERE id = $1', [userId]);
        if (queryResult.rows.length > 0) {
          tableName = 'staff';
          nameField = 'full_name';
        }
      }
    }

    if (!tableName || queryResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = queryResult.rows[0];

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE ${tableName} SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newPasswordHash, userId]);

    // Send password changed notification
    const displayName = nameField === 'full_name' ? (user.full_name?.split(' ')[0] || 'User') : (user.first_name || 'User');
    this.emailService.sendPasswordChangedEmail(user.email || '', displayName, newPassword)
      .catch(err => console.error(`Failed to send password changed email to ${user.email}:`, err));

    return { message: 'Password updated successfully' };
  }

  async adminResetPassword(userId: string, newPassword: string, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can reset user passwords');
    }

    // Determine which table handles this user
    let tableName: string | null = null;
    let nameField: string = 'first_name';
    let queryResult = await db.query('SELECT email, first_name FROM users WHERE id = $1', [userId]);

    if (queryResult.rows.length > 0) {
      tableName = 'users';
    } else {
      queryResult = await db.query('SELECT email, full_name FROM investors WHERE id = $1', [userId]);
      if (queryResult.rows.length > 0) {
        tableName = 'investors';
        nameField = 'full_name';
      } else {
        queryResult = await db.query('SELECT email, full_name FROM staff WHERE id = $1', [userId]);
        if (queryResult.rows.length > 0) {
          tableName = 'staff';
          nameField = 'full_name';
        }
      }
    }

    if (!tableName || queryResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = queryResult.rows[0];
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in the correct table
    if (tableName === 'users') {
      await db.query(
        'UPDATE users SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );
    } else {
      await db.query(
        `UPDATE ${tableName} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newPasswordHash, userId]
      );
    }

    // Send password changed notification with the new password
    const displayName = nameField === 'full_name' ? (user.full_name?.split(' ')[0] || 'User') : (user.first_name || 'User');
    await this.emailService.sendPasswordChangedEmail(user.email || '', displayName, newPassword);

    return { message: 'Password updated successfully' };
  }


  async inviteInvestor(data: any, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can invite investors');
    }

    const { 
      email, 
      full_name,
      phone,
      dob,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
      tax_id
    } = data;

    // Check if user already exists in ANY table
    const [existingUser, existingInvestor, existingStaff] = await Promise.all([
      db.query('SELECT id FROM users WHERE email = $1', [email]),
      db.query('SELECT id FROM investors WHERE email = $1', [email]),
      db.query('SELECT id FROM staff WHERE email = $1', [email])
    ]);

    if (existingUser.rows.length > 0 || existingInvestor.rows.length > 0 || existingStaff.rows.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const investorId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert as pending investor
    // We set a dummy password hash that won't match anything
    const dummyPasswordHash = 'INVITED_PENDING_' + crypto.randomBytes(16).toString('hex');

    await db.query(
      `INSERT INTO investors (
        id, email, full_name, password_hash, status, kyc_status, 
        phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        investorId, email, full_name, dummyPasswordHash, 'pending', 'unverified',
        phone || null, dob || null, address_line1 || null, address_line2 || null, 
        city || null, state || null, zip_code || null, country || null, tax_id || null
      ]
    );

    // Store invitation token in user_otps
    await db.query(
      'INSERT INTO user_otps (user_id, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
      [investorId, token, 'INVITATION', expiresAt]
    );

    // 5. Send invitation email (if requested, usually only for bulk or immediate invites)
    if (data.sendEmail) {
      await this.emailService.sendInvestorInvitationEmail(email, full_name, token);
    }

    return { message: 'Investor saved successfully', id: investorId };
  }

  async sendInvitation(userId: string, requestingUserRole: string) {
    console.log(`[sendInvitation] Invoked for userId: ${userId} by role: ${requestingUserRole}`);
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can send invitations');
    }

    // 1. Verify user exists and is a pending investor
    const result = await db.query(
      'SELECT id, email, full_name, status FROM investors WHERE id = $1',
      [userId]
    );
    console.log(`[sendInvitation] Verify query returned rows: ${result.rows.length}`);

    if (result.rows.length === 0) {
      throw new NotFoundException('Investor not found');
    }

    const investor = result.rows[0];
    if (investor.status !== 'pending') {
      throw new BadRequestException('Can only send invitations to pending investors');
    }

    // 2. Get the active INVITATION token
    const tokenResult = await db.query(
      "SELECT otp FROM user_otps WHERE user_id = $1 AND type = 'INVITATION' AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (tokenResult.rows.length === 0) {
      throw new BadRequestException('No active invitation token found for this investor');
    }

    const token = tokenResult.rows[0].otp;

    // 3. Send the email
    await this.emailService.sendInvestorInvitationEmail(investor.email, investor.full_name, token);

    return { message: 'Invitation email sent successfully' };
  }

  async validateInvitationToken(token: string) {
    const result = await db.query(
      `SELECT 
        i.id, i.email, i.full_name, i.phone, i.status, i.dob,
        i.address_line1, i.address_line2, i.city, i.state, i.zip_code, i.country, i.tax_id
       FROM investors i
       JOIN user_otps o ON i.id = o.user_id
       WHERE o.otp = $1 AND o.type = 'INVITATION' AND o.expires_at > NOW() AND o.is_used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    return result.rows[0];
  }

  async deleteUser(userId: string, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Identify which table the user is in
    const [userRes, investorRes, staffRes] = await Promise.all([
      db.query('SELECT id FROM users WHERE id = $1', [userId]),
      db.query('SELECT id FROM investors WHERE id = $1', [userId]),
      db.query('SELECT id FROM staff WHERE id = $1', [userId])
    ]);

    let tableName = '';
    if (userRes.rows.length > 0) tableName = 'users';
    else if (investorRes.rows.length > 0) tableName = 'investors';
    else if (staffRes.rows.length > 0) tableName = 'staff';

    if (!tableName) return { success: false, message: 'User not found' };

    // Delete OTPs and then user
    await db.query('DELETE FROM user_otps WHERE user_id = $1', [userId]);
    await db.query(`DELETE FROM ${tableName} WHERE id = $1`, [userId]);

    return { success: true };
  }

  async assignInvestorRelations(investorId: string, staffId: string | null, requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can assign investor relations');
    }

    // Verify investor exists
    const investorCheck = await db.query('SELECT id FROM investors WHERE id = $1', [investorId]);
    if (investorCheck.rows.length === 0) {
      throw new NotFoundException('Investor not found');
    }

    // If staffId provided, verify it's a valid investor_relations staff
    if (staffId) {
      const staffCheck = await db.query(
        "SELECT id, full_name FROM staff WHERE id = $1 AND role = 'investor_relations'",
        [staffId]
      );
      if (staffCheck.rows.length === 0) {
        throw new NotFoundException('Investor Relations staff member not found');
      }
    }

    const result = await db.query(
      'UPDATE investors SET assigned_ir_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, assigned_ir_id',
      [staffId, investorId]
    );

    return { id: result.rows[0].id, assignedIrId: result.rows[0].assigned_ir_id };
  }
}
