import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Job Opportunity',
    subject: 'Opportunity for {{firstName}} - {{projectTitle}}',
    body: 'Hi {{firstName}},\n\nWe would love to discuss {{projectTitle}} role.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    emailTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmailTemplatesService>(EmailTemplatesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return wrapped array of email templates', async () => {
      mockPrisma.emailTemplate.findMany.mockResolvedValue([mockTemplate]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [mockTemplate] });
      expect(mockPrisma.emailTemplate.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a template wrapped in data when found', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.findOne('tmpl-1');

      expect(result).toEqual({ data: mockTemplate });
    });

    it('should throw NotFoundException when template is missing', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return template with verbatim variables', async () => {
      const dto = {
        name: 'Job Opportunity',
        subject: 'Opportunity for {{firstName}} - {{projectTitle}}',
        body: 'Hi {{firstName}},\n\nWe would love to discuss {{projectTitle}} role.',
      };
      mockPrisma.emailTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.create(dto);

      expect(result).toEqual(mockTemplate);
      expect(result.subject).toContain('{{firstName}}');
      expect(result.body).toContain('{{projectTitle}}');
    });

    it('should throw ConflictException on duplicate template name', async () => {
      const dto = {
        name: 'Job Opportunity',
        subject: 'Subject',
        body: 'Body',
      };
      mockPrisma.emailTemplate.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update template successfully keeping variables verbatim', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.emailTemplate.update.mockResolvedValue({
        ...mockTemplate,
        subject: 'Updated: {{firstName}}',
      });

      const result = await service.update('tmpl-1', {
        subject: 'Updated: {{firstName}}',
      });

      expect(result.subject).toBe('Updated: {{firstName}}');
    });

    it('should throw NotFoundException if template to update does not exist', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete template successfully', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.emailTemplate.delete.mockResolvedValue(mockTemplate);

      const result = await service.remove('tmpl-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if template to delete is missing', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
