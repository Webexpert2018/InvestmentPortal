import { Controller, Get, Put, Patch, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() updateDto: UpdateProfileDto) {
    if (updateDto.dob) {
      const birthDate = new Date(updateDto.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new BadRequestException('You must be at least 18 years old');
      } else if (age > 70) {
        throw new BadRequestException('Age cannot exceed 70 years');
      }
    }

    return this.usersService.updateProfile(
      user.userId,
      updateDto.firstName,
      updateDto.lastName,
      updateDto.phone,
      updateDto.dob,
      updateDto.addressLine1,
      updateDto.addressLine2,
      updateDto.city,
      updateDto.state,
      updateDto.zipCode,
      updateDto.country,
      updateDto.taxId,
    );
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @Put('settings')
  async updateSettings(@CurrentUser() user: any, @Body() updateDto: UpdateProfileDto) {
    if (updateDto.dob) {
      const birthDate = new Date(updateDto.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new BadRequestException('You must be at least 18 years old');
      } else if (age > 70) {
        throw new BadRequestException('Age cannot exceed 70 years');
      }
    }

    return this.usersService.updateProfile(
      user.userId,
      updateDto.firstName,
      updateDto.lastName,
      updateDto.phone,
      updateDto.dob,
      updateDto.addressLine1,
      updateDto.addressLine2,
      updateDto.city,
      updateDto.state,
      updateDto.zipCode,
      updateDto.country,
      updateDto.taxId,
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
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any
  ) {
    return this.usersService.updateUserStatus(id, body.status, user.role);
  }

  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(user.userId, body.oldPassword, body.newPassword);
  }

  @Post('profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads', 'profile-images'),
        filename: (req: any, file: any, cb: any) => {
          const userId = req.user?.userId || 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `user-${userId}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageUrl = `/public/uploads/profile-images/${file.filename}`;

    // Update user's profile image URL in DB
    await this.usersService.updateProfile(user.userId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, imageUrl);

    return {
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl
    };
  }
}
