import { 
  MetaAppConfig, 
  MetaOAuthTokens, 
  MetaUser, 
  MetaPage, 
  MetaPublishParams, 
  MetaPublishResult,
  MetaInsightsParams,
  MetaInsightsResult,
  MetaError,
  MetaRateLimitInfo
} from '../types';

/**
 * Meta Graph API Client - Handles all communication with Facebook/Instagram Graph API
 * Encapsulates API details, versioning, error handling, and rate limiting
 */
export class MetaGraphApiClient {
  private config: MetaAppConfig;
  private baseUrl: string;
  
  constructor(config: MetaAppConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }
  
  /**
   * Generates the OAuth authorization URL
   */
  getAuthUrl(state: string = 'meta_auth_state'): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(','),
      response_type: 'code',
      state
    });
    
    return `https://www.facebook.com/${this.config.apiVersion}/dialog/oauth?${params.toString()}`;
  }
  
  /**
   * Exchanges authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaOAuthTokens> {
    const tokenUrl = `${this.baseUrl}/oauth/access_token`;
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      code,
      redirect_uri: redirectUri
    });
    
    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }
    
    const data = await response.json();
    
    // Exchange for long-lived token (60 days)
    if (data.access_token) {
      return this.exchangeForLongLivedToken(data.access_token);
    }
    
    throw new Error('Failed to obtain access token from Meta');
  }
  
  /**
   * Exchanges short-lived token for long-lived token (60 days)
   */
  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaOAuthTokens> {
    const tokenUrl = `${this.baseUrl}/oauth/access_token`;
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken
    });
    
    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: undefined, // Graph API doesn't provide refresh tokens for pages
      expiresIn: data.expires_in || 5184000, // 60 days in seconds
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || this.config.scope.join(','),
      obtainedAt: Date.now()
    };
  }
  
  /**
   * Debug token to get metadata about it
   */
  async debugToken(token: string): Promise<any> {
    const debugTokenUrl = `${this.baseUrl}/debug_token`;
    const params = new URLSearchParams({
      input_token: token,
      access_token: `${this.config.appId}|${this.config.appSecret}` // App token
    });
    
    const response = await fetch(`${debugTokenUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }
    
    return response.json();
  }
  
  /**
   * Gets user information including accessible pages
   */
  async getUserAccounts(userAccessToken: string): Promise<{ user: MetaUser; pages: MetaPage[] }> {
    // Get user info
    const userResponse = await fetch(`${this.baseUrl}/me?fields=id,name,email&access_token=${userAccessToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      throw await this.handleErrorResponse(userResponse);
    }
    
    const userData = await userResponse.json();
    const user: MetaUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email
    };
    
    // Get user's pages/accounts
    const accountsResponse = await fetch(`${this.baseUrl}/me/accounts?fields=id,name,category,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${userAccessToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!accountsResponse.ok) {
      throw await this.handleErrorResponse(accountsResponse);
    }
    
    const accountsData = await accountsResponse.json();
    
    const pages: MetaPage[] = (accountsData.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      access_token: item.access_token,
      instagram_business_account: item.instagram_business_account ? {
        id: item.instagram_business_account.id,
        username: item.instagram_business_account.username,
        name: item.instagram_business_account.name,
        profilePictureUrl: item.instagram_business_account.profile_picture_url
      } : undefined
    }));
    
    return { user, pages };
  }
  
  /**
   * Publishes content to Facebook Page and/or Instagram Professional Account
   */
  async publishContent(params: MetaPublishParams): Promise<MetaPublishResult> {
    const { destination, message, mediaUrl, linkUrl, pageId, instagramAccountId } = params;
    
    // Validate required parameters
    if (!message) {
      throw new Error('Message is required for publishing');
    }
    
    const result: MetaPublishResult = {
      success: false,
      destination,
      publishedAt: new Date().toISOString()
    };
    
    try {
      // Publish to Facebook
      if (destination === 'facebook' || destination === 'both') {
        if (!pageId) {
          throw new Error('Page ID is required for Facebook publishing');
        }
        
        const fbResult = await this.publishToFacebook(pageId, message, mediaUrl, linkUrl);
        result.facebookPostId = fbResult.postId;
      }
      
      // Publish to Instagram
      if (destination === 'instagram' || destination === 'both') {
        if (!instagramAccountId) {
          throw new Error('Instagram Account ID is required for Instagram publishing');
        }
        
        // Need page access token for Instagram publishing (via the page)
        // This would normally come from the connection state
        // For now, we'll need to get it from somewhere - this is a limitation
        throw new Error('Instagram publishing requires page access token - not implemented in this method');
      }
      
      result.success = true;
      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      throw error;
    }
  }
  
  /**
   * Publishes to Facebook Page
   */
  private async publishToFacebook(
    pageId: string, 
    message: string, 
    mediaUrl?: string, 
    linkUrl?: string
  ): Promise<{ postId: string }> {
    // This would require the page access token
    // For now, we'll simulate or need to get it from connection state
    throw new Error('Facebook publishing requires page access token - not implemented in this method');
  }
  
  /**
   * Gets insights/metrics for a Facebook Page or Instagram Account
   */
  async getInsights(params: MetaInsightsParams): Promise<MetaInsightsResult> {
    const { entityId, metric, period, since, until } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      metric
    });
    
    if (period) queryParams.append('period', period);
    if (since) queryParams.append('since', since);
    if (until) queryParams.append('until', until);
    
    const url = `${this.baseUrl}/${entityId}/insights?${queryParams.toString()}`;
    
    // This requires an access token - would need to be provided from connection state
    throw new Error('Insights fetching requires access token - not implemented in this method');
  }
  
  /**
   * Handles error responses from Meta API
   */
  private async handleErrorResponse(response: Response): Promise<MetaError> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // If we can't parse JSON, create a basic error
      errorData = { error: { message: 'Unknown error', code: `${response.status}` } };
    }
    
    const metaError = new Error(
      errorData.error?.message || 'Unknown Meta API error'
    ) as MetaError;
    
    metaError.code = errorData.error?.code;
    metaError.subcode = errorData.error?.error_subcode;
    metaError.type = errorData.error?.type;
    metaError.fbtrace_id = errorData.error?.fbtrace_id;
    
    // Check if error is transient (rate limiting, temporary issues)
    metaError.isTransient = 
      metaError.code === '4' || // Rate limiting
      metaError.code === '17' || // User request limit
      metaError.code === '613' || // Calls to this field have exceeded the rate limit
      metaError.code === '80001' || // Too many calls to this Page account
      metaError.code === '80002' || // Too many calls to this ad account
      (response.status >= 500 && response.status < 600); // Server errors
    
    // Extract retry-after header if present
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      metaError.retryAfter = parseInt(retryAfter, 10);
    }
    
    return metaError;
  }
  
  /**
   * Gets rate limit information from response headers
   */
  getRateLimitInfo(headers: Headers): MetaRateLimitInfo | null {
    // Meta doesn't consistently provide rate limit headers in all responses
    // This is a placeholder for when they do
    const calls = headers.get('x-business-use-case-usage');
    if (!calls) return null;
    
    try {
      // Parse the usage data
      const usage = JSON.parse(calls);
      // This would vary based on the endpoint and what's being measured
      return {
        callsMade: 0, // Would need to parse from usage
        callsLimit: 0,
        resetTime: Date.now() + 3600000, // 1 hour from now
        remaining: 0
      };
    } catch (e) {
      return null;
    }
  }
}