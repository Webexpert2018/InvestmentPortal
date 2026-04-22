import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) { }

  async signup(
    email: string, password: string, firstName: string, lastName: string,
    phone?: string, dob?: string, role?: string,
    addressLine1?: string, addressLine2?: string, city?: string, state?: string,
    zipCode?: string, country?: string, taxId?: string,
    invitationToken?: string
  ) {
    // 1. Check if user already exists in ANY table (users, investors, staff)
    const [existingUser, existingInvestor, existingStaff] = await Promise.all([
      db.query('SELECT id FROM users WHERE email = $1', [email]),
      db.query('SELECT id FROM investors WHERE email = $1', [email]),
      db.query('SELECT id FROM staff WHERE email = $1', [email])
    ]);

    // If it's an invitation, we allow the existing pending investor
    const isInvitation = !!invitationToken;
    let invitationData: any = null;

    if (isInvitation) {
      const inviteResult = await db.query(
        `SELECT u.user_id, i.email 
         FROM user_otps u 
         JOIN investors i ON u.user_id = i.id
         WHERE u.otp = $1 AND u.type = 'INVITATION' AND u.expires_at > NOW() AND u.is_used = false`,
        [invitationToken]
      );

      if (inviteResult.rows.length === 0) {
        throw new BadRequestException('Invalid or expired invitation token');
      }
      invitationData = inviteResult.rows[0];

      if (invitationData.email !== email) {
        throw new BadRequestException('Invitation token does not match this email');
      }
    } else {
      if (existingUser.rows.length > 0 || existingInvestor.rows.length > 0 || existingStaff.rows.length > 0) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let targetRole = role || 'investor';

    // Auto-map 'admin' to 'executive_admin' for new registrations
    if (targetRole === 'admin') {
      targetRole = 'executive_admin';
    }

    // Get first pipeline stage ID if it's an investor
    let firstStageId: number | null = null;
    if (targetRole === 'investor' || !targetRole) {
      const stageResult = await db.query('SELECT id FROM pipeline_stages ORDER BY order_index ASC LIMIT 1');
      firstStageId = stageResult.rows[0]?.id || null;
    }

    let newUser;

    if (targetRole === 'executive_admin') {
      // 2a. Insert into USERS table for Executive Admin
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, role, first_name, last_name, phone, status`,
        [email, passwordHash, targetRole, firstName, lastName, phone || null, 'active']
      );
      newUser = userResult.rows[0];
      newUser.firstName = newUser.first_name;
      newUser.lastName = newUser.last_name;
    } else if (['fund_admin', 'investor_relations', 'accountant', 'relations_associate', 'partnership'].includes(targetRole)) {
      // 2b. Insert into STAFF table for other administrative roles
      const userResult = await db.query(
        `INSERT INTO staff (full_name, email, password_hash, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, role, full_name, phone, status`,
        [firstName + ' ' + (lastName || ''), email, passwordHash, phone || null, targetRole, 'active']
      );
      newUser = userResult.rows[0];
      const nameParts = newUser.full_name?.split(' ') || [];
      newUser.firstName = nameParts[0] || '';
      newUser.lastName = nameParts.slice(1).join(' ') || '';
    } else {
      // 2c. Insert or Update into INVESTORS table for default/investor role
      if (isInvitation) {
        const userResult = await db.query(
          `UPDATE investors 
           SET full_name = $1, password_hash = $2, phone = $3, dob = $4, address_line1 = $5, address_line2 = $6, city = $7, state = $8, zip_code = $9, country = $10, tax_id = $11, status = 'active', kyc_status = 'unverified', pipeline_stage_id = COALESCE(pipeline_stage_id, $12), updated_at = NOW()
           WHERE id = $13
           RETURNING id, email, role, full_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, status, kyc_status`,
          [firstName + ' ' + (lastName || ''), passwordHash, phone, dob, addressLine1, addressLine2, city, state, zipCode, country, taxId, firstStageId, invitationData.user_id]
        );
        newUser = userResult.rows[0];

        // Mark token as used
        await db.query('UPDATE user_otps SET is_used = true WHERE otp = $1', [invitationToken]);
      } else {
        const userResult = await db.query(
          `INSERT INTO investors (id, full_name, email, password_hash, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, status, pipeline_stage_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id, email, role, full_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, status`,
          [crypto.randomUUID(), firstName + ' ' + (lastName || ''), email, passwordHash, phone, dob, addressLine1, addressLine2, city, state, zipCode, country, taxId, 'active', firstStageId]
        );
        newUser = userResult.rows[0];
      }

      const nameParts = newUser.full_name?.split(' ') || [];
      newUser.firstName = nameParts[0] || '';
      newUser.lastName = nameParts.slice(1).join(' ') || '';
    }

    const token = this.jwtService.sign({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role || targetRole
    });

    // Send welcome email asynchronously
    this.emailService.sendWelcomeEmail(newUser.email, newUser.firstName || 'User', newUser.role || targetRole, password)
      .catch(err => console.error(`Failed to send welcome email to ${newUser.email}:`, err));

    // Trigger notification for all admin roles
    if (targetRole === 'investor') {
      this.notificationsService.createNotification({
        // targetRoles: ['executive_admin', 'fund_admin', 'investor_relations', 'admin'],
        targetRole: 'executive_admin',
        title: 'New Investor Joined',
        description: `A new investor, ${newUser.firstName} ${newUser.lastName}, has created an account and started the onboarding process. Review their profile.`,
        type: 'new_investor',
        link: `/dashboard/investor/${newUser.id}`
      });
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role || targetRole,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        status: newUser.status || 'active',
        dob: newUser.dob,
        addressLine1: newUser.address_line1,
        addressLine2: newUser.address_line2,
        city: newUser.city,
        state: newUser.state,
        zipCode: newUser.zip_code,
        country: newUser.country,
        taxId: newUser.tax_id,
        profileImageUrl: null,
        kycStatus: newUser.kyc_status || 'unverified',
      },
      token,
    };
  }

  async login(email: string, password: string, role?: string) {
    try {
      // 1. Try finding in users table first (Admin)
      let result = await db.query(
        'SELECT id, email, password_hash, role, first_name, last_name, status, phone FROM users WHERE email = $1',
        [email]
      );

      let user = result.rows[0];

      // 2. If not found in users, try investors table
      if (!user) {
        result = await db.query(
          'SELECT id, email, password_hash, role, full_name, status, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url, kyc_status FROM investors WHERE email = $1',
          [email]
        );
        user = result.rows[0];

        // Map full_name to first_name/last_name for consistency in response
        if (user) {
          user.first_name = user.full_name?.split(' ')[0] || '';
          user.last_name = user.full_name?.split(' ')[1] || '';
        }
      }

      // 3. If still not found, try staff table
      if (!user) {
        result = await db.query(
          'SELECT id, email, password_hash, role, full_name, status, phone, profile_image_url FROM staff WHERE email = $1',
          [email]
        );
        user = result.rows[0];

        if (user) {
          user.first_name = user.full_name?.split(' ')[0] || '';
          user.last_name = user.full_name?.split(' ')[1] || '';
        }
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedException('This account has been suspended. Please contact support.');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active or pending approval');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Role-based access control check
      if (role) {
        const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations', 'relations_associate'];

        // 1. Admin flows ('admin') are compatible with all administrative roles
        const isAdminFlow = role === 'admin';
        const isCompatibleAdmin = isAdminFlow && adminRoles.includes(user.role);

        // 2. Exact match check for other flows (accountant, investor, etc.)
        if (!isCompatibleAdmin && user.role !== role) {
          throw new UnauthorizedException(`Access denied. You do not have the ${role} role.`);
        }
      }

      const token = this.jwtService.sign({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          dob: user.dob,
          status: user.status,
          addressLine1: user.address_line1,
          addressLine2: user.address_line2,
          city: user.city,
          state: user.state,
          zipCode: user.zip_code,
          country: user.country,
          taxId: user.tax_id,
          profileImageUrl: user.profile_image_url,
          kycStatus: user.kyc_status || 'unverified',
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  private async findUserAcrossTables(email: string) {
    // 1. Try users table
    let result = await db.query(
      'SELECT id, email, role, first_name as first_name, last_name as last_name FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      return { user: result.rows[0], tableName: 'users', nameField: 'first_name' };
    }

    // 2. Try investors table
    result = await db.query(
      'SELECT id, email, role, full_name FROM investors WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        user: {
          ...user,
          first_name: user.full_name?.split(' ')[0] || 'User'
        },
        tableName: 'investors',
        nameField: 'full_name'
      };
    }

    // 3. Try staff table
    result = await db.query(
      'SELECT id, email, role, full_name FROM staff WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        user: {
          ...user,
          first_name: user.full_name?.split(' ')[0] || 'User'
        },
        tableName: 'staff',
        nameField: 'full_name'
      };
    }

    return null;
  }

  async forgotPassword(email: string, role?: string, isAdminTriggered: boolean = false) {
    const searchResult = await this.findUserAcrossTables(email);

    if (!searchResult) {
      throw new BadRequestException('Email not registered');
    }

    const { user, tableName } = searchResult;

    if (role && user.role !== role) {
      throw new BadRequestException('Email not registered for this role');
    }

    const userId = user.id;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store in the new user_otps table
    await db.query(
      'INSERT INTO user_otps (user_id, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, otp, 'FORGOT_PASSWORD', expiresAt]
    );

    // Also update the users table for backward compatibility IF the user is in the users table
    if (tableName === 'users') {
      await db.query(
        'UPDATE users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE id = $3',
        [otp, expiresAt, userId]
      );
    }

    await this.emailService.sendPasswordResetOtp(email, otp, !isAdminTriggered);

    return { message: 'Reset code sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const searchResult = await this.findUserAcrossTables(email);

    if (!searchResult) {
      throw new UnauthorizedException('Invalid email or reset code');
    }

    const userId = searchResult.user.id;

    const otpResult = await db.query(
      'SELECT id FROM user_otps WHERE user_id = $1 AND otp = $2 AND type = $3 AND expires_at > NOW() AND is_used = false',
      [userId, otp, 'FORGOT_PASSWORD']
    );

    if (otpResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    return { message: 'Code verified successfully' };
  }

  async resetPassword(email: string, otp: string, password: string) {
    const searchResult = await this.findUserAcrossTables(email);

    if (!searchResult) {
      throw new UnauthorizedException('Invalid email or reset code');
    }

    const { user, tableName } = searchResult;
    const userId = user.id;

    // Check OTP in user_otps
    const otpResult = await db.query(
      'SELECT id FROM user_otps WHERE user_id = $1 AND otp = $2 AND type = $3 AND expires_at > NOW() AND is_used = false',
      [userId, otp, 'FORGOT_PASSWORD']
    );

    if (otpResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    const otpId = otpResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password in the correct table
    if (tableName === 'users') {
      await db.query(
        'UPDATE users SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE id = $2',
        [passwordHash, userId]
      );
    } else {
      await db.query(
        `UPDATE ${tableName} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [passwordHash, userId]
      );
    }

    // Mark OTP as used
    await db.query(
      'UPDATE user_otps SET is_used = true WHERE id = $1',
      [otpId]
    );

    // Send password changed notification
    this.emailService.sendPasswordChangedEmail(email, user.first_name || 'User', password)
      .catch(err => console.error(`Failed to send password changed email to ${email}:`, err));

    return { message: 'Password reset successfully' };
  }

  async verifyInvitationToken(token: string) {
    const result = await db.query(
      `SELECT i.id, i.email, i.full_name, i.phone, i.status, i.dob, i.address_line1, i.address_line2, i.city, i.state, i.zip_code, i.country, i.tax_id 
       FROM investors i
       JOIN user_otps o ON i.id = o.user_id
       WHERE o.otp = $1 AND o.type = 'INVITATION' AND o.expires_at > NOW() AND o.is_used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    const {
      id, email, full_name, phone, dob,
      address_line1, address_line2, city,
      state, zip_code, country, tax_id
    } = result.rows[0];

    const [firstName, ...lastNameParts] = (full_name || '').split(' ');

    return {
      id,
      email,
      firstName,
      lastName: lastNameParts.join(' '),
      phone,
      dob,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
      tax_id
    };
  }
}
