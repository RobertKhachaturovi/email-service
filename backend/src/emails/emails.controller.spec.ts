import { Test, TestingModule } from '@nestjs/testing';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

describe('EmailsController', () => {
  let controller: EmailsController;

  const mockEmailsService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsController],
      providers: [{ provide: EmailsService, useValue: mockEmailsService }],
    }).compile();

    controller = module.get<EmailsController>(EmailsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should delegate sendEmail call to service with default-user ID', async () => {
      const dto = { candidateId: 'cand-1', templateId: 'tmpl-1' };
      const mockResult = {
        data: {
          id: 'sent-1',
          status: 'SENT',
          providerMessageId: 'msg-123',
          fromEmail: 'recruiter@example.com',
          toEmail: 'anna@example.com',
          subject: 'Offer',
        },
      };
      mockEmailsService.sendEmail.mockResolvedValue(mockResult);

      const result = await controller.sendEmail(dto);

      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith(dto, 'default-user');
      expect(result).toBe(mockResult);
    });
  });
});
