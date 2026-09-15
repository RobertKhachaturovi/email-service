import { Controller, Post, Body } from '@nestjs/common';
import { EmailPreviewService } from './email-preview.service';
import { CreateEmailPreviewDto } from './dto/create-email-preview.dto';

@Controller('email-preview')
export class EmailPreviewController {
  constructor(private readonly emailPreviewService: EmailPreviewService) {}

  @Post()
  generatePreview(@Body() createEmailPreviewDto: CreateEmailPreviewDto) {
    return this.emailPreviewService.generatePreview(createEmailPreviewDto);
  }
}
