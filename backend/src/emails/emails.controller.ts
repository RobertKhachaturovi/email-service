import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';

const DEFAULT_USER_ID = 'default-user';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  sendEmail(@Body() dto: SendEmailDto) {
    return this.emailsService.sendEmail(dto, DEFAULT_USER_ID);
  }

  @Get()
  getEmailHistory() {
    return this.emailsService.getEmailHistory(DEFAULT_USER_ID);
  }
}
