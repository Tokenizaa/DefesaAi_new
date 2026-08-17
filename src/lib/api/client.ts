import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

/**
 * API Client - Centralized fetch wrapper with auth, error handling, retries, and timeouts.
 */
class ApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  private timeoutSeconds: number = 10;

  constructor(baseUrl: string = '', maxRetries: number = 3, timeoutSeconds: number = 10) {
    // If baseUrl is empty, use relative URL (same origin)
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.maxRetries = maxRetries;
    this.timeoutSeconds = timeoutSeconds;
  }

  /**
   * Perform a fetch request with retry logic and timeout.
   * @param endpoint API endpoint (e.g., '/settings')
   * @param options Fetch options (method, headers, body, etc.)
   * @returns Parsed JSON response
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, this.timeoutSeconds * 1000);

        // Prepare headers
        const headers = new Headers(options.headers);
        
        // Add auth token if available
        const token = await this.getAuthToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        // Ensure JSON content type for POST/PUT/PATCH with body
        if (options.body && !(options.body instanceof FormData)) {
          if (typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
            headers.set('Content-Type', 'application/json');
          }
        }

        const response = await fetch(url, {
          ...options,
          headers,
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        // If response is not OK, throw error with parsed JSON or text
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          } catch (e) {
            errorMessage = await response.text() || errorMessage;
          }
          throw new Error(errorMessage);
        }

// Parse JSON response
         const contentType = response.headers.get('content-type');
         if (!contentType || !contentType.includes('application/json')) {
           throw new Error('Expected JSON response');
         }
         return await response.json();
      } catch (error: any) {
        lastError = error;
        // If it's a timeout or network error and we have retries left, wait and retry
        if (attempt < this.maxRetries && 
            (error.name === 'AbortError' || 
             error.type === 'failed-to-fetch' ||
             error.message.includes('NetworkError'))) {
          // Wait for 2^attempt * 100ms before retrying
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        // If it's not a retryable error or we've exhausted retries, break
        break;
      }
    }

    // If we got here, all retries failed
    throw lastError;
  }

  /**
   * Get auth token from Supabase session.
   * Returns token string or null if not available.
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (!supabase) {
        return null;
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch (error) {
      console.warn('Failed to get auth token from Supabase:', error);
      return null;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data 
    });
  }

  async patch<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: data 
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export a default instance configured for relative URLs (same origin)
export const api = new ApiClient('');

// Export the class for custom instances if needed
export type { ApiClient };