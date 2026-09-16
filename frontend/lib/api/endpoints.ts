import { apiClient, getApiBaseUrl } from './client';
import type {
  GmailStatus,
  Candidate,
  EmailTemplate,
  EmailPreview,
  SentEmail,
  DisconnectGmailResponse,
} from '../../types/api';

export async function getGmailStatus(): Promise<GmailStatus> {
  return apiClient.get<GmailStatus>('/gmail/status');
}

export function getGmailConnectUrl(): string {
  return `${getApiBaseUrl()}/gmail/connect`;
}

export function connectGmail(): void {
  if (typeof window !== 'undefined') {
    window.location.href = getGmailConnectUrl();
  }
}

export async function disconnectGmail(): Promise<DisconnectGmailResponse> {
  return apiClient.delete<DisconnectGmailResponse>('/gmail/connection');
}

export async function getCandidates(): Promise<Candidate[]> {
  return apiClient.get<Candidate[]>('/candidates');
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return apiClient.get<EmailTemplate[]>('/email-templates');
}

export async function previewEmail(
  candidateId: string,
  templateId: string,
): Promise<EmailPreview> {
  return apiClient.post<EmailPreview>(`/email-templates/${templateId}/preview`, {
    candidateId,
  });
}

export async function sendEmail(
  candidateId: string,
  templateId: string,
): Promise<SentEmail> {
  return apiClient.post<SentEmail>('/emails/send', {
    candidateId,
    templateId,
  });
}

export async function getEmailHistory(): Promise<SentEmail[]> {
  return apiClient.get<SentEmail[]>('/emails');
}

