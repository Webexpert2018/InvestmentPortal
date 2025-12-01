import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(6)
  password: string | undefined;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string | undefined;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string | undefined;

  @ApiPropertyOptional({ example: '+15553332211' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  password: string | undefined;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    if (
      !signupDto.email ||
      !signupDto.password ||
      !signupDto.firstName ||
      !signupDto.lastName
    ) {
      throw new Error('Missing required signup fields');
    }
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
    debugger
    console.log("🔍 Login payload:", loginDto);
    if (!loginDto.email || !loginDto.password) {
      throw new Error('Missing required login fields');
    }
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
