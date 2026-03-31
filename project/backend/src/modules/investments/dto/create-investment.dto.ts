import { IsNotEmpty, IsNumber, IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'The fund ID to invest in' })
  @IsUUID()
  @IsNotEmpty()
  fundId: string;

  @ApiProperty({ description: 'The IRA account ID to invest from', required: false })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiProperty({ description: 'The investment source type', enum: ['personal', 'ira'] })
  @IsEnum(['personal', 'ira'])
  @IsNotEmpty()
  accountType: string;

  @ApiProperty({ description: 'The investment amount' })
  @IsNumber()
  @IsNotEmpty()
  investmentAmount: number;

  @ApiProperty({ description: 'The processing fee percentage', default: 0.5 })
  @IsNumber()
  @IsOptional()
  processingFee?: number;

  @ApiProperty({ description: 'The unit price at the time of investment' })
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({ description: 'The initial investment status', default: 'Subscription Submitted' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Whether the document is signed', default: false })
  @IsOptional()
  documentSigned?: boolean;
}

export class UpdateInvestmentStatusDto {
  @ApiProperty({ description: 'The new status of the investment' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Whether the document is signed', required: false })
  @IsOptional()
  documentSigned?: boolean;
}
