import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  @Get()
  findAll() {
    return this.emailTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailTemplatesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateEmailTemplateDto) {
    return this.emailTemplatesService.create(createDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailTemplatesService.remove(id);
  }
}
