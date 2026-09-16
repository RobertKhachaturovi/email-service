export class ApiError extends Error {
  public readonly status: number;
  public readonly backendMessage?: string;

  constructor(status: number, message: string, backendMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.backendMessage = backendMessage;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function extractBackendMessage(errorData: unknown): string | undefined {
  if (!errorData || typeof errorData !== 'object') {
    return undefined;
  }

  const data = errorData as Record<string, unknown>;

  if (typeof data.message === 'string') {
    return data.message.split('\n')[0].trim();
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    const firstMsg = data.message[0];
    if (typeof firstMsg === 'string') {
      return firstMsg.split('\n')[0].trim();
    }
  }

  if (typeof data.error === 'string') {
    return data.error.split('\n')[0].trim();
  }

  return undefined;
}

export function buildFriendlyErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) {
    return backendMessage;
  }

  switch (status) {
    case 400:
      return 'Bad request: invalid input provided.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict: resource already exists or state is invalid.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 0:
      return 'Network error: failed to connect to server.';
    default:
      return `Unexpected error (status ${status}).`;
  }
}
