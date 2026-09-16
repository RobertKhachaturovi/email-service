import { Test, TestingModule } from '@nestjs/testing';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { BadRequestException } from '@nestjs/common';

describe('GmailController', () => {
  let controller: GmailController;

  const mockGmailService = {
    getAuthUrl: jest.fn(),
    handleCallback: jest.fn(),
    getStatus: jest.fn(),
    revokeConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GmailController],
      providers: [{ provide: GmailService, useValue: mockGmailService }],
    }).compile();

    controller = module.get<GmailController>(GmailController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('connect', () => {
    it('should return authUrl when json option is true', () => {
      mockGmailService.getAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/auth?...');

      const result = controller.connect('true', undefined);

      expect(mockGmailService.getAuthUrl).toHaveBeenCalledWith('default-user');
      expect(result).toEqual({ url: 'https://accounts.google.com/o/oauth2/auth?...' });
    });

    it('should redirect when res response object is provided', () => {
      mockGmailService.getAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/auth?...');
      const mockRes = { redirect: jest.fn() } as any;

      controller.connect(undefined, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth?...');
    });
  });

  describe('callback', () => {
    it('should throw BadRequestException if Google returns error query parameter', async () => {
      await expect(
        controller.callback('code', 'state', 'access_denied'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delegate code handling to service', async () => {
      mockGmailService.handleCallback.mockResolvedValue({
        success: true,
        email: 'user@gmail.com',
      });

      const result = await controller.callback('auth-code', 'state-val', undefined);

      expect(mockGmailService.handleCallback).toHaveBeenCalledWith('auth-code', 'state-val');
      expect(result).toEqual({ success: true, email: 'user@gmail.com' });
    });
  });

  describe('getStatus', () => {
    it('should delegate status check with default-user ID', async () => {
      mockGmailService.getStatus.mockResolvedValue({ connected: true, email: 'test@gmail.com' });

      const result = await controller.getStatus();

      expect(mockGmailService.getStatus).toHaveBeenCalledWith('default-user');
      expect(result).toEqual({ connected: true, email: 'test@gmail.com' });
    });
  });

  describe('disconnect', () => {
    it('should delegate connection revocation with default-user ID', async () => {
      mockGmailService.revokeConnection.mockResolvedValue({ success: true, message: 'Revoked' });

      const result = await controller.disconnect();

      expect(mockGmailService.revokeConnection).toHaveBeenCalledWith('default-user');
      expect(result).toEqual({ success: true, message: 'Revoked' });
    });
  });
});
