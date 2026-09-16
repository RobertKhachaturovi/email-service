import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { GmailService } from './gmail.service';

const DEFAULT_USER_ID = 'default-user';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('connect')
  connect(
    @Query('json') json?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const authUrl = this.gmailService.getAuthUrl(DEFAULT_USER_ID);

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
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }
    return this.gmailService.handleCallback(code, state);
  }

  @Get('status')
  async getStatus() {
    return this.gmailService.getStatus(DEFAULT_USER_ID);
  }

  @Delete('connection')
  async disconnect() {
    return this.gmailService.revokeConnection(DEFAULT_USER_ID);
  }
}
