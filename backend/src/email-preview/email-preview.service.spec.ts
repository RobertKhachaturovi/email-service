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

  const mockCandidateNoFirstName = {
    id: 'cand-456',
    firstName: '',
    lastName: 'Sidorova',
    fullName: 'Maria Sidorova',
    email: 'maria@example.com',
    projectTitle: 'Backend Developer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCandidateNoNameAtAll = {
    id: 'cand-789',
    firstName: '',
    lastName: '',
    fullName: '',
    email: 'noname@example.com',
    projectTitle: 'QA Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: 'tmpl-456',
    name: 'Job Offer',
    subject: 'Opportunity for {{firstName}} - {{projectTitle}}',
    body: 'Привет, {{firstName}}! Position: {{projectTitle}}.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplateWithMissing = {
    id: 'tmpl-789',
    name: 'Job Offer Unknown',
    subject: 'Opportunity for {{firstName}}',
    body: 'Hi {{firstName}}, check {{unknownVar}}.',
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
    it('should render known variables correctly and return ready: true when no variables missing', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);

      const result = await service.generatePreview('tmpl-456', 'cand-123');

      expect(result.subject).toBe('Opportunity for Anna - Frontend Developer');
      expect(result.body).toBe(
        'Привет, Anna! Position: Frontend Developer.',
      );
      expect(result.ready).toBe(true);
      expect(result.missingVariables).toEqual([]);
      expect(mockPrisma.candidate.update).not.toHaveBeenCalled();
    });

    it('should fallback to first word of fullName when firstName is empty', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidateNoFirstName);

      const result = await service.generatePreview('tmpl-456', 'cand-456');

      expect(result.subject).toBe('Opportunity for Maria - Backend Developer');
      expect(result.body).toBe('Привет, Maria! Position: Backend Developer.');
      expect(result.ready).toBe(true);
      expect(result.missingVariables).toEqual([]);
    });

    it('should report missingVariables and ready: false when unmapped variable is present', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplateWithMissing);
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);

      const result = await service.generatePreview('tmpl-789', 'cand-123');

      expect(result.subject).toBe('Opportunity for Anna');
      expect(result.body).toBe('Hi Anna, check {{unknownVar}}.');
      expect(result.ready).toBe(false);
      expect(result.missingVariables).toEqual(['unknownVar']);
    });

    it('should report firstName as missing only when both firstName and fullName are unavailable', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidateNoNameAtAll);

      const result = await service.generatePreview('tmpl-456', 'cand-789');

      expect(result.ready).toBe(false);
      expect(result.missingVariables).toContain('firstName');
    });

    it('should throw NotFoundException if template is missing', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePreview('invalid-tmpl', 'cand-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if candidate is missing', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePreview('tmpl-456', 'invalid-cand'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
