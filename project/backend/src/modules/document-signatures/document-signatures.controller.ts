import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, UseGuards, Query, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentSignaturesService } from './document-signatures.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/document-signatures')
export class DocumentSignaturesController {
  constructor(private readonly service: DocumentSignaturesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document'))
  async createCampaign(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    const { name, placements: placementsStr, investorIds: investorIdsStr } = body;
    const placements = JSON.parse(placementsStr || '[]');
    const investorIds = JSON.parse(investorIdsStr || '[]');

    if (!file) {
      throw new Error('Document is required');
    }

    return this.service.createCampaign(name, file, placements, investorIds);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCampaigns() {
    return this.service.getCampaigns();
  }

  @Post(':campaignId/resend/:investorId')
  @UseGuards(JwtAuthGuard)
  async resendEmail(
    @Param('campaignId') campaignId: string,
    @Param('investorId') investorId: string
  ) {
    return this.service.resendEmail(campaignId, investorId);
  }

  @Post(':campaignId/add-recipients')
  @UseGuards(JwtAuthGuard)
  async addRecipients(
    @Param('campaignId') campaignId: string,
    @Body('investorIds') investorIds: string[]
  ) {
    return this.service.addRecipients(campaignId, investorIds);
  }

  @Get(':campaignId/sign-url/:investorId')
  async getSigningUrl(
    @Param('campaignId') campaignId: string,
    @Param('investorId') investorId: string,
    @Res() res: any
  ) {
    if (investorId === '[object Object]') {
      return res.status(400).send('Invalid investor ID in URL. Please create a new Document Signature Campaign to get the updated, working email links.');
    }
    
    console.log(`getSigningUrl called with campaignId: ${campaignId}, investorId: ${investorId}`);
    const result = await this.service.getSigningUrl(campaignId, investorId);
    return res.redirect(result.signingUrl);
  }

  @Get(':campaignId/complete/:investorId')
  async completeSignature(
    @Param('campaignId') campaignId: string,
    @Param('investorId') investorId: string,
    @Query('event') event: string,
    @Res() res: any
  ) {
    if (event === 'signing_complete') {
      await this.service.completeSignature(campaignId, investorId);
    }
    // Redirect to frontend login
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/login`);
  }

  private async proxyCloudinaryPdf(documentUrl: string, res: any, filename: string) {
    if (!documentUrl) {
      throw new Error('Document URL is missing');
    }

    try {
      const cloudinary = require('../../config/cloudinary.config').cloudinary;
      const urlParts = documentUrl.split('/upload/');
      if (urlParts.length !== 2) {
        // Fallback for non-cloudinary URLs or direct fetch
        const axios = require('axios');
        const response = await axios.get(documentUrl, { responseType: 'stream', timeout: 10000 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return response.data.pipe(res);
      }

      let publicId = urlParts[1];
      if (publicId.match(/^v\d+\//)) {
        publicId = publicId.replace(/^v\d+\//, '');
      }

      const signedUrl = cloudinary.utils.private_download_url(publicId, '', {
        resource_type: 'raw',
        type: 'upload'
      });

      const axios = require('axios');
      const response = await axios.get(signedUrl, { responseType: 'stream', timeout: 10000 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return response.data.pipe(res);
    } catch (error) {
      console.error('Error proxying PDF:', error);
      res.status(500).send('Failed to load PDF document');
    }
  }

  @Get(':campaignId/original-pdf')
  async getOriginalPdf(@Param('campaignId') campaignId: string, @Res() res: any) {
    const db = require('../../config/database').db;
    const result = await db.query('SELECT original_document_path FROM document_signature_campaigns WHERE id = $1', [campaignId]);
    if (!result.rows.length || !result.rows[0].original_document_path) {
      return res.status(404).send('Document not found');
    }
    return this.proxyCloudinaryPdf(result.rows[0].original_document_path, res, `Campaign_${campaignId}.pdf`);
  }

  @Get(':campaignId/signed-pdf/:investorId')
  async getSignedPdf(
    @Param('campaignId') campaignId: string,
    @Param('investorId') investorId: string,
    @Res() res: any
  ) {
    const db = require('../../config/database').db;
    const result = await db.query(
      'SELECT signed_document_path FROM document_signature_recipients WHERE campaign_id = $1 AND investor_id = $2', 
      [campaignId, investorId]
    );
    if (!result.rows.length || !result.rows[0].signed_document_path) {
      return res.status(404).send('Signed document not found');
    }
    return this.proxyCloudinaryPdf(result.rows[0].signed_document_path, res, `Signed_${investorId}.pdf`);
  }
}
