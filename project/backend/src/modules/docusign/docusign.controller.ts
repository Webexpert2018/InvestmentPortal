import { Controller, Get, Post, Query, Param, Body, Res, UseGuards, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { DocusignService } from './docusign.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { db } from '../../config/database';
import { cloudinary } from '../../config/cloudinary.config';

/**
 * DocuSign Controller handles HTTP requests for DocuSign integration.
 */
@Controller('api/docusign')
export class DocusignController {
  constructor(
    private readonly docusignService: DocusignService,
    private readonly usersService: UsersService
  ) { }

  /**
   * Redirects the user to DocuSign for authorization.
   */
  @Get('auth')
  async getAuthUrl(@Res() res: Response) {
    const url = this.docusignService.getAuthUrl();
    return res.redirect(url);
  }

  /**
   * Endpoint for handling callback directly if needed.
   */
  @Get('callback')
  async handleCallback(@Query('code') code: string) {
    if (!code) {
      return { error: 'No authorization code provided' };
    }
    try {
      return await this.docusignService.handleCallback(code);
    } catch (error: any) {
      return { error: error.message, details: error.response?.body || 'No details available' };
    }
  }

  /**
   * Endpoint for the frontend to exchange a code for a token.
   */
  @Post('token')
  async getToken(@Body('code') code: string) {
    try {
      return await this.docusignService.handleCallback(code);
    } catch (error: any) {
      throw new BadRequestException({
        message: 'Failed to exchange DocuSign code for token',
        error: error.message,
        details: error.response?.body || 'No details available'
      });
    }
  }

  /**
   * Main endpoint to initiate the signing process for an investment.
   */
  @Post('create-signing-url')
  @UseGuards(JwtAuthGuard)
  async createSigningUrl(
    @CurrentUser() user: any,
    @Body() body: {
      fundId: string;
      fundName: string;
      accessToken?: string;
      accountId?: string;
      investmentAmount: number;
      accountType: string;
      iraMetadata?: {
        custodian?: string;
        type?: string;
      };
      returnUrl?: string;
    }
  ) {
    try {
      const { fundId, fundName, accessToken, accountId, investmentAmount, accountType, iraMetadata, returnUrl } = body;

      if (!fundId || !investmentAmount) {
        throw new BadRequestException('Missing required fund or amount details');
      }

      console.log(`[DocusignController] Initiating signing URL for user ${user.userId}, fund ${fundId}`);

      // Fetch full user profile to get accurate name and email
      const profile = await this.usersService.getProfile(user.userId);
      const clientName = `${profile.firstName} ${profile.lastName}`;
      const signerEmail = profile.email;

      // Calculate Investor Name based on account type
      let investorName = clientName;
      if (accountType !== 'personal' && iraMetadata) {
        const custodian = iraMetadata.custodian || 'AET';
        const type = iraMetadata.type || 'IRA';
        investorName = `${custodian} FBO ${clientName} ${type}`;
      }

      const finalReturnUrl = returnUrl || `${process.env.FRONTEND_URL}/dashboard/invest?signing=complete&fundId=${fundId}`;

      const result = await this.docusignService.createEnvelopeForInvestment(
        accessToken ?? null,
        accountId ?? null,
        signerEmail,
        investorName,
        fundName,
        investmentAmount,
        finalReturnUrl,
        fundId
      );

      console.log(`[DocusignController] Successfully created signing URL: ${result.envelopeId}`);
      return result;
    } catch (error: any) {
      console.error('[DocusignController] Error creating signing URL:', error.message);
      
      // If it's already a NestJS exception, rethrow it
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      
      const isAuthError = error.message?.includes('401') || 
                          error.response?.status === 401 || 
                          error.response?.body?.errorCode === 'USER_AUTHENTICATION_FAILED';
      
      const errorResponse = {
        message: 'Failed to initiate DocuSign signing process',
        error: error.message,
        details: error.response?.body || error.response?.data || error.message || 'No additional details available'
      };

      if (isAuthError) {
        throw new UnauthorizedException(errorResponse);
      }
      
      throw new BadRequestException(errorResponse);
    }
  }

  /**
   * Test endpoint to create an envelope and get a signing URL.
   */
  @Post('test-envelope')
  async createTestEnvelope(
    @Body() body: {
      accessToken: string,
      accountId: string,
      signerEmail: string,
      signerName: string,
      filename?: string
    }
  ) {
    return this.docusignService.createSampleEnvelope(
      body.accessToken,
      body.accountId,
      body.signerEmail,
      body.signerName,
      { filename: body.filename || 'SA-BWell-Fund.pdf' }
    );
  }

  /**
   * Fetches the signed document for a specific envelope.
   */
  @Get('envelope/:envelopeId/document')
  @UseGuards(JwtAuthGuard)
  async getEnvelopeDocument(
    @Param('envelopeId') envelopeId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    try {
      const tokenData = await this.docusignService.getAccessTokenJWT();
      const finalAccessToken = tokenData.accessToken;
      const finalAccountId = tokenData.accountId;

      let pdfBuffer: Buffer;
      try {
        let pdfData = await this.docusignService.getEnvelopeDocument(finalAccessToken, finalAccountId, envelopeId);

        if (typeof pdfData === 'string') {
          pdfBuffer = Buffer.from(pdfData, 'base64');
        } else if (Buffer.isBuffer(pdfData)) {
          pdfBuffer = pdfData;
        } else {
          pdfBuffer = Buffer.from(pdfData as any);
        }
      } catch (dsError) {
        const fs = require('fs');
        const path = require('path');
        const fallbackPath = path.resolve(process.cwd(), 'public/subscription-documents/SA-BWell-Fund.pdf');
        
        if (fs.existsSync(fallbackPath)) {
          pdfBuffer = fs.readFileSync(fallbackPath);
        } else {
          throw dsError;
        }
      }


      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=signed_documents_${envelopeId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error: any) {
      throw new BadRequestException({
        message: 'Failed to fetch DocuSign document',
        error: error.message
      });
    }
  }
}

