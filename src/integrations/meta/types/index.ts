// Meta Integration Types - Canonical Architecture
export interface MetaAppConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  apiVersion: string;
  scope: string[];
}

export interface MetaOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // seconds
  tokenType: string;
  scope: string;
  obtainedAt: number; // timestamp
}

export interface MetaUser {
  id: string;
  name: string;
  email?: string;
}

export interface MetaPage {
  id: string;
  name: string;
  category?: string;
  accessToken: string; // Page access token (long-lived)
  instagramBusinessAccount?: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
  };
}

export interface MetaConnectionState {
  isConnected: boolean;
  user?: MetaUser;
  pages: MetaPage[];
  selectedPageId?: string;
  selectedInstagramId?: string;
  tokenExpiresAt?: string; // ISO string
  connectedAt?: string; // ISO string
  lastRefreshedAt?: string; // ISO string
  error?: string;
}

export interface MetaPublishParams {
  destination: 'facebook' | 'instagram' | 'both';
  pageId?: string;
  instagramAccountId?: string;
  message: string;
  mediaUrl?: string;
  linkUrl?: string;
}

export interface MetaPublishResult {
  success: boolean;
  facebookPostId?: string;
  instagramMediaId?: string;
  publishedAt: string; // ISO string
  destination: 'facebook' | 'instagram' | 'both';
  error?: string;
}

export interface MetaInsightsParams {
  entityId: string; // Page ID or Instagram Account ID
  metric: string;
  period?: 'day' | 'week' | 'days_28' | 'month';
  since?: string; // ISO string
  until?: string; // ISO string
}

export interface MetaInsightsResult {
  success: boolean;
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      value: number | string;
      end_time: string; // ISO string
    }>;
    title?: string;
    description?: string;
    id?: string;
  }>;
  error?: string;
}

export interface MetaWebhookEvent {
  object: string; // 'page' or 'instagram'
  entry: Array<{
    id: string; // Page ID
    time: number; // timestamp
    // Page-specific fields
    messaging?: Array<any>;
    standby?: Array<any>;
    checkin_whitelists?: Array<any>;
    message_reactions?: Array<any>;
    message_deliveries?: Array<any>;
    message_reads?: Array<any>;
    optins?: Array<any>;
    // Instagram-specific fields
    messaging?: Array<any>;
    // Changes-based fields (newer format)
    changes?: Array<{
      field: string;
      value: any;
    }>;
  }>;
}

export interface MetaError extends Error {
  code?: string;
  subcode?: number;
  type?: string;
  isTransient?: boolean;
  retryAfter?: number; // seconds
  fbtrace_id?: string;
}

export interface MetaRateLimitInfo {
  callsMade: number;
  callsLimit: number;
  resetTime: number; // timestamp
  remaining: number;
}

export interface MetaConnectionStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  lastSuccessAt?: string; // ISO string
  lastFailureAt?: string; // ISO string
}