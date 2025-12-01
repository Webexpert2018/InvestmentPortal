import { Controller, Get, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() updateDto: any) {
    return this.usersService.updateProfile(
      user.userId,
      updateDto.firstName,
      updateDto.lastName,
      updateDto.phone,
    );
  }

  @Get()
  @Roles('admin')
  async getAllUsers(@CurrentUser() user: any) {
    return this.usersService.getAllUsers(user.role);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.getUserById(id, user.userId, user.role);
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() user: any) {
    return this.usersService.updateUserStatus(id, body.status, user.role);
  }
}
