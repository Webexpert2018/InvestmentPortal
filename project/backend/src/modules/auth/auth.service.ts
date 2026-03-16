import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../../config/database';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

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
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, dob, role, status, address_line1, address_line2, city, state, zip_code, country, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, email, role, first_name, last_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id`,
      [email, passwordHash, firstName, lastName, phone, dob, role || 'investor', 'active', addressLine1, addressLine2, city, state, zipCode, country, taxId]
    );

    const newUser = userResult.rows[0];

    await db.query(
      `INSERT INTO portfolios (user_id, bitcoin_balance, nav, performance, total_invested, total_withdrawn)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newUser.id, 0, 0, 0, 0, 0]
    );

    const token = this.jwtService.sign({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        dob: newUser.dob,
        status: newUser.status,
        addressLine1: newUser.address_line1,
        addressLine2: newUser.address_line2,
        city: newUser.city,
        state: newUser.state,
        zipCode: newUser.zip_code,
        country: newUser.country,
        taxId: newUser.tax_id,
      },
      token,
    };
  }

  async login(email: string, password: string, role?: string) {
    try {
      const result = await db.query(
        'SELECT id, email, password_hash, role, first_name, last_name, status, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id FROM users WHERE email = $1',
        [email]
      );
      
      const user = result.rows[0];

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
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}
