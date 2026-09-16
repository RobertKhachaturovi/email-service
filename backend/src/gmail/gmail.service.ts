import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_USER_ID = 'default-user';

@Injectable()
export class GmailService {
  constructor(private readonly prisma: PrismaService) {}

  private getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/gmail/callback';

    if (!clientId || !clientSecret || clientId.includes('placeholder')) {
      throw new InternalServerErrorException(
        'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in backend/.env',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  getAuthUrl(userId: string = DEFAULT_USER_ID): string {
    const oauth2Client = this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });
  }

  async handleCallback(code: string, stateUserId?: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is missing from callback query parameters');
    }

    const userId = stateUserId || DEFAULT_USER_ID;
    const oauth2Client = this.getOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email;

      if (!email) {
        throw new BadRequestException('Failed to retrieve email address from Google user profile');
      }

      const connection = await this.prisma.gmailConnection.upsert({
        where: { userId },
        update: {
          email,
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || undefined,
          tokenType: tokens.token_type || 'Bearer',
          scope: tokens.scope || undefined,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        },
        create: {
          userId,
          email,
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || null,
          tokenType: tokens.token_type || 'Bearer',
          scope: tokens.scope || null,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        },
      });

      return {
        success: true,
        message: 'Gmail account connected successfully',
        email: connection.email,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        `Failed to exchange Google authorization code: ${error.message || error}`,
      );
    }
  }

  async getStatus(userId: string = DEFAULT_USER_ID) {
    const connection = await this.prisma.gmailConnection.findUnique({
      where: { userId },
      select: {
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      email: connection.email,
      connectedAt: connection.createdAt,
    };
  }

  async revokeConnection(userId: string = DEFAULT_USER_ID) {
    const connection = await this.prisma.gmailConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return { success: true, message: 'No active Gmail connection found for user' };
    }

    if (connection.accessToken || connection.refreshToken) {
      try {
        const oauth2Client = this.getOAuth2Client();
        const tokenToRevoke = connection.refreshToken || connection.accessToken;
        await oauth2Client.revokeToken(tokenToRevoke);
      } catch (err) {
        // Silently handle token revocation errors on Google server if already revoked
      }
    }

    await this.prisma.gmailConnection.delete({
      where: { userId },
    });

    return { success: true, message: 'Gmail connection successfully revoked and removed' };
  }
}
