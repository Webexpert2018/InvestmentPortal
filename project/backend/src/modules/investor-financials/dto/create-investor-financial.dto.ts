import { IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateInvestorFinancialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsUUID()
  investor_id?: string;

  @IsOptional()
  @IsNumber()
  income?: number;

  @IsOptional()
  @IsNumber()
  expenses?: number;

  @IsOptional()
  @IsNumber()
  liability?: number;

  @IsOptional()
  @IsNumber()
  assets?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
