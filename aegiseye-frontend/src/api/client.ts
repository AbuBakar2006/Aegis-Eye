/**
 * AegisEye API Client
 * Central HTTP client — all backend communication goes through here.
 * Base URL is configured via VITE_API_BASE_URL environment variable.
 * NEVER hardcode the backend URL.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export { API_BASE_URL };

export class ApiClientError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiClientError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      details
    );
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  async getBlob(path: string): Promise<Blob> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new ApiClientError(
        `Download failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }
    return response.blob();
  },

  // Build a direct URL for browser-handled downloads/streams
  buildUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
  },

  // Test if the backend is reachable
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok || response.status < 500;
    } catch {
      return false;
    }
  },
};
