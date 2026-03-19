import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateIraAccountDto {
  @IsString()
  @IsNotEmpty()
  accountType: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  custodian: string;

  @IsString()
  @IsNotEmpty()
  beneficiary: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsBoolean()
  @IsOptional()
  mailingAddressSame?: boolean;

  @IsString()
  @IsOptional()
  mailingAddress1?: string;

  @IsString()
  @IsOptional()
  mailingAddress2?: string;

  @IsString()
  @IsOptional()
  mailingCity?: string;

  @IsString()
  @IsOptional()
  mailingState?: string;

  @IsString()
  @IsOptional()
  mailingZipCode?: string;

  @IsString()
  @IsOptional()
  mailingCountry?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  referralSource?: string;

  // Added user profile fields
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  physicalAddress1?: string;

  @IsString()
  @IsOptional()
  physicalAddress2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}
