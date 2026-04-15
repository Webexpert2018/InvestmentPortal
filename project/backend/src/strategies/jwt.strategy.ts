import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { db } from '../config/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // 1. Try finding in users table first (Admin/Staff)
    let result = await db.query(
      'SELECT id, email, role, first_name, last_name, status FROM users WHERE id = $1',
      [payload.userId]
    );

    let user = result.rows[0];
    
    // 2. If not found in users, try staff table
    if (!user) {
      result = await db.query(
        'SELECT id, email, role, full_name, status FROM staff WHERE id = $1',
        [payload.userId]
      );
      user = result.rows[0];
      
      if (user && user.full_name) {
        const [firstName, ...lastNameParts] = user.full_name.split(' ');
        user.first_name = firstName;
        user.last_name = lastNameParts.join(' ');
      }
    }

    // 3. If not found in users or staff, try investors table
    if (!user) {
      result = await db.query(
        'SELECT id, email, role, full_name, status FROM investors WHERE id = $1',
        [payload.userId]
      );
      user = result.rows[0];
      
      // Map full_name to firstName/lastName for consistency
      if (user && user.full_name) {
        const [firstName, ...lastNameParts] = user.full_name.split(' ');
        user.first_name = firstName;
        user.last_name = lastNameParts.join(' ');
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }
}
