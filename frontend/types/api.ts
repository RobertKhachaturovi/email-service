export interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  projectTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailPreview {
  subject: string;
  body: string;
  ready: boolean;
  missingVariables: string[];
}

export interface SentEmail {
  id: string;
  status: string;
  providerMessageId?: string | null;
  fromEmail: string;
  toEmail: string;
  subject: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface DisconnectGmailResponse {
  success: boolean;
  message: string;
}
