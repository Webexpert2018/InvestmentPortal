import { IsDateString, IsNumber, IsOptional, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNavEntryDto {
  @IsDateString()
  effective_date: string;

  @IsNumber()
  @Min(0)
  total_fund_value: number;

  @IsNumber()
  @Min(0)
  total_units: number;

  @IsNumber()
  @Min(0)
  nav_per_unit: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'draft'])
  status?: string;
}
