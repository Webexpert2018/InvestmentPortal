import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      message: 'Investment Portal API is running',
      status: 'ok',
      docs: '/api/docs'
    };
  }

  @Get('api')
  apiRoot() {
    return {
      message: 'Investment Portal API Root',
      status: 'ok',
      docs: '/api/docs'
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      framework: 'NestJS',
    };
  }
}
