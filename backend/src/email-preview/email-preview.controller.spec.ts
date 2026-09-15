import { Test, TestingModule } from '@nestjs/testing';
import { EmailPreviewController } from './email-preview.controller';
import { EmailPreviewService } from './email-preview.service';

describe('EmailPreviewController', () => {
  let controller: EmailPreviewController;

  const mockPreviewResult = {
    subject: 'Opportunity for Anna',
    body: 'Привет, Anna!',
    ready: true,
    missingVariables: [],
  };

  const mockService = {
    generatePreview: jest.fn().mockResolvedValue(mockPreviewResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailPreviewController],
      providers: [
        { provide: EmailPreviewService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<EmailPreviewController>(EmailPreviewController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generatePreview', () => {
    it('should delegate preview generation to service with templateId from param and candidateId from body', async () => {
      const templateId = 'tmpl-456';
      const dto = { candidateId: 'cand-123' };
      const result = await controller.generatePreview(templateId, dto);

      expect(result).toEqual(mockPreviewResult);
      expect(mockService.generatePreview).toHaveBeenCalledWith(
        templateId,
        dto.candidateId,
      );
    });
  });
});
