import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fundImageStorage, fundDocumentStorage, cloudinary } from '../../config/cloudinary.config';
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

  @Get('old-funds')
  findOldFunds() {
    return this.fundsService.getOldFunds();
  }

  @Get('old-funds/:id')
  findOldFundById(@Param('id') id: string) {
    return this.fundsService.getOldFundById(parseInt(id));
  }

  @Get('old-funds/:id/investors/:profileId')
  findOldFundInvestor(
    @Param('id') id: string,
    @Param('profileId') profileId: string
  ) {
    return this.fundsService.getOldFundInvestor(parseInt(id), parseInt(profileId));
  }

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

  @Post(':id/subscription-document')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSubscriptionDoc(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.originalname.match(/\.(pdf)$/i)) {
      throw new BadRequestException('Only PDF files are allowed!');
    }

    try {
      console.log('☁️ Cloudinary: Uploading PDF template as RAW .dat to bypass PDF Strict restrictions...');
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'investment-portal/fund-documents',
            resource_type: 'raw',
            public_id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.dat`
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = await uploadPromise;
      const filePath = uploadResult.secure_url;

      await this.fundsService.updateFund(id, { subscriptionDocPath: filePath });
      console.log(`✅ Fund Subscription Document Uploaded: ${id} -> ${filePath}`);
      return { message: 'Subscription document uploaded successfully', filePath };
    } catch (err: any) {
      console.error('❌ Cloudinary Upload failed:', err);
      throw new BadRequestException('Failed to upload file to Cloud storage');
    }
  }

  @Post(':id/oa-document')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOADoc(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.originalname.match(/\.(pdf)$/i)) {
      throw new BadRequestException('Only PDF files are allowed!');
    }

    try {
      console.log('☁️ Cloudinary: Uploading OA PDF template as RAW .dat...');
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'investment-portal/fund-documents',
            resource_type: 'raw',
            public_id: `oa-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.dat`
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = await uploadPromise;
      const filePath = uploadResult.secure_url;

      await this.fundsService.updateFund(id, { oaDocPath: filePath });
      console.log(`✅ Fund Operating Agreement Document Uploaded: ${id} -> ${filePath}`);
      return { message: 'Operating Agreement document uploaded successfully', filePath };
    } catch (err: any) {
      console.error('❌ Cloudinary Upload failed:', err);
      throw new BadRequestException('Failed to upload file to Cloud storage');
    }
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
