import { Controller, Get, Post, Patch, Delete, Param, UseInterceptors, UploadedFile, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('all')
  async getAllDocuments() {
    return this.documentsService.getAllDocuments();
  }

  @Get('fund/:fundId')
  async getFundDocuments(@Param('fundId') fundId: string) {
    return this.documentsService.getFundDocuments(fundId);
  }

  @Post('fund/:fundId/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const isVercel = process.env.VERCEL === '1';
        const uploadDir = isVercel
          ? join('/tmp', 'uploads', 'documents')
          : join(process.cwd(), 'uploads', 'documents');

        if (!fs.existsSync(uploadDir)) {
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
          } catch (err) {
            console.error('⚠️ Could not create documents directory:', err);
          }
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFundDocument(
    @Param('fundId') fundId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.documentsService.uploadFundDocument(fundId, {
      file_name: file.originalname,
      file_url: `/public/uploads/documents/${file.filename}`,
      document_type: body.document_type,
      tax_year: body.tax_year ? parseInt(body.tax_year) : undefined,
      description: body.description,
      note: body.note,
      file_size: file.size,
    });
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }

  @Patch(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.documentsService.updateDocument(id, {
      document_type: body.document_type,
      tax_year: body.tax_year ? parseInt(body.tax_year.toString()) : undefined,
      description: body.description,
      note: body.note,
    });
  }

  @Patch(':id/with-file')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async updateDocumentWithFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.documentsService.updateDocumentWithFile(id, {
      file_name: file.originalname,
      file_url: `/public/uploads/documents/${file.filename}`,
      document_type: body.document_type,
      tax_year: body.tax_year ? parseInt(body.tax_year.toString()) : undefined,
      description: body.description,
      note: body.note,
      file_size: file.size,
    });
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Get(':id/download')
  async downloadDocument(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getDocumentById(id);
    // Extract filename from file_url (e.g., /public/uploads/documents/UUID.pdf -> UUID.pdf)
    const filePathInDB = doc.file_url.split('/').pop();
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel ? '/tmp/uploads/documents' : join(process.cwd(), 'uploads', 'documents');
    const filePath = join(uploadDir, filePathInDB);
    return res.download(filePath, doc.file_name);
  }
}
