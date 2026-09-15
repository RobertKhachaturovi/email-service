import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GmailModule } from './gmail/gmail.module';
import { CandidatesModule } from './candidates/candidates.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { EmailPreviewModule } from './email-preview/email-preview.module';

@Module({
  imports: [
    PrismaModule,
    GmailModule,
    CandidatesModule,
    EmailTemplatesModule,
    EmailPreviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
