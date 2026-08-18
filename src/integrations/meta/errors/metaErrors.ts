import { MetaError } from '../types';

/**
 * Meta Error Classes - Specific error types for Meta integration
 */
export class MetaAuthError extends Error implements MetaError {
  constructor(message: string, public code?: string, public subcode?: number, public type?: string, public fbtrace_id?: string) {
    super(message);
    this.name = 'MetaAuthError';
    this.isTransient = false; // Auth errors are usually not transient
  }
}

export class MetaApiError extends Error implements MetaError {
  constructor(
    message: string, 
    public code?: string, 
    public subcode?: number, 
    public type?: string, 
    public isTransient: boolean = false,
    public fbtrace_id?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

export class MetaRateLimitError extends MetaApiError {
  constructor(message: string, public retryAfter: number = 0, public fbtrace_id?: string) {
    super(message, '4', undefined, undefined, true, fbtrace_id, retryAfter);
    this.name = 'MetaRateLimitError';
  }
}

export class MetaPermissionError extends MetaApiError {
  constructor(message: string, public fbtrace_id?: string) {
    super(message, '10', undefined, 'OAuthException', false, fbtrace_id);
    this.name = 'MetaPermissionError';
  }
}

export class MetaValidationError extends Error implements MetaError {
  constructor(message: string, public code?: string, public subcode?: number, public type?: string, public fbtrace_id?: string) {
    super(message);
    this.name = 'MetaValidationError';
    this.isTransient = false;
  }
}

/**
 * Error Factory - Creates appropriate error instances based on Meta API error responses
 */
export class MetaErrorFactory {
  /**
   * Create a Meta error from an API error response
   */
  static createFromApiResponse(errorResponse: any): Error {
    if (!errorResponse || typeof errorResponse !== 'object') {
      return new Error('Unknown Meta API error');
    }
    
    const errorData = errorResponse.error || errorResponse;
    const message = errorData.message || 'Unknown Meta API error';
    const code = errorData.code;
    const subcode = errorData.error_subcode;
    const type = errorData.type;
    const fbtrace_id = errorData.fbtrace_id;
    
    // Create base error
    const baseError = new MetaApiError(message, code, subcode, type, false, fbtrace_id);
    
    // Check for specific error types
    switch (code) {
      case '4': // Rate limiting
        return new MetaRateLimitError(
          message, 
          parseInt(errorData.error_user_msg?.match(/\((\d+)s?\)/)?.[1] || '0', 10) || 0,
          fbtrace_id
        );
      
      case '10': // Permission denied
        return new MetaPermissionError(message, fbtrace_id);
      
      case '190': // Invalid token
        return new MetaAuthError(
          message, 
          code, 
          subcode, 
          type, 
          fbtrace_id
        );
      
      case '100': // Invalid parameter
        return new MetaValidationError(
          message, 
          code, 
          subcode, 
          type, 
          fbtrace_id
        );
      
      case '17': // User request limit
        return new MetaRateLimitError(message, 0, fbtrace_id);
      
      case '613': // Calls to this field have exceeded the rate limit
        return new MetaRateLimitError(message, 0, fbtrace_id);
      
      case '80001': // Too many calls to this Page account
        return new MetaRateLimitError(message, 0, fbtrace_id);
      
      case '80002': // Too many calls to this ad account
        return new MetaRateLimitError(message, 0, fbtrace_id);
      
      default:
        // Check if it's a transient server error
        if (code && parseInt(code, 10) >= 500 && parseInt(code, 10) < 600) {
          return new MetaApiError(message, code, subcode, type, true, fbtrace_id);
        }
        return baseError;
    }
  }
  
  /**
   * Determine if an error is transient and safe to retry
   */
  static isTransientError(error: Error): boolean {
    if (error instanceof MetaApiError) {
      return error.isTransient;
    }
    if (error instanceof MetaRateLimitError) {
      return true;
    }
    if (error instanceof MetaAuthError) {
      return false; // Auth errors are not transient
    }
    return false;
  }
  
  /**
   * Get retry delay for transient errors (exponential backoff base)
   */
  static getRetryDelay(error: Error, attemptNumber: number = 0): number {
    const baseDelay = 1000; // 1 second base
    
    if (error instanceof MetaRateLimitError && (error as MetaRateLimitError).retryAfter > 0) {
      // Use the retry-after value from the error if provided
      return (error as MetaRateLimitError).retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff: baseDelay * 2^attemptNumber
    return baseDelay * Math.pow(2, attemptNumber);
  }
}