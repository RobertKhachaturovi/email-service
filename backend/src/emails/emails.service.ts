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
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });
    if (!candidate) {
      throw new NotFoundException(
        `Candidate with ID "${dto.candidateId}" not found`,
      );
    }

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template) {
      throw new NotFoundException(
        `Email template with ID "${dto.templateId}" not found`,
      );
    }

    const connection = await this.prisma.gmailConnection.findUnique({
      where: { userId },
    });
    if (!connection || !connection.accessToken) {
      throw new BadRequestException('Gmail account is not connected');
    }

    const preview = await this.emailPreviewService.generatePreview(
      dto.templateId,
      dto.candidateId,
    );

    if (!preview.ready || preview.missingVariables.length > 0) {
      throw new BadRequestException(
        `Template contains missing or unsupported variables: ${preview.missingVariables.join(', ')}`,
      );
    }

    const isNonAsciiSubject = /[^\x00-\x7F]/.test(preview.subject);
    const mimeSubject = isNonAsciiSubject
      ? `=?utf-8?B?${Buffer.from(preview.subject, 'utf-8').toString('base64')}?=`
      : preview.subject;

    const messageParts = [
      `From: ${connection.email}`,
      `To: ${candidate.email}`,
      `Subject: ${mimeSubject}`,
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

  async getEmailHistory(userId: string = 'default-user') {
    const sentEmails = await this.prisma.sentEmail.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        candidate: true,
        template: true,
      },
    });

    return {
      data: sentEmails.map((email) => ({
        id: email.id,
        toEmail: email.toEmail,
        recipientName:
          email.candidate?.fullName ||
          `${email.candidate?.firstName ?? ''} ${email.candidate?.lastName ?? ''}`.trim() ||
          undefined,
        templateName: email.template?.name || undefined,
        subject: email.subject,
        status: email.status,
        createdAt: email.createdAt,
        providerMessageId: email.providerMessageId,
      })),
    };
  }
}

