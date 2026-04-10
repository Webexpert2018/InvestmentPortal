import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  async signup(
    email: string, password: string, firstName: string, lastName: string,
    phone?: string, dob?: string, role?: string,
    addressLine1?: string, addressLine2?: string, city?: string, state?: string,
    zipCode?: string, country?: string, taxId?: string
  ) {
    // 1. Check if user already exists in ANY table (users, investors, staff)
    const [existingUser, existingInvestor, existingStaff] = await Promise.all([
      db.query('SELECT id FROM users WHERE email = $1', [email]),
      db.query('SELECT id FROM investors WHERE email = $1', [email]),
      db.query('SELECT id FROM staff WHERE email = $1', [email])
    ]);

    if (existingUser.rows.length > 0 || existingInvestor.rows.length > 0 || existingStaff.rows.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const targetRole = role || 'investor';
    let newUser;

    if (targetRole === 'admin' || targetRole === 'accountant') {
      // 2a. Insert into USERS table for staff/admin roles
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, role, first_name, last_name, phone, status`,
        [email, passwordHash, targetRole, firstName, lastName, phone || null, 'active']
      );
      newUser = userResult.rows[0];
      // Normalize names for unified response
      newUser.firstName = newUser.first_name;
      newUser.lastName = newUser.last_name;
    } else {
      // 2b. Insert into INVESTORS table for default/investor role
      const userResult = await db.query(
        `INSERT INTO investors (full_name, email, password_hash, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, email, role, full_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, status`,
        [firstName + ' ' + (lastName || ''), email, passwordHash, phone, dob, addressLine1, addressLine2, city, state, zipCode, country, taxId]
      );
      newUser = userResult.rows[0];
      // Normalize names for unified response
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

      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Role-based access control check
      if (role && user.role !== role) {
        throw new UnauthorizedException(`Access denied. You do not have the ${role} role.`);
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

  async forgotPassword(email: string, role?: string) {
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

    await this.emailService.sendPasswordResetOtp(email, otp);

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
}
