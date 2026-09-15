import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { RingCentralService } from './ringcentral.service';

@Controller('api/ringcentral')
export class RingCentralController {
  constructor(private readonly ringCentralService: RingCentralService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken() {
    return this.ringCentralService.getAccessToken();
  }

  @Post('sip-provision')
  @HttpCode(HttpStatus.OK)
  async getSipProvision() {
    return this.ringCentralService.getSipProvision();
  }
}
