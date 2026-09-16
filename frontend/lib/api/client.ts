import { ApiError, extractBackendMessage, buildFriendlyErrorMessage } from './errors';

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export class ApiClient {
  private get baseUrl(): string {
    return getApiBaseUrl();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...restOptions } = options;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, buildFriendlyErrorMessage(0), undefined);
    }

    if (!response.ok) {
      let backendMessage: string | undefined;
      try {
        const errorJson = await response.json();
        backendMessage = extractBackendMessage(errorJson);
      } catch {
        // Response body was not JSON or was empty
      }

      const friendlyMsg = buildFriendlyErrorMessage(response.status, backendMessage);
      throw new ApiError(response.status, friendlyMsg, backendMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    let jsonResult: unknown;
    try {
      jsonResult = await response.json();
    } catch {
      return {} as T;
    }

    if (jsonResult !== null && typeof jsonResult === 'object' && 'data' in jsonResult) {
      return (jsonResult as { data: T }).data;
    }

    return jsonResult as T;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
