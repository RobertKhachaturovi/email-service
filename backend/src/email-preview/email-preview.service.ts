import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailPreviewDto } from './dto/create-email-preview.dto';

@Injectable()
export class EmailPreviewService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePreview(dto: CreateEmailPreviewDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with ID "${dto.candidateId}" not found`,
      );
    }

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Email template with ID "${dto.templateId}" not found`,
      );
    }

    const variableMap: Record<string, string | undefined> = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      fullName: candidate.fullName,
      email: candidate.email,
      projectTitle: candidate.projectTitle,
    };

    const missingVariablesSet = new Set<string>();

    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, varName) => {
        const val = variableMap[varName];
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
        missingVariablesSet.add(varName);
        return match;
      });
    };

    const renderedSubject = replaceVariables(template.subject);
    const renderedBody = replaceVariables(template.body);

    return {
      subject: renderedSubject,
      body: renderedBody,
      missingVariables: Array.from(missingVariablesSet),
    };
  }
}
