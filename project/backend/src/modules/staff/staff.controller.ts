import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';
import { staffImageStorage } from '../../config/cloudinary.config';

@Controller('api/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async findAll(@Query('role') role?: string) {
    return this.staffService.findAll(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: staffImageStorage }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStaffDto: CreateStaffDto
  ) {
    if (file) {
      createStaffDto.profile_image_url = (file as any).path;
    }
    return this.staffService.create(createStaffDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', { storage: staffImageStorage }))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateStaffDto: UpdateStaffDto
  ) {
    if (file) {
      updateStaffDto.profile_image_url = (file as any).path;
    }
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
