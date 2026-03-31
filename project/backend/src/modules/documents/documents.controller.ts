import { Controller, Get, Post, Patch, Delete, Param, UseInterceptors, UploadedFile, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

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

  @Get('subscription/list')
  async listSubscriptionDocs() {
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel
      ? join('/tmp', 'uploads', 'subscription-documents')
      : join(process.cwd(), 'uploads', 'subscription-documents');

    if (!fs.existsSync(uploadDir)) {
      return [];
    }

    const files = fs.readdirSync(uploadDir).filter(file => file.toLowerCase().endsWith('.pdf'));

    return files.map(file => {
      const filePath = join(uploadDir, file);
      const stats = fs.statSync(filePath);

      // Calculate page count using regex
      let pageCount = 1;
      try {
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf8');
        const matches = content.match(/\/Type\s*\/Page\b/g);
        pageCount = matches ? Array.from(new Set(matches)).length : 1;
        // Fallback: if regex is too simple, we just use the length of matches
        if (matches && pageCount < matches.length) {
          pageCount = matches.length;
        }
      } catch (e) {
        console.error('Error reading PDF pages:', e);
      }

      const sizeFormatted = stats.size > 1024 * 1024
        ? `${(stats.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(stats.size / 1024).toFixed(0)} KB`;

      const modifiedDate = stats.mtime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return {
        name: file,
        size: `File size: ${sizeFormatted}`,
        lastModified: `Last updated on ${modifiedDate}`,
        pages: pageCount
      };
    });
  }

  @Get('subscription/preview/:filename')
  async previewSubscriptionDoc(@Param('filename') filename: string, @Res() res: Response) {
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel
      ? join('/tmp', 'uploads', 'subscription-documents')
      : join(process.cwd(), 'uploads', 'subscription-documents');

    const filePath = join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Document not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + filename);
    return res.sendFile(filePath);
  }
}
