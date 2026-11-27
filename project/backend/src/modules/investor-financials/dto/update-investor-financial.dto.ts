import { PartialType } from '@nestjs/swagger';
import { CreateInvestorFinancialDto } from './create-investor-financial.dto';

export class UpdateInvestorFinancialDto extends PartialType(CreateInvestorFinancialDto) {}
