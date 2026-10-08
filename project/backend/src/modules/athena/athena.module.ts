import { Module } from '@nestjs/common';
import { AthenaController } from './athena.controller';
import { AthenaService } from './athena.service';

@Module({
  controllers: [AthenaController],
  providers: [AthenaService],
  exports: [AthenaService],
})
export class AthenaModule {}
