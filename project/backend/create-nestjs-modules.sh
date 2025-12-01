#!/bin/bash

# Auth Module
cat > /tmp/cc-agent/60356381/project/backend/src/modules/auth/auth.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
EOF

cat > /tmp/cc-agent/60356381/project/backend/src/modules/auth/auth.service.ts << 'EOF'
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { supabase } from '../../config/supabase';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signup(email: string, password: string, firstName: string, lastName: string, phone?: string) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'investor',
        status: 'active',
      })
      .select('id, email, role, first_name, last_name')
      .single();

    if (error) {
      throw new Error(\`Failed to create user: \${error.message}\`);
    }

    await supabase.from('portfolios').insert({
      user_id: newUser.id,
      bitcoin_balance: 0,
      nav: 0,
      performance: 0,
      total_invested: 0,
      total_withdrawn: 0,
    });

    const token = this.jwtService.sign({ userId: newUser.id, email: newUser.email, role: newUser.role });

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, first_name, last_name, status')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ userId: user.id, email: user.email, role: user.role });

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
  }
}
EOF

cat > /tmp/cc-agent/60356381/project/backend/src/modules/auth/auth.controller.ts << 'EOF'
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

class SignupDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

class LoginDto {
  email: string;
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.firstName,
      signupDto.lastName,
      signupDto.phone,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
EOF

echo "Auth module created successfully"
