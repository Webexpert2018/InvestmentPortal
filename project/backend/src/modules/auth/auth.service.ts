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
    const existingUserResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await db.query(
      `INSERT INTO investors (full_name, email, password_hash, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, email, role, full_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id`,
      [firstName + ' ' + (lastName || ''), email, passwordHash, phone, dob, addressLine1, addressLine2, city, state, zipCode, country, taxId]
    );

    const newUser = userResult.rows[0];

    // await db.query(
    //   `INSERT INTO portfolios (user_id, bitcoin_balance, nav, performance, total_invested, total_withdrawn)
    //    VALUES ($1, $2, $3, $4, $5, $6)`,
    //   [newUser.id, 0, 0, 0, 0, 0]
    // );

    const token = this.jwtService.sign({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // Send welcome email asynchronously
    const firstNameForEmail = newUser.full_name?.split(' ')[0] || 'User';
    this.emailService.sendWelcomeEmail(newUser.email, firstNameForEmail, newUser.role || 'investor', password)
      .catch(err => console.error(`Failed to send welcome email to ${newUser.email}:`, err));

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role || 'investor',
        firstName: newUser.full_name?.split(' ')[0] || '',
        lastName: newUser.full_name?.split(' ')[1] || '',
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

  async forgotPassword(email: string, role?: string) {
    const userResult = await db.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new BadRequestException('Email not registered');
    }

    const user = userResult.rows[0];
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

    // Also update the users table for backward compatibility (optional but keeping for now)
    await db.query(
      'UPDATE users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE id = $3',
      [otp, expiresAt, userId]
    );

    await this.emailService.sendPasswordResetOtp(email, otp);

    return { message: 'Reset code sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid email or reset code');
    }

    const userId = userResult.rows[0].id;

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
    const userResult = await db.query(
      'SELECT id, first_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid email or reset code');
    }

    const userId = userResult.rows[0].id;

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

    // Start a transaction would be better, but using simple queries for now
    await db.query(
      'UPDATE users SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE id = $2',
      [passwordHash, userId]
    );

    // Mark OTP as used
    await db.query(
      'UPDATE user_otps SET is_used = true WHERE id = $1',
      [otpId]
    );

    // Send password changed notification
    this.emailService.sendPasswordChangedEmail(email, userResult.rows[0].first_name || 'User', password)
      .catch(err => console.error(`Failed to send password changed email to ${email}:`, err));

    return { message: 'Password reset successfully' };
  }
}
