export { apiClient, ApiClient, getApiBaseUrl } from './client';
export type { RequestOptions } from './client';
export { ApiError, extractBackendMessage, buildFriendlyErrorMessage } from './errors';
export {
  getGmailStatus,
  getGmailConnectUrl,
  connectGmail,
  disconnectGmail,
  getCandidates,
  getEmailTemplates,
  previewEmail,
  sendEmail,
} from './endpoints';
export type * from '../../types/api';
