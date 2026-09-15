import {
  Controller,
  Get,
  Delete,
  Query,
  Headers,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('connect')
  connect(
    @Query('userId') queryUserId?: string,
    @Query('json') json?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const userId = queryUserId || headerUserId || 'default-user';
    const authUrl = this.gmailService.getAuthUrl(userId);

    if (json === 'true') {
      return { url: authUrl };
    }

    if (res) {
      return res.redirect(authUrl);
    }

    return { url: authUrl };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }
    return this.gmailService.handleCallback(code, state);
  }

  @Get('status')
  async getStatus(
    @Query('userId') queryUserId?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = queryUserId || headerUserId || 'default-user';
    return this.gmailService.getStatus(userId);
  }

  @Delete('connection')
  async disconnect(
    @Query('userId') queryUserId?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = queryUserId || headerUserId || 'default-user';
    return this.gmailService.revokeConnection(userId);
  }
}
