import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GmailModule } from './gmail/gmail.module';

@Module({
  imports: [PrismaModule, GmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
