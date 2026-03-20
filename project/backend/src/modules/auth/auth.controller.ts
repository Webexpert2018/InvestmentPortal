import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: '1995-08-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ example: '+15553332211' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  password: string | undefined;

  @ApiPropertyOptional({ example: 'investor' })
  @IsOptional()
  @IsString()
  role?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    if (
      !signupDto.email ||
      !signupDto.password ||
      !signupDto.firstName ||
      !signupDto.lastName
    ) {
      throw new BadRequestException('Missing required signup fields');
    }
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.firstName,
      signupDto.lastName,
      signupDto.phone,
      signupDto.dob,
      signupDto.role || 'investor',
      signupDto.addressLine1,
      signupDto.addressLine2,
      signupDto.city,
      signupDto.state,
      signupDto.zipCode,
      signupDto.country,
      signupDto.taxId,
    );
  }

  @Post('investor-signup')
  @HttpCode(HttpStatus.CREATED)
  async investorSignup(@Body() signupDto: SignupDto) {
    if (
      !signupDto.email ||
      !signupDto.password ||
      !signupDto.firstName ||
      !signupDto.lastName
    ) {
      throw new BadRequestException('Missing required signup fields');
    }
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.firstName,
      signupDto.lastName,
      signupDto.phone,
      signupDto.dob,
      signupDto.role || 'investor', 
      signupDto.addressLine1,
      signupDto.addressLine2,
      signupDto.city,
      signupDto.state,
      signupDto.zipCode,
      signupDto.country,
      signupDto.taxId,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Missing required login fields');
    }
    return this.authService.login(loginDto.email, loginDto.password, loginDto.role);
  }
}
