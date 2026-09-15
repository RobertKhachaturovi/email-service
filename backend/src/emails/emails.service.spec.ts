import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailPreviewService } from '../email-preview/email-preview.service';
import { EmailStatus } from '@prisma/client';
import { google } from 'googleapis';

jest.mock('googleapis', () => {
  const mGmail = {
    users: {
      messages: {
        send: jest.fn(),
      },
    },
  };
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
      gmail: jest.fn().mockReturnValue(mGmail),
    },
  };
});

describe('EmailsService', () => {
  let service: EmailsService;

  const mockCandidate = {
    id: 'cand-1',
    firstName: 'Anna',
    lastName: 'Ivanova',
    fullName: 'Anna Ivanova',
    email: 'anna@example.com',
    projectTitle: 'Frontend Developer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Offer Template',
    subject: 'Offer for {{firstName}}',
    body: 'Hello {{firstName}}',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConnection = {
    id: 'conn-1',
    userId: 'default-user',
    email: 'recruiter@example.com',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiryDate: BigInt(1700000000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    candidate: {
      findUnique: jest.fn(),
    },
    emailTemplate: {
      findUnique: jest.fn(),
    },
    gmailConnection: {
      findUnique: jest.fn(),
    },
    sentEmail: {
      create: jest.fn(),
    },
  };

  const mockEmailPreviewService = {
    generatePreview: jest.fn(),
  };

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/gmail/callback';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailPreviewService, useValue: mockEmailPreviewService },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should throw NotFoundException if candidate is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.sendEmail({ candidateId: 'cand-missing', templateId: 'tmpl-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if template is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.sendEmail({ candidateId: 'cand-1', templateId: 'tmpl-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if Gmail connection is missing', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(null);

      await expect(
        service.sendEmail({ candidateId: 'cand-1', templateId: 'tmpl-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if preview has missing/unsupported variables', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(mockConnection);
      mockEmailPreviewService.generatePreview.mockResolvedValue({
        subject: 'Offer for Anna',
        body: 'Hello {{unknownVar}}',
        missingVariables: ['unknownVar'],
        ready: false,
      });

      await expect(
        service.sendEmail({ candidateId: 'cand-1', templateId: 'tmpl-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully send email and return saved record data', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(mockConnection);
      mockEmailPreviewService.generatePreview.mockResolvedValue({
        subject: 'Offer for Anna',
        body: 'Hello Anna',
        missingVariables: [],
        ready: true,
      });

      const sendMock = jest.fn().mockResolvedValue({
        data: { id: 'msg-12345' },
      });
      (google.gmail as jest.Mock).mockReturnValue({
        users: { messages: { send: sendMock } },
      });

      mockPrisma.sentEmail.create.mockResolvedValue({
        id: 'sent-1',
        candidateId: mockCandidate.id,
        templateId: mockTemplate.id,
        fromEmail: mockConnection.email,
        toEmail: mockCandidate.email,
        subject: 'Offer for Anna',
        body: 'Hello Anna',
        status: EmailStatus.SENT,
        providerMessageId: 'msg-12345',
        errorMessage: null,
      });

      const result = await service.sendEmail({
        candidateId: 'cand-1',
        templateId: 'tmpl-1',
      });

      expect(sendMock).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: expect.objectContaining({ raw: expect.any(String) }),
      });
      expect(mockPrisma.sentEmail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: EmailStatus.SENT,
          providerMessageId: 'msg-12345',
        }),
      });
      expect(result).toEqual({
        data: {
          id: 'sent-1',
          status: EmailStatus.SENT,
          providerMessageId: 'msg-12345',
          fromEmail: mockConnection.email,
          toEmail: mockCandidate.email,
          subject: 'Offer for Anna',
        },
      });
    });

    it('should record FAILED status in DB and throw BadRequestException when Gmail API fails', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(mockConnection);
      mockEmailPreviewService.generatePreview.mockResolvedValue({
        subject: 'Offer for Anna',
        body: 'Hello Anna',
        missingVariables: [],
        ready: true,
      });

      const sendMock = jest.fn().mockRejectedValue(new Error('Quota exceeded'));
      (google.gmail as jest.Mock).mockReturnValue({
        users: { messages: { send: sendMock } },
      });

      await expect(
        service.sendEmail({ candidateId: 'cand-1', templateId: 'tmpl-1' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.sentEmail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: EmailStatus.FAILED,
          errorMessage: 'Quota exceeded',
        }),
      });
    });

    it('should throw InternalServerErrorException when Gmail API succeeds but DB save fails', async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(mockConnection);
      mockEmailPreviewService.generatePreview.mockResolvedValue({
        subject: 'Offer for Anna',
        body: 'Hello Anna',
        missingVariables: [],
        ready: true,
      });

      const sendMock = jest.fn().mockResolvedValue({
        data: { id: 'msg-99999' },
      });
      (google.gmail as jest.Mock).mockReturnValue({
        users: { messages: { send: sendMock } },
      });

      mockPrisma.sentEmail.create.mockRejectedValue(new Error('DB connection error'));

      await expect(
        service.sendEmail({ candidateId: 'cand-1', templateId: 'tmpl-1' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
