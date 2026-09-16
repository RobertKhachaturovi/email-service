import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const mockCandidate = {
    id: 'cand-1',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    email: 'test@example.com',
    projectTitle: 'Developer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    candidate: {
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
        CandidatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return wrapped array of candidates', async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([mockCandidate]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [mockCandidate] });
      expect(mockPrisma.candidate.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a candidate wrapped in data when found', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);

      const result = await service.findOne('cand-1');

      expect(result).toEqual({ data: mockCandidate });
    });

    it('should throw NotFoundException when candidate is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new candidate', async () => {
      const dto = {
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'test@example.com',
        projectTitle: 'Developer',
      };
      mockPrisma.candidate.create.mockResolvedValue(mockCandidate);

      const result = await service.create(dto);

      expect(result).toEqual(mockCandidate);
    });

    it('should throw ConflictException on duplicate email', async () => {
      const dto = {
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'test@example.com',
        projectTitle: 'Developer',
      };
      mockPrisma.candidate.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update candidate successfully', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.candidate.update.mockResolvedValue({
        ...mockCandidate,
        projectTitle: 'Lead Developer',
      });

      const result = await service.update('cand-1', {
        projectTitle: 'Lead Developer',
      });

      expect(result.projectTitle).toBe('Lead Developer');
    });
  });

  describe('remove', () => {
    it('should delete candidate successfully', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.candidate.delete.mockResolvedValue(mockCandidate);

      const result = await service.remove('cand-1');

      expect(result.success).toBe(true);
    });
  });
});
