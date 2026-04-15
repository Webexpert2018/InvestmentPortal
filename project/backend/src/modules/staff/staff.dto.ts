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

  @IsEnum(['executive_admin', 'admin', 'fund_admin', 'investor_relations', 'accountant', 'relations_associate', 'partnership'])
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

  @IsEnum(['executive_admin', 'admin', 'fund_admin', 'investor_relations', 'accountant', 'relations_associate', 'partnership'])
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
