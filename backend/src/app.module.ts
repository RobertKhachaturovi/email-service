import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GmailModule } from './gmail/gmail.module';
import { CandidatesModule } from './candidates/candidates.module';

@Module({
  imports: [PrismaModule, GmailModule, CandidatesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
