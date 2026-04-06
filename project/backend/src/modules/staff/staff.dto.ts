import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(['relations_associate', 'accountant', 'partnership'])
  role: string;

  @IsUUID()
  @IsOptional()
  associated_fund_id?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['relations_associate', 'accountant', 'partnership'])
  @IsOptional()
  role?: string;

  @IsUUID()
  @IsOptional()
  associated_fund_id?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
