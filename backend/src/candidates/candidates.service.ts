import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const candidates = await this.prisma.candidate.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        projectTitle: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: candidates };
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID "${id}" not found`);
    }

    return { data: candidate };
  }

  async create(createCandidateDto: CreateCandidateDto) {
    try {
      return await this.prisma.candidate.create({
        data: createCandidateDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Candidate with this email already exists');
      }
      throw new InternalServerErrorException('Failed to create candidate');
    }
  }

  async update(id: string, updateCandidateDto: UpdateCandidateDto) {
    await this.findOne(id);

    try {
      return await this.prisma.candidate.update({
        where: { id },
        data: updateCandidateDto,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Candidate with this email already exists');
      }
      throw new InternalServerErrorException('Failed to update candidate');
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.candidate.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Candidate with ID "${id}" deleted successfully`,
    };
  }
}
