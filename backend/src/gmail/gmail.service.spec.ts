import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';

jest.mock('googleapis', () => {
  const mOAuth2Client = {
    generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth'),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
    revokeToken: jest.fn(),
  };
  const mOAuth2 = {
    userinfo: {
      get: jest.fn(),
    },
  };

  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => mOAuth2Client),
      },
      oauth2: jest.fn().mockReturnValue(mOAuth2),
    },
  };
});

describe('GmailService', () => {
  let service: GmailService;

  const mockPrisma = {
    gmailConnection: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/gmail/callback';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GmailService>(GmailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate Google OAuth URL with proper scopes and state', () => {
      const url = service.getAuthUrl('default-user');
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth');
    });
  });

  describe('handleCallback', () => {
    it('should throw BadRequestException if authorization code is missing', async () => {
      await expect(service.handleCallback('')).rejects.toThrow(BadRequestException);
    });

    it('should exchange code for tokens, fetch email, upsert connection, and return safe payload', async () => {
      const mockOAuth2Client = new google.auth.OAuth2();
      (mockOAuth2Client.getToken as jest.Mock).mockResolvedValue({
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          expiry_date: 1700000000,
        },
      });

      const mockOAuth2Api = google.oauth2({ version: 'v2' });
      (mockOAuth2Api.userinfo.get as jest.Mock).mockResolvedValue({
        data: { email: 'test@example.com' },
      });

      mockPrisma.gmailConnection.upsert.mockResolvedValue({
        userId: 'default-user',
        email: 'test@example.com',
      });

      const result = await service.handleCallback('valid-code');

      expect(result).toEqual({
        success: true,
        message: 'Gmail account connected successfully',
        email: 'test@example.com',
      });
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('getStatus', () => {
    it('should return connected: false when no Gmail connection exists', async () => {
      mockPrisma.gmailConnection.findUnique.mockResolvedValue(null);

      const result = await service.getStatus('default-user');

      expect(result).toEqual({ connected: false });
    });

    it('should return connected: true and email when connection exists', async () => {
      const now = new Date();
      mockPrisma.gmailConnection.findUnique.mockResolvedValue({
        email: 'user@example.com',
        createdAt: now,
      });

      const result = await service.getStatus('default-user');

      expect(result).toEqual({
        connected: true,
        email: 'user@example.com',
        connectedAt: now,
      });
    });
  });

  describe('revokeConnection', () => {
    it('should revoke tokens and delete record from database', async () => {
      mockPrisma.gmailConnection.findUnique.mockResolvedValue({
        userId: 'default-user',
        email: 'user@example.com',
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
      });
      mockPrisma.gmailConnection.delete.mockResolvedValue({});

      const result = await service.revokeConnection('default-user');

      expect(mockPrisma.gmailConnection.delete).toHaveBeenCalledWith({
        where: { userId: 'default-user' },
      });
      expect(result.success).toBe(true);
    });
  });
});
