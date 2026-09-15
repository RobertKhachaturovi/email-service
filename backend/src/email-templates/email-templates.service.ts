import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: templates };
  }

  async findOne(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Email template with ID "${id}" not found`);
    }

    return { data: template };
  }

  async create(createDto: CreateEmailTemplateDto) {
    try {
      return await this.prisma.emailTemplate.create({
        data: createDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email template with this name already exists');
      }
      throw new InternalServerErrorException('Failed to create email template');
    }
  }

  async update(id: string, updateDto: UpdateEmailTemplateDto) {
    await this.findOne(id);

    try {
      return await this.prisma.emailTemplate.update({
        where: { id },
        data: updateDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email template with this name already exists');
      }
      throw new InternalServerErrorException('Failed to update email template');
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Email template with ID "${id}" deleted successfully`,
    };
  }
}
