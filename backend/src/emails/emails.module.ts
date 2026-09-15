import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailPreviewModule } from '../email-preview/email-preview.module';

@Module({
  imports: [PrismaModule, EmailPreviewModule],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
