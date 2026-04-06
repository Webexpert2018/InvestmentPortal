import { Controller, Get, Post, Query, Body, Res, UseGuards, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { DocusignService } from './docusign.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

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
      accessToken: string;
      accountId: string;
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

      if (!accessToken || !accountId || !fundId || !investmentAmount) {
        throw new BadRequestException('Missing required authentication, fund, or amount details');
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
        accessToken,
        accountId,
        signerEmail,
        investorName,
        fundName,
        investmentAmount,
        finalReturnUrl
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
        details: error.response?.body || error.response?.data || 'No additional details available'
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
    @Query('accessToken') accessToken: string,
    @Query('accountId') accountId: string,
    @Query('envelopeId') envelopeId: string,
    @Res() res: Response
  ) {
    if (!accessToken || !accountId || !envelopeId) {
      throw new BadRequestException('Missing required authentication or envelope details');
    }

    try {
      const pdfBase64 = await this.docusignService.getEnvelopeDocument(accessToken, accountId, envelopeId);

      const pdfBuffer = Buffer.from(pdfBase64, 'base64');

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

