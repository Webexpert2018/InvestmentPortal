import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

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
}
