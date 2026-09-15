import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  sendEmail(
    @Body() dto: SendEmailDto,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = headerUserId || 'default-user';
    return this.emailsService.sendEmail(dto, userId);
  }
}
