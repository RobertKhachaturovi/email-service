import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailPreviewService } from './email-preview.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmailPreviewService', () => {
  let service: EmailPreviewService;

  const mockCandidate = {
    id: 'cand-123',
    firstName: 'Anna',
    lastName: 'Ivanova',
    fullName: 'Anna Ivanova',
    email: 'anna@example.com',
    projectTitle: 'Frontend Developer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: 'tmpl-456',
    name: 'Job Offer',
    subject: 'Opportunity for {{firstName}} - {{projectTitle}}',
    body: 'Привет, {{firstName}}! Position: {{projectTitle}}. Email: {{email}}. Unknown: {{unknownVar}}.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    candidate: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailTemplate: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailPreviewService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmailPreviewService>(EmailPreviewService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePreview', () => {
    it('should render known variables correctly and report missing variables', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);

      const dto = { candidateId: 'cand-123', templateId: 'tmpl-456' };
      const result = await service.generatePreview(dto);

      expect(result.subject).toBe('Opportunity for Anna - Frontend Developer');
      expect(result.body).toBe(
        'Привет, Anna! Position: Frontend Developer. Email: anna@example.com. Unknown: {{unknownVar}}.',
      );
      expect(result.missingVariables).toEqual(['unknownVar']);

      // Verify no DB mutations occurred
      expect(mockPrisma.candidate.update).not.toHaveBeenCalled();
      expect(mockPrisma.emailTemplate.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if candidate is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(null);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);

      const dto = { candidateId: 'invalid-cand', templateId: 'tmpl-456' };
      await expect(service.generatePreview(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if template is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      const dto = { candidateId: 'cand-123', templateId: 'invalid-tmpl' };
      await expect(service.generatePreview(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
