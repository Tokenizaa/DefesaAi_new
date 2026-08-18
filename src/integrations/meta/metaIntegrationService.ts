/**
 * Meta Integration Service - Main service coordinating all Meta integration functionality
 * This is the canonical implementation that replaces the previous scattered implementation
 */
import { MetaAuthService } from './auth/authService';
import { MetaPagesService } from './pages/pagesService';
import { MetaInstagramService } from './instagram/instagramService';
import { MetaPublishingService } from './publishing/publishingService';
import { MetaInsightsService } from './insights/insightsService';
import { MetaWebhooksService } from './webhooks/webhooksService';
import { MetaAppConfig, MetaConnectionState } from './types';
import { MetaAdapters } from './adapters/metaAdapters';
import { MetaErrorFactory } from './errors/metaErrors';

export class MetaIntegrationService {
   private authService: MetaAuthService;
   private pagesService: MetaPagesService;
   private instagramService: MetaInstagramService;
   private publishingService: MetaPublishingService;
   private insightsService: MetaInsightsService;
   private webhooksService: MetaWebhooksService | null = null;
   
   constructor(config: MetaAppConfig, webhookVerifyToken?: string) {
     // Initialize all services
     this.authService = new MetaAuthService(config);
     this.pagesService = new MetaPagesService({
       appId: config.appId,
       appSecret: config.appSecret,
       apiVersion: config.apiVersion,
       redirectUri: config.redirectUri,
       scope: config.scope
     });
     this.instagramService = new MetaInstagramService({
       appId: config.appId,
       appSecret: config.appSecret,
       apiVersion: config.apiVersion,
       redirectUri: config.redirectUri,
       scope: config.scope
     });
     this.publishingService = new MetaPublishingService({
       appId: config.appId,
       appSecret: config.appSecret,
       apiVersion: config.apiVersion,
       redirectUri: config.redirectUri,
       scope: config.scope
     });
     this.insightsService = new MetaInsightsService({
       appId: config.appId,
       appSecret: config.appSecret,
       apiVersion: config.apiVersion,
       redirectUri: config.redirectUri,
       scope: config.scope
     });
    
    // Initialize webhooks service if verify token is provided
    if (webhookVerifyToken) {
      this.webhooksService = new MetaWebhooksService(webhookVerifyToken);
    }
  }
  
  /**
   * Get the current connection state (sanitized for frontend use)
   */
  getConnectionState(): MetaConnectionState {
    const state = this.authService.getConnectionState();
    return MetaAdapters.adaptConnectionStateForFrontend(state);
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state: string = 'meta_auth_state'): string {
    return this.authService.getAuthUrl(state);
  }
  
  /**
   * Handle OAuth callback - exchange code for tokens and establish connection
   */
  async handleOAuthCallback(code: string, redirectUri: string): Promise<MetaConnectionState> {
    try {
      const connectionState = await this.authService.handleOAuthCallback(code, redirectUri);
      return MetaAdapters.adaptConnectionStateForFrontend(connectionState);
    } catch (error) {
      throw MetaErrorFactory.createFromApiResponse(
        typeof error === 'object' && error !== null ? error : { message: String(error) }
      );
    }
  }
  
  /**
   * Connect using a long-lived page access token (for system users or manual token input)
   */
  async connectWithPageToken(
    pageAccessToken: string,
    pageId?: string,
    instagramAccountId?: string
  ): Promise<MetaConnectionState> {
    try {
      const connectionState = await this.authService.connectWithPageToken(
        pageAccessToken,
        pageId,
        instagramAccountId
      );
      return MetaAdapters.adaptConnectionStateForFrontend(connectionState);
    } catch (error) {
      throw MetaErrorFactory.createFromApiResponse(
        typeof error === 'object' && error !== null ? error : { message: String(error) }
      );
    }
  }
  
  /**
   * Refresh the connection state - validates token and updates information
   */
  async refreshConnection(): Promise<MetaConnectionState> {
    try {
      const connectionState = await this.authService.refreshConnection();
      return MetaAdapters.adaptConnectionStateForFrontend(connectionState);
    } catch (error) {
      throw MetaErrorFactory.createFromApiResponse(
        typeof error === 'object' && error !== null ? error : { message: String(error) }
      );
    }
  }
  
  /**
   * Disconnect and clear connection state
   */
  disconnect(): void {
    this.authService.disconnect();
    // Note: In a full implementation, we would also clear webhook subscriptions
  }
  
  /**
   * Validate if the current connection is still valid
   */
  async isValid(): Promise<boolean> {
    try {
      return await this.authService.isValid();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Publish content to Facebook Page and/or Instagram Professional Account
   */
async publishContent(params: any): Promise<any> {
     try {
       const connectionState = this.authService.getConnectionState();
       const result = await this.publishingService.publishContent(connectionState, params);
       return result;
     } catch (error) {
       if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
         throw error;
       }
       throw MetaErrorFactory.createFromApiResponse(
         typeof error === 'object' && error !== null ? error : { message: String(error) }
       );
     }
   }
  
  /**
   * Validate publishing permissions for the current connection
   */
  async validatePublishPermissions(
    destination: 'facebook' | 'instagram' | 'both'
  ): Promise<{ 
    canPublishToFacebook: boolean; 
    canPublishToInstagram: boolean;
    missingPermissions: string[];
  }> {
    try {
      const connectionState = this.authService.getConnectionState();
      return await this.publishingService.validatePublishPermissions(connectionState, destination);
} catch (error) {
       return {
         canPublishToFacebook: false,
         canPublishToInstagram: false,
         missingPermissions: [error && typeof error === 'object' && ('code' in error || 'subcode' in error) ? String(error.message) : 'Unknown error']
       };
     }
  }
  
  /**
   * Get insights/metrics for Facebook Pages and/or Instagram Professional Accounts
   */
async getInsights(params: any): Promise<any> {
     try {
       const connectionState = this.authService.getConnectionState();
       // We need to convert the sanitized state back to a full state for the insights service
       // In a real implementation, the insights service would work with the internal state
       // For now, we'll have to work with what we have or modify the approach
       
       // This is a limitation of our current design - the insights service needs access tokens
       // which we don't expose in the frontend state for security reasons
       // In a production system, this would be handled by backend services
       
       throw new Error('Insights fetching requires backend processing for security reasons');
     } catch (error) {
       if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
         throw error;
       }
       throw MetaErrorFactory.createFromApiResponse(
         typeof error === 'object' && error !== null ? error : { message: String(error) }
       );
     }
   }
  
  /**
   * Get available metrics for a Facebook Page or Instagram Account
   */
  async getAvailableMetrics(
    entityType: 'page' | 'instagram' = 'page'
  ): Promise<string[]> {
    try {
      // This would require access tokens, so we'll return a predefined list
      // In a production system, this would be handled by backend services with proper auth
      if (entityType === 'page') {
        return [
          'page_impressions',
          'page_reach',
          'page_engaged_users',
          'page_fans',
          'page_impressions_unique',
          'page_reactions',
          'page_comments',
          'page_shares',
          'page_views',
          'page_negative_feedback',
          'page_positive_feedback',
          'page_fan_adds',
          'page_fan_removes'
        ];
      } else {
        return [
          'impressions',
          'reach',
          'engagement',
          'saved',
          'video_views',
          'follower_count',
          'profile_views',
          'email_contacts',
          'phone_call_clicks',
          'text_message_clicks',
          'get_directions_clicks',
          'website_clicks'
        ];
      }
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Verify a webhook request from Meta
   */
  verifyWebhookRequest(queryParams: Record<string, string>): { verified: true; challenge: string } | { verified: false; reason: string } {
    if (!this.webhooksService) {
      return { verified: false, reason: 'Webhooks service not initialized' };
    }
    return this.webhooksService.verifyWebhookRequest(queryParams);
  }
  
  /**
   * Parse and process an incoming webhook payload
   */
  async processWebhook(payload: any): Promise<{
    success: true;
    actions: string[];
    processingTimeMs: number;
  } | {
    success: false;
    error: string;
    processingTimeMs: number;
  }> {
    if (!this.webhooksService) {
      return {
        success: false,
        error: 'Webhooks service not initialized',
        processingTimeMs: 0
      };
    }
    
    // First parse the payload
    const parseResult = this.webhooksService.parseWebhookPayload(payload);
    if (!parseResult.valid) {
return {
         success: false,
         error: (parseResult as { valid: false; error: string }).error,
         processingTimeMs: 0
       };
    }
    
    // Then process the event
    return await this.webhooksService.processWebhookEvent(parseResult.event);
  }
  
  /**
   * Get metrics about the Meta connection (for monitoring purposes)
   */
  getConnectionStats(): any {
    // In a real implementation, this would return actual metrics
    // For now, we'll return basic information
    const state = this.authService.getConnectionState();
    return {
      totalConnections: state.isConnected ? 1 : 0,
      activeConnections: state.isConnected && !state.error ? 1 : 0,
      failedConnections: state.error ? 1 : 0,
      lastSuccessAt: state.isConnected && !state.error ? state.connectedAt : undefined,
      lastFailureAt: state.error ? new Date().toISOString() : undefined
    };
  }
  
  /**
   * Get the application configuration (non-sensitive parts)
   */
  getAppConfig(): Omit<any, 'appSecret'> {
    return {
      appId: this.authService['client']['config'].appId,
      appSecret: '***HIDDEN***', // Never expose the actual secret
      redirectUri: this.authService['client']['config'].redirectUri,
      apiVersion: this.authService['client']['config'].apiVersion,
      scope: this.authService['client']['config'].scope
    };
  }
}

// Initialize the Meta integration service with environment variables
const metaAppConfig: any = {
  appId: process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || '',
  appSecret: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '',
  redirectUri: process.env.META_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI || '',
  apiVersion: process.env.META_API_VERSION || 'v20.0'
};

const webhookVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

// Export the singleton instance
export const metaIntegration = new MetaIntegrationService(metaAppConfig, webhookVerifyToken);
