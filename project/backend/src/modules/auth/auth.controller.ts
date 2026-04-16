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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitationToken?: string;
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

export class ForgotPasswordDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiPropertyOptional({ example: 'investor' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  otp: string | undefined;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  otp: string | undefined;

  @ApiProperty({ example: 'NewStrongPassword123!' })
  @IsString()
  @MinLength(6)
  password: string | undefined;
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
    // if (signupDto.dob) {
    //   const birthDate = new Date(signupDto.dob);
    //   const today = new Date();
    //   let age = today.getFullYear() - birthDate.getFullYear();
    //   const m = today.getMonth() - birthDate.getMonth();
    //   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    //     age--;
    //   }

    //   if (age < 18) {
    //     throw new BadRequestException('You must be at least 18 years old');
    //   } else if (age > 70) {
    //     throw new BadRequestException('Age cannot exceed 70 years');
    //   }
    // }

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
      signupDto.invitationToken
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
    // if (signupDto.dob) {
    //   const birthDate = new Date(signupDto.dob);
    //   const today = new Date();
    //   let age = today.getFullYear() - birthDate.getFullYear();
    //   const m = today.getMonth() - birthDate.getMonth();
    //   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    //     age--;
    //   }

    //   if (age < 18) {
    //     throw new BadRequestException('You must be at least 18 years old');
    //   } else if (age > 70) {
    //     throw new BadRequestException('Age cannot exceed 70 years');
    //   }
    // }

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
      signupDto.invitationToken
    );
  }

  @Post('verify-invitation')
  @HttpCode(HttpStatus.OK)
  async verifyInvitation(@Body() body: { token: string }) {
    if (!body.token) {
      throw new BadRequestException('Invitation token is required');
    }
    return this.authService.verifyInvitationToken(body.token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Missing required login fields');
    }
    return this.authService.login(loginDto.email, loginDto.password, loginDto.role);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    if (!forgotPasswordDto.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.forgotPassword(forgotPasswordDto.email, forgotPasswordDto.role);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    if (!verifyOtpDto.email || !verifyOtpDto.otp) {
      throw new BadRequestException('Email and OTP are required');
    }
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.email || !resetPasswordDto.otp || !resetPasswordDto.password) {
      throw new BadRequestException('Email, OTP, and password are required');
    }
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.password,
    );
  }
}
