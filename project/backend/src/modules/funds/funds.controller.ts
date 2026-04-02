import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fundImageStorage } from '../../config/cloudinary.config';
import * as fs from 'fs';
import * as path from 'path';
import { FundsService } from './funds.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/funds')
@UseGuards(JwtAuthGuard)
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Get()
  findAll() {
    return this.fundsService.getAllFunds();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fundsService.getFundById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() createFundDto: any) {
    return this.fundsService.createFund(createFundDto);
  }

  @Post(':id/image')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fundImageStorage,
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
  async uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    // Construct simplified URL
    const imageUrl = file.path; // Cloudinary URL is in file.path
      
    await this.fundsService.updateFund(id, { image_url: imageUrl });
    console.log(`✅ Fund Image Uploaded: ${id} -> ${imageUrl}`);
    return { message: 'Fund image uploaded successfully', imageUrl };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateFundDto: any) {
    return this.fundsService.updateFund(id, updateFundDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.fundsService.deleteFund(id);
  }
}
