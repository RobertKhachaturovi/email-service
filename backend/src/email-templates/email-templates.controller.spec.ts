import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesController', () => {
  let controller: EmailTemplatesController;

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Job Opportunity',
    subject: 'Opportunity for {{firstName}}',
    body: 'Hi {{firstName}}',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue({ data: [mockTemplate] }),
    findOne: jest.fn().mockResolvedValue({ data: mockTemplate }),
    create: jest.fn().mockResolvedValue(mockTemplate),
    update: jest.fn().mockResolvedValue({ ...mockTemplate, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailTemplatesController],
      providers: [
        { provide: EmailTemplatesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<EmailTemplatesController>(EmailTemplatesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all email templates wrapped in data', async () => {
      mockService.findAll.mockResolvedValue({ data: [mockTemplate] });
      const result = await controller.findAll();
      expect(result).toEqual({ data: [mockTemplate] });
    });
  });

  describe('findOne', () => {
    it('should return a template wrapped in data by id', async () => {
      mockService.findOne.mockResolvedValue({ data: mockTemplate });
      const result = await controller.findOne('tmpl-1');
      expect(result).toEqual({ data: mockTemplate });
    });
  });

  describe('create', () => {
    it('should create an email template', async () => {
      const dto = {
        name: 'Job Opportunity',
        subject: 'Opportunity for {{firstName}}',
        body: 'Hi {{firstName}}',
      };
      mockService.create.mockResolvedValue(mockTemplate);
      const result = await controller.create(dto);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('update', () => {
    it('should update an email template', async () => {
      mockService.update.mockResolvedValue({ ...mockTemplate, name: 'Updated' });
      const result = await controller.update('tmpl-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete an email template', async () => {
      mockService.remove.mockResolvedValue({ success: true, message: 'Deleted' });
      const result = await controller.remove('tmpl-1');
      expect(result).toEqual({ success: true, message: 'Deleted' });
    });
  });
});
