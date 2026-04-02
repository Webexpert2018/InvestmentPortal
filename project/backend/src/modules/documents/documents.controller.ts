import { Controller, Get, Post, Patch, Delete, Param, UseInterceptors, UploadedFile, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { extname, join } from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { DocumentsService } from './documents.service';
import { fundDocumentStorage, cloudinary } from '../../config/cloudinary.config';

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
    storage: fundDocumentStorage,
  }))
  async uploadFundDocument(
    @Param('fundId') fundId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.documentsService.uploadFundDocument(fundId, {
      file_name: file.originalname,
      file_url: file.path, // Cloudinary URL
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
    storage: fundDocumentStorage,
  }))
  async updateDocumentWithFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.documentsService.updateDocumentWithFile(id, {
      file_name: file.originalname,
      file_url: file.path, // Cloudinary URL
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

  @Get(':id/view')
  async viewDocument(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getDocumentById(id);
    const isPDF = doc.file_name.toLowerCase().endsWith('.pdf');
    const contentType = isPDF ? 'application/pdf' : (doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `image/${doc.file_url.split('.').pop()}` : 'application/octet-stream');

    if (doc.file_url.startsWith('http')) {
      try {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        // 1. Try DIRECT fetch first (best for unblocked public assets)
        try {
          const response = await axios.get(doc.file_url, {
            responseType: 'stream',
            headers: { 'User-Agent': userAgent },
            timeout: 5000
          });
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
          return response.data.pipe(res);
        } catch (directError: any) {
          if (directError.response?.status !== 401 && directError.response?.status !== 403) {
            throw directError;
          }
          console.log('Direct fetch failed with 401/403, attempting signed URL fallback...');
        }

        // 2. Fallback: Signed URL (for protected assets)
        if (doc.file_url.includes('cloudinary.com')) {
          const urlParts = doc.file_url.split('/upload/');
          if (urlParts.length > 1) {
            const pathAfterUpload = urlParts[1];
            // Public ID should NOT have the extension for the SDK helper, but format should
            const publicId = pathAfterUpload.replace(/^v\d+\//, '').split('.')[0];
            const isPDF = doc.file_name.toLowerCase().endsWith('.pdf');

            const signedUrl = cloudinary.url(publicId, {
              sign_url: true,
              secure: true,
              resource_type: 'image',
              format: isPDF ? 'pdf' : undefined,
              type: 'upload'
            });

            const response = await axios.get(signedUrl, {
              responseType: 'stream',
              headers: { 'User-Agent': userAgent },
              timeout: 5000
            });
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
            return response.data.pipe(res);
          }
        }

        return res.status(500).send('Error fetching document from storage.');
      } catch (outerError: any) {
        console.error('Document Proxy Error:', outerError.message, 'Status:', outerError.response?.status);
        return res.status(500).send('Error fetching document from storage.');
      }
    }

    // Local file fallback
    const filePathInDB = doc.file_url.split('/').pop();
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel ? '/tmp/uploads/documents' : join(process.cwd(), 'uploads', 'documents');
    const filePath = join(uploadDir, filePathInDB);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    return res.sendFile(filePath);
  }

  @Get(':id/download')
  async downloadDocument(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getDocumentById(id);

    // If it's a Cloudinary URL, redirect to it
    if (doc.file_url.startsWith('http')) {
      return res.redirect(doc.file_url);
    }

    // Fallback for legacy local files
    const filePathInDB = doc.file_url.split('/').pop();
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel ? '/tmp/uploads/documents' : join(process.cwd(), 'uploads', 'documents');
    const filePath = join(uploadDir, filePathInDB);
    return res.download(filePath, doc.file_name);
  }

  @Get('subscription/list')
  async listSubscriptionDocs() {
    const isVercel = process.env.VERCEL === '1';
    const docsDir = join(process.cwd(), 'public', 'subscription-documents');

    if (!fs.existsSync(docsDir)) {
      return [];
    }

    const files = fs.readdirSync(docsDir).filter(file => file.toLowerCase().endsWith('.pdf'));

    return files.map(file => {
      const filePath = join(docsDir, file);
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
    const docsDir = join(process.cwd(), 'public', 'subscription-documents');
    const filePath = join(docsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Document not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + filename);
    return res.sendFile(filePath);
  }
}
