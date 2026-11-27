import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvestorFinancialsService } from './investor-financials.service';
import { CreateInvestorFinancialDto } from './dto/create-investor-financial.dto';
import { UpdateInvestorFinancialDto } from './dto/update-investor-financial.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { investorFinancialImageStorage } from '../../config/cloudinary.config';

@Controller('api/investor-financials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorFinancialsController {
  constructor(private readonly service: InvestorFinancialsService) {}

  @Get()
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get('search-investors')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  searchRegisteredInvestors(@Query('q') query?: string) {
    return this.service.searchRegisteredInvestors(query || '');
  }

  @Get('by-investor/:investorId')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  findByInvestorId(@Param('investorId') investorId: string) {
    return this.service.findByInvestorId(investorId);
  }

  @Get(':id')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  create(@Body() dto: CreateInvestorFinancialDto) {
    return this.service.create(dto);
  }

  @Post(':id/image')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  @UseInterceptors(FileInterceptor('file', { storage: investorFinancialImageStorage }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file || !file.path) {
      throw new BadRequestException('Image file is required');
    }
    return this.service.updateImage(id, file.path);
  }

  @Patch(':id')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  update(@Param('id') id: string, @Body() dto: UpdateInvestorFinancialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
