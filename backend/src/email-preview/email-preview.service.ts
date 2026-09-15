import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailPreviewService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePreview(templateId: string, candidateId: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Email template with ID "${templateId}" not found`,
      );
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with ID "${candidateId}" not found`,
      );
    }

    const effectiveFirstName =
      candidate.firstName && candidate.firstName.trim() !== ''
        ? candidate.firstName
        : candidate.fullName && candidate.fullName.trim() !== ''
          ? candidate.fullName.trim().split(/\s+/)[0]
          : undefined;

    const variableMap: Record<string, string | undefined> = {
      firstName: effectiveFirstName,
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
    const missingVariables = Array.from(missingVariablesSet);

    return {
      subject: renderedSubject,
      body: renderedBody,
      ready: missingVariables.length === 0,
      missingVariables,
    };
  }
}
