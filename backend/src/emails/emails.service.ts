import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { EmailPreviewService } from '../email-preview/email-preview.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailStatus } from '@prisma/client';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailPreviewService: EmailPreviewService,
  ) {}

  private getOAuth2Client(accessToken: string, refreshToken?: string | null, tokenType?: string | null, expiryDate?: bigint | null) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/gmail/callback';

    if (!clientId || !clientSecret || clientId.includes('placeholder')) {
      throw new InternalServerErrorException(
        'Google OAuth credentials are not configured in environment variables',
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      token_type: tokenType || 'Bearer',
      expiry_date: expiryDate ? Number(expiryDate) : undefined,
    });

    return oauth2Client;
  }

  async sendEmail(dto: SendEmailDto, userId: string = 'default-user') {
    // 1. Find Candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });
    if (!candidate) {
      throw new NotFoundException(
        `Candidate with ID "${dto.candidateId}" not found`,
      );
    }

    // 2. Find EmailTemplate
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template) {
      throw new NotFoundException(
        `Email template with ID "${dto.templateId}" not found`,
      );
    }

    // 3. Find connected Gmail account
    const connection = await this.prisma.gmailConnection.findUnique({
      where: { userId },
    });
    if (!connection || !connection.accessToken) {
      throw new BadRequestException('Gmail account is not connected');
    }

    // 4. Render template using EmailPreviewService
    const preview = await this.emailPreviewService.generatePreview(
      dto.templateId,
      dto.candidateId,
    );

    if (!preview.ready || preview.missingVariables.length > 0) {
      throw new BadRequestException(
        `Template contains missing or unsupported variables: ${preview.missingVariables.join(', ')}`,
      );
    }

    // 5. Construct MIME message
    const messageParts = [
      `From: ${connection.email}`,
      `To: ${candidate.email}`,
      `Subject: ${preview.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      preview.body,
    ];
    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 6. Send email via Gmail API
    const oauth2Client = this.getOAuth2Client(
      connection.accessToken,
      connection.refreshToken,
      connection.tokenType,
      connection.expiryDate,
    );
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let providerMessageId: string | null = null;
    let sendError: any = null;

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });
      providerMessageId = response.data.id || null;
    } catch (err: any) {
      sendError = err;
    }

    // 7. Handle Gmail API failure
    if (sendError || !providerMessageId) {
      const safeErrorMessage = sendError?.message || 'Failed to send email via Gmail API';
      
      try {
        await this.prisma.sentEmail.create({
          data: {
            candidateId: candidate.id,
            templateId: template.id,
            fromEmail: connection.email,
            toEmail: candidate.email,
            subject: preview.subject,
            body: preview.body,
            status: EmailStatus.FAILED,
            providerMessageId: null,
            errorMessage: safeErrorMessage,
          },
        });
      } catch (dbError) {
        this.logger.error('Failed to persist FAILED email status to database', dbError);
      }

      throw new BadRequestException(
        `Failed to send email via Gmail: ${safeErrorMessage}`,
      );
    }

    // 8. Handle Gmail API success & DB persistence
    try {
      const sentEmail = await this.prisma.sentEmail.create({
        data: {
          candidateId: candidate.id,
          templateId: template.id,
          fromEmail: connection.email,
          toEmail: candidate.email,
          subject: preview.subject,
          body: preview.body,
          status: EmailStatus.SENT,
          providerMessageId,
          errorMessage: null,
        },
      });

      return {
        data: {
          id: sentEmail.id,
          status: sentEmail.status,
          providerMessageId: sentEmail.providerMessageId,
          fromEmail: sentEmail.fromEmail,
          toEmail: sentEmail.toEmail,
          subject: sentEmail.subject,
        },
      };
    } catch (dbError: any) {
      this.logger.error(
        `Gmail send succeeded (Provider Message ID: ${providerMessageId}), but local DB save failed`,
        dbError,
      );

      throw new InternalServerErrorException(
        `Email sent successfully via Gmail (Message ID: ${providerMessageId}), but failed to save record to local database.`,
      );
    }
  }
}
