import { Controller, Get, Post, Patch, Delete, Param, Query, UseInterceptors, UploadedFile, Body, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { extname, join } from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { DocumentsService } from './documents.service';
import { fundDocumentStorage, kycDocumentStorage, cloudinary } from '../../config/cloudinary.config';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Get('all')
  async getAllDocuments(@CurrentUser() user: any) {
    return this.documentsService.getAllDocuments(user.userId, user.role);
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
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }
      return await this.documentsService.uploadFundDocument(fundId, {
        file_name: file.originalname,
        file_url: file.path, // Cloudinary URL
        document_type: body.document_type,
        tax_year: body.tax_year ? parseInt(body.tax_year) : undefined,
        description: body.description,
        note: body.note,
        file_size: file.size,
      });
    } catch (error: any) {
      console.error('❌ Error uploading fund document:', error);
      throw error;
    }
  }

  @Post('vault/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVaultDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    try {
      if (!file) {
        console.error('❌ UploadVaultDocument: No file received in request');
        throw new BadRequestException('File is required');
      }
      
      if (file.size === 0) {
        throw new BadRequestException('The uploaded file is empty (0 bytes). Please select a valid file.');
      }
      
      console.log(`🚀 Uploading to vault via memory stream for user ${user.userId}: ${file.originalname} (${file.size} bytes)`);

      const cloudinaryUpload = () => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: user.role === 'investor' ? 'investment-portal/investor-documents' : 'investment-portal/fund-documents',
              resource_type: 'auto',
              public_id: `vault-${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      };

      const uploadResult: any = await cloudinaryUpload();
      const fileUrl = uploadResult.secure_url;

      // Determine which investor this document belongs to
      const targetInvestorId = body.investor_id || (user.role === 'investor' ? user.userId : null);

      // If we have an investor ID (either from body or from user session), save to investor_documents
      if (targetInvestorId) {
        return await this.documentsService.uploadKycDocument(targetInvestorId, {
          file_name: file.originalname,
          file_url: fileUrl,
          document_type: body.document_type || 'tax_document',
          tax_year: body.tax_year ? parseInt(body.tax_year) : undefined,
          description: body.description,
          file_size: file.size,
        });
      }

      // Default: save to fund_documents (general vault)
      return await this.documentsService.uploadFundDocument(null, {
        file_name: file.originalname,
        file_url: fileUrl,
        document_type: body.document_type,
        tax_year: body.tax_year ? parseInt(body.tax_year) : undefined,
        description: body.description,
        note: body.note,
        file_size: file.size,
      });
    } catch (error: any) {
      console.error('❌ Error uploading vault document:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  @Get('my')
  async getMyDocuments(@CurrentUser() user: any) {
    return this.documentsService.getMyDocuments(user.userId);
  }

  @Get('investor/:investorId')
  @Roles('admin', 'accountant')
  async getInvestorDocuments(
    @Param('investorId') investorId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getInvestorDocuments(investorId, user.userId, user.role);
  }

  @Get('old-investor/:query')
  async getOldInvestorDocuments(@Param('query') query: string) {
    return this.documentsService.getOldInvestorDocuments(query);
  }

  @Get('old-investor/file/:id/view')
  async viewOldInvestorDocument(@Param('id') id: string, @Res() res: Response) {
    try {
      const doc = await this.documentsService.getOldInvestorDocumentById(id);
      if (!doc) {
        throw new BadRequestException('Document not found');
      }
      const s3Res = await this.documentsService.getOldDocumentS3Stream(doc.s3_key);
      res.setHeader('Content-Type', s3Res.ContentType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
      (s3Res.Body as any).pipe(res);
    } catch (err: any) {
      res.status(500).send(`Failed to stream document: ${err.message}`);
    }
  }

  @Get('old-investor/file/:id/download')
  async downloadOldInvestorDocument(@Param('id') id: string, @Res() res: Response) {
    try {
      const doc = await this.documentsService.getOldInvestorDocumentById(id);
      if (!doc) {
        throw new BadRequestException('Document not found');
      }
      const s3Res = await this.documentsService.getOldDocumentS3Stream(doc.s3_key);
      res.setHeader('Content-Type', s3Res.ContentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
      (s3Res.Body as any).pipe(res);
    } catch (err: any) {
      res.status(500).send(`Failed to download document: ${err.message}`);
    }
  }

  @Post('kyc/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: kycDocumentStorage,
  }))
  async uploadKycDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentsService.uploadKycDocument(user.userId, {
      file_name: file.originalname,
      file_url: file.path, 
      document_type: body.document_type || 'kyc_id',
      file_size: file.size,
      description: body.description,
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
    const cleanUrl = doc.file_url ? doc.file_url.split('?')[0] : '';
    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    const isPDF = extension === 'pdf';
    const contentType = isPDF ? 'application/pdf' : (extension?.match(/^(jpg|jpeg|png|gif|webp)$/) ? `image/${extension}` : 'application/octet-stream');

    if (doc.s3_key) {
      try {
        const s3Res = await this.documentsService.getOldDocumentS3Stream(doc.s3_key);
        res.setHeader('Content-Type', s3Res.ContentType || contentType);
        res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
        return (s3Res.Body as any).pipe(res);
      } catch (err: any) {
        return res.status(500).send(`Failed to stream document from S3: ${err.message}`);
      }
    }

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

        // 2. Fallback: Use Admin API to find exact asset details (Type/Resource_Type)
        if (doc.file_url.includes('cloudinary.com')) {
          const match = doc.file_url.match(/\/(upload|private|authenticated)\/(v(\d+)\/)?(.+)$/);
          if (match) {
            const pathWithExtension = decodeURIComponent(match[4].split('?')[0]);
            const pathWithoutExtension = pathWithExtension.replace(/\.[^/.]+$/, "");
            
            // We try to find the resource using Admin API to get the correct type and resource_type
            const resourceTypes = ['image', 'raw', 'video'];
            let assetInfo: any = null;

            console.log(`[Admin API] Attempting to locate asset: ${pathWithoutExtension}`);

            for (const rType of resourceTypes) {
              try {
                // Try both with and without extension
                const pId = rType === 'raw' ? pathWithExtension : pathWithoutExtension;
                assetInfo = await cloudinary.api.resource(pId, { resource_type: rType });
                if (assetInfo) break;
              } catch (e) {
                continue;
              }
            }

            if (assetInfo) {
              console.log(`[Admin API] Found asset metadata:`, JSON.stringify(assetInfo, null, 2));
              
              const signedUrl = cloudinary.utils.private_download_url(assetInfo.public_id, assetInfo.format || 'pdf', {
                resource_type: assetInfo.resource_type,
                type: assetInfo.type,
              });

              console.log(`[Admin API] Generated Specialized Signed URL: ${signedUrl}`);

              try {
                const response = await axios.get(signedUrl, {
                  responseType: 'stream',
                  headers: { 'User-Agent': userAgent },
                  timeout: 10000
                });

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
                return response.data.pipe(res);
              } catch (fetchError: any) {
                console.error(`[Admin API] Fetch failed for signed URL. Status: ${fetchError.response?.status}`);
                if (fetchError.response?.data) {
                  // For streams, data might be a stream, so we might not be able to log it easily
                  console.error(`[Admin API] Error data available`);
                }
                throw fetchError;
              }
            }
          }
        }

        console.error(`[Proxy] Failed to resolve asset for fallback: ${doc.file_url}`);
        return res.status(500).send('Error fetching document from storage: Asset resolution failed.');
      } catch (outerError: any) {
        console.error('Document Proxy Error:', outerError.message);
        if (outerError.response) {
          console.error('Response Status:', outerError.response.status);
          console.error('Response Headers:', outerError.response.headers);
        }
        return res.status(500).send(`Error fetching document from storage: ${outerError.message}`);
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
    const cleanUrl = doc.file_url ? doc.file_url.split('?')[0] : '';
    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    const isPDF = extension === 'pdf';
    const contentType = isPDF ? 'application/pdf' : (extension?.match(/^(jpg|jpeg|png|gif|webp)$/) ? `image/${extension}` : 'application/octet-stream');

    if (doc.s3_key) {
      try {
        const s3Res = await this.documentsService.getOldDocumentS3Stream(doc.s3_key);
        res.setHeader('Content-Type', s3Res.ContentType || contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
        return (s3Res.Body as any).pipe(res);
      } catch (err: any) {
        return res.status(500).send(`Failed to download document from S3: ${err.message}`);
      }
    }

    if (doc.file_url.startsWith('http')) {
      try {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        // 1. Try DIRECT fetch first
        try {
          const response = await axios.get(doc.file_url, {
            responseType: 'stream',
            headers: { 'User-Agent': userAgent },
            timeout: 5000
          });
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
          return response.data.pipe(res);
        } catch (directError: any) {
          if (directError.response?.status !== 401 && directError.response?.status !== 403) {
            throw directError;
          }
          console.log('Direct download fetch failed with 401/403, attempting signed URL fallback...');
        }

        // 2. Fallback: Use Admin API to find exact asset details
        if (doc.file_url.includes('cloudinary.com')) {
          const match = doc.file_url.match(/\/(upload|private|authenticated)\/(v(\d+)\/)?(.+)$/);
          if (match) {
            const pathWithExtension = match[4].split('?')[0];
            const pathWithoutExtension = pathWithExtension.replace(/\.[^/.]+$/, "");
            
            const resourceTypes = ['image', 'raw', 'video'];
            let assetInfo: any = null;

            for (const rType of resourceTypes) {
              try {
                const pId = rType === 'raw' ? pathWithExtension : pathWithoutExtension;
                assetInfo = await cloudinary.api.resource(pId, { resource_type: rType });
                if (assetInfo) break;
              } catch (e) {
                continue;
              }
            }

            if (assetInfo) {
              const signedUrl = cloudinary.utils.private_download_url(assetInfo.public_id, assetInfo.format || (isPDF ? 'pdf' : 'jpg'), {
                resource_type: assetInfo.resource_type,
                type: assetInfo.type,
              });

              const response = await axios.get(signedUrl, {
                responseType: 'stream',
                headers: { 'User-Agent': userAgent },
                timeout: 10000
              });

              res.setHeader('Content-Type', contentType);
              res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
              return response.data.pipe(res);
            }
          }
        }

        return res.redirect(doc.file_url);
      } catch (outerError: any) {
        console.error('Download Proxy Error:', outerError.message);
        return res.status(500).send(`Error downloading document: ${outerError.message}`);
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
  async previewSubscriptionDoc(
    @Param('filename') filename: string,
    @Query('url') url: string,
    @Res() res: Response
  ) {
    const targetUrl = url || (filename.startsWith('http://') || filename.startsWith('https://') ? filename : null);

    if (targetUrl) {
      try {
        const response = await axios.get(targetUrl, { responseType: 'stream' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=subscription-agreement.pdf');
        return response.data.pipe(res);
      } catch (err: any) {
        console.error('Failed to stream PDF from Cloudinary:', err);
        return res.status(500).send('Failed to load PDF from Cloud');
      }
    }

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
