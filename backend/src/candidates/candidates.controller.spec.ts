import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

describe('CandidatesController', () => {
  let controller: CandidatesController;

  const mockCandidate = {
    id: 'cand-1',
    firstName: 'Alice',
    lastName: 'Smith',
    fullName: 'Alice Smith',
    email: 'alice.smith@example.com',
    projectTitle: 'Senior Frontend Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCandidatesService = {
    findAll: jest.fn().mockResolvedValue({ data: [mockCandidate] }),
    findOne: jest.fn().mockResolvedValue(mockCandidate),
    create: jest.fn().mockResolvedValue(mockCandidate),
    update: jest.fn().mockResolvedValue({ ...mockCandidate, projectTitle: 'Lead' }),
    remove: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        { provide: CandidatesService, useValue: mockCandidatesService },
      ],
    }).compile();

    controller = module.get<CandidatesController>(CandidatesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all candidates', async () => {
      mockCandidatesService.findAll.mockResolvedValue({ data: [mockCandidate] });
      const result = await controller.findAll();
      expect(result).toEqual({ data: [mockCandidate] });
    });
  });

  describe('findOne', () => {
    it('should return a candidate by id', async () => {
      mockCandidatesService.findOne.mockResolvedValue(mockCandidate);
      const result = await controller.findOne('cand-1');
      expect(result).toEqual(mockCandidate);
    });
  });

  describe('create', () => {
    it('should create a candidate', async () => {
      const dto = {
        firstName: 'Alice',
        lastName: 'Smith',
        fullName: 'Alice Smith',
        email: 'alice.smith@example.com',
        projectTitle: 'Senior Frontend Engineer',
      };
      mockCandidatesService.create.mockResolvedValue(mockCandidate);
      const result = await controller.create(dto);
      expect(result).toEqual(mockCandidate);
    });
  });

  describe('update', () => {
    it('should update a candidate', async () => {
      mockCandidatesService.update.mockResolvedValue({ ...mockCandidate, projectTitle: 'Lead' });
      const result = await controller.update('cand-1', { projectTitle: 'Lead' });
      expect(result.projectTitle).toBe('Lead');
    });
  });

  describe('remove', () => {
    it('should remove a candidate', async () => {
      mockCandidatesService.remove.mockResolvedValue({ success: true, message: 'Deleted' });
      const result = await controller.remove('cand-1');
      expect(result).toEqual({ success: true, message: 'Deleted' });
    });
  });
});
