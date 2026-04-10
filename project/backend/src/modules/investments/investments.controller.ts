import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto, UpdateInvestmentStatusDto } from './dto/create-investment.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  async createInvestment(@CurrentUser() user: any, @Body() createInvestmentDto: CreateInvestmentDto) {
    if (!user.userId) throw new UnauthorizedException('User ID not found');
    const investment = await this.investmentsService.createInvestment(user.userId, createInvestmentDto);
    return {
      message: 'Investment saved successfully!',
      investment,
    };
  }

  @Get('my')
  async getMyInvestments(@CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User ID not found');
    return this.investmentsService.getMyInvestments(user.userId);
  }

  @Get('investor/:id')
  async getInvestorInvestments(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'accountant') {
      throw new UnauthorizedException('Access denied');
    }
    return this.investmentsService.getMyInvestments(id);
  }

  @Get('all')
  async getAllInvestments(@CurrentUser() user: any) {
    // Ideally check if user is admin here
    return this.investmentsService.getAllInvestments();
  }

  @Get(':id')
  async getInvestmentById(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user.userId) throw new UnauthorizedException('User ID not found');
    return this.investmentsService.getInvestmentById(user.userId, id, user.role);
  }

  @Patch(':id/status')
  async updateInvestmentStatus(
    @CurrentUser() user: any, 
    @Param('id') id: string, 
    @Body() updateStatusDto: UpdateInvestmentStatusDto
  ) {
    if (!user.userId) throw new UnauthorizedException('User ID not found');
    return this.investmentsService.updateInvestmentStatus(user.userId, id, updateStatusDto, user.role);
  }

}
