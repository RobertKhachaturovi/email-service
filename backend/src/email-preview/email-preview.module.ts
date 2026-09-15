import { Module } from '@nestjs/common';
import { EmailPreviewService } from './email-preview.service';
import { EmailPreviewController } from './email-preview.controller';

@Module({
  controllers: [EmailPreviewController],
  providers: [EmailPreviewService],
  exports: [EmailPreviewService],
})
export class EmailPreviewModule {}
