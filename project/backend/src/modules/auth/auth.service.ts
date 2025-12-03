import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../../config/database';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signup(email: string, password: string, firstName: string, lastName: string, phone?: string) {
    const existingUserResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, first_name, last_name`,
      [email, passwordHash, firstName, lastName, phone, 'investor', 'active']
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
      },
      token,
    };
  }

  async login(email: string, password: string) {
    try {
      const result = await db.query(
        'SELECT id, email, password_hash, role, first_name, last_name, status FROM users WHERE email = $1',
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
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}
