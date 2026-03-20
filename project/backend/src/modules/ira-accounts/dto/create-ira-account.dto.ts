// import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

// export class CreateIraAccountDto {
//   @IsString()
//   @IsNotEmpty()
//   accountType: string;

//   @IsString()
//   @IsNotEmpty()
//   accountNumber: string;

//   @IsString()
//   @IsNotEmpty()
//   custodian: string;

//   @IsString()
//   @IsNotEmpty()
//   beneficiary: string;

//   @IsString()
//   @IsOptional()
//   middleName?: string;

//   @IsString()
//   @IsOptional()
//   suffix?: string;

//   @IsString()
//   @IsOptional()
//   maritalStatus?: string;

//   @IsBoolean()
//   @IsOptional()
//   mailingAddressSame?: boolean;

//   @IsString()
//   @IsOptional()
//   mailingAddress1?: string;

//   @IsString()
//   @IsOptional()
//   mailingAddress2?: string;

//   @IsString()
//   @IsOptional()
//   mailingCity?: string;

//   @IsString()
//   @IsOptional()
//   mailingState?: string;

//   @IsString()
//   @IsOptional()
//   mailingZipCode?: string;

//   @IsString()
//   @IsOptional()
//   mailingCountry?: string;

//   @IsString()
//   @IsOptional()
//   username?: string;

//   @IsString()
//   @IsOptional()
//   referralSource?: string;

//   // Added user profile fields
//   @IsString()
//   @IsOptional()
//   firstName?: string;

//   @IsString()
//   @IsOptional()
//   lastName?: string;

//   @IsString()
//   @IsOptional()
//   email?: string;

//   @IsString()
//   @IsOptional()
//   dob?: string;

//   @IsString()
//   @IsOptional()
//   phone?: string;

//   @IsString()
//   @IsOptional()
//   taxId?: string;

//   @IsString()
//   @IsOptional()
//   physicalAddress1?: string;

//   @IsString()
//   @IsOptional()
//   physicalAddress2?: string;

//   @IsString()
//   @IsOptional()
//   city?: string;

//   @IsString()
//   @IsOptional()
//   state?: string;

//   @IsString()
//   @IsOptional()
//   zipCode?: string;

//   @IsString()
//   @IsOptional()
//   country?: string;
// }


export class CreateAccountDto {
  type: string;
  payment_source?: string;
  driver_license_state?: string;
  driver_license_number?: string;
  rollover_from_account_type?: string;
  original_account_holder_first_name?: string;
  original_account_holder_last_name?: string;
  original_account_holder_date_of_birth?: string;
  original_account_holder_date_of_death?: string;
  original_account_holder_ssn?: string;
  original_account_holder_relationship?: string;
  has_made_payment_election?: boolean;
  previous_payment_election?: string;
  individual_date_of_birth?: string;
  conversion?: boolean;
}