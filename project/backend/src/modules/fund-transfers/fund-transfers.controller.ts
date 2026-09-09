import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FundTransfersService } from './fund-transfers.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/fund-transfers')
export class FundTransfersController {
  constructor(private readonly fundTransfersService: FundTransfersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async findAll() {
    return this.fundTransfersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async findOne(@Param('id') id: string) {
    if (id === 'templates' || id === 'sender-funds' || id === 'old-investor-accounts') {
      return null; // Let other routes handle it
    }
    const transfer = await this.fundTransfersService.findOne(id);
    if (!transfer) {
      throw new BadRequestException('Transfer not found');
    }
    return transfer;
  }

  @Get('sender-funds/:investorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async getSenderFunds(
    @Param('investorId') investorId: string,
    @Query('accountId') accountId?: string,
    @Query('accountType') accountType?: string,
  ) {
    return this.fundTransfersService.getSenderFunds(investorId, accountId, accountType);
  }

  @Get('old-investor-accounts/:investorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async getOldInvestorAccounts(@Param('investorId') investorId: string) {
    return this.fundTransfersService.getOldInvestorAccounts(investorId);
  }

  @Get('templates/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async getTemplate(@Param('type') type: string) {
    const template = await this.fundTransfersService.getTemplate(type);
    if (template) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      template.document_url = `${backendUrl}/api/fund-transfers/templates/${type}/pdf`;
    }
    return template;
  }

  @Get('templates/:type/pdf')
  async getTemplatePdf(@Param('type') type: string, @Res() res: any) {
    const template = await this.fundTransfersService.getTemplate(type);
    if (!template || !template.document_url) {
      throw new BadRequestException('Template not found');
    }

    try {
      // Proxy the PDF stream from Cloudinary
      const axios = require('axios');
      const response = await axios.get(template.document_url, {
        responseType: 'stream',
        timeout: 10000
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${type}_template.pdf"`);
      return response.data.pipe(res);
    } catch (error: any) {
      // If direct fetch fails (often due to Cloudinary PDF security settings), try generating a signed URL
      try {
        const cloudinary = require('../../config/cloudinary.config').cloudinary;
        // Extract public ID from URL
        const urlParts = template.document_url.split('/');
        const versionIndex = urlParts.findIndex((p: string) => p.startsWith('v') && !isNaN(parseInt(p.substring(1))));
        if (versionIndex !== -1) {
          const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
          const isRaw = template.document_url.includes('/raw/');
          const publicIdToUse = isRaw ? publicIdWithExt : publicId;
          const formatToUse = isRaw ? '' : 'pdf';
          
          const signedUrl = cloudinary.utils.private_download_url(publicIdToUse, formatToUse, {
            resource_type: isRaw ? 'raw' : 'image',
            type: 'upload'
          });

          const axios = require('axios');
          const signedResponse = await axios.get(signedUrl, {
            responseType: 'stream',
            timeout: 10000
          });
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${type}_template.pdf"`);
          return signedResponse.data.pipe(res);
        }
        throw error;
      } catch (fallbackError) {
        console.error('Failed to proxy template PDF:', fallbackError);
        throw new BadRequestException('Failed to load template PDF');
      }
    }
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  @UseInterceptors(FileInterceptor('document'))
  async upsertTemplate(
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    let parsedPlacements = [];
    if (body.placements) {
      try {
        parsedPlacements = JSON.parse(body.placements);
      } catch (e) {
        throw new BadRequestException('Invalid placements format.');
      }
    }
    return this.fundTransfersService.upsertTemplate(body.transferType, file, parsedPlacements);
  }

  @Put(':id/internal-amount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async updateInternalAmount(@Param('id') id: string, @Body('amount') amount: number) {
    return this.fundTransfersService.updateInternalAmount(id, amount);
  }

  @Put(':id/reconcile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  async reconcile(@Param('id') id: string, @Body('status') status: boolean) {
    return this.fundTransfersService.reconcile(id, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'executive_admin', 'fund_admin')
  @UseInterceptors(FileInterceptor('document'))
  async create(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    if (!file && !body.templateId) {
      throw new BadRequestException('A document specifying signing fields or a saved template is required.');
    }
    
    // Parse placements if it's sent as stringified JSON
    let parsedPlacements = [];
    if (body.placements) {
      try {
        parsedPlacements = JSON.parse(body.placements);
      } catch (e) {
        throw new BadRequestException('Invalid placements format.');
      }
    }

    const data = {
      transferType: body.transferType,
      fromInvestorId: body.fromInvestorId,
      toInvestorId: body.toInvestorId,
      fromAccountType: body.fromAccountType,
      fromAccountId: body.fromAccountId,
      toAccountType: body.toAccountType,
      toAccountId: body.toAccountId,
      fromFundId: body.fromFundId,
      toFundId: body.toFundId,
      investmentAmount: parseFloat(body.investmentAmount),
      units: parseFloat(body.units),
      placements: parsedPlacements,
      signerName: body.signerName,
      signerEmail: body.signerEmail
    };

    return this.fundTransfersService.create(data, file);
  }

  @Get(':id/sign')
  async signTransfer(@Param('id') id: string, @Res() res: any) {
    const url = await this.fundTransfersService.generateSignUrl(id);
    return res.redirect(url);
  }

  @Get(':id/docusign-callback')
  async docusignCallback(@Param('id') id: string, @Query('event') event: string, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (event === 'signing_complete') {
      try {
        await this.fundTransfersService.completeTransfer(id);
        return res.redirect(`${frontendUrl}/auth/login?transfer_signed=true`);
      } catch (err) {
        console.error('Error completing transfer via callback:', err);
        return res.redirect(`${frontendUrl}/auth/login?transfer_error=true`);
      }
    } else {
      // User cancelled or closed
      return res.redirect(`${frontendUrl}/auth/login`);
    }
  }
  @Get(':id/pdf')
  async getTransferPdf(@Param('id') id: string, @Res() res: any) {
    try {
      const transfer = await this.fundTransfersService.findOne(id);
      if (!transfer || !transfer.document_url) {
        throw new BadRequestException('Document not found');
      }

      const cloudinary = require('../../config/cloudinary.config').cloudinary;
      const urlParts = transfer.document_url.split('/upload/');
      if (urlParts.length !== 2) throw new Error('Invalid URL');
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
      res.setHeader('Content-Disposition', `inline; filename="Transfer_${id}.pdf"`);
      return response.data.pipe(res);
    } catch (err) {
      console.error('Failed to proxy transfer PDF:', err);
      throw new BadRequestException('Failed to load PDF');
    }
  }
}
