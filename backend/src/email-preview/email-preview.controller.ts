import { Controller, Post, Param, Body } from '@nestjs/common';
import { EmailPreviewService } from './email-preview.service';
import { PreviewEmailTemplateDto } from './dto/preview-email-template.dto';

@Controller('email-templates')
export class EmailPreviewController {
  constructor(private readonly emailPreviewService: EmailPreviewService) {}

  @Post(':id/preview')
  generatePreview(
    @Param('id') templateId: string,
    @Body() dto: PreviewEmailTemplateDto,
  ) {
    return this.emailPreviewService.generatePreview(
      templateId,
      dto.candidateId,
    );
  }
}
