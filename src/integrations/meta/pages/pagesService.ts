import { 
  MetaPage, 
  MetaConnectionState,
  MetaPublishParams,
  MetaPublishResult,
  MetaInsightsParams,
  MetaInsightsResult,
  MetaError
} from '../types';
import { MetaGraphApiClient } from '../client/metaClient';

/**
 * Facebook Pages Service - Handles operations related to Facebook Pages
 */
export class MetaPagesService {
  private client: MetaGraphApiClient;
  
constructor(metaAppConfig: MetaAppConfig) {
     this.client = new MetaGraphApiClient(metaAppConfig);
   }
  
  /**
   * Get accessible pages for a user access token
   */
  async getUserPages(userAccessToken: string): Promise<MetaPage[]> {
    try {
      const accountsResponse = await fetch(
        `https://graph.facebook.com/${this.client['config'].apiVersion}/me/accounts?fields=id,name,category,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${userAccessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!accountsResponse.ok) {
        throw await this.handleErrorResponse(accountsResponse);
      }
      
      const accountsData = await accountsResponse.json();
      
      return (accountsData.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        accessToken: item.access_token,
        instagram_business_account: item.instagram_business_account ? {
          id: item.instagram_business_account.id,
          username: item.instagram_business_account.username,
          name: item.instagram_business_account.name,
          profilePictureUrl: item.instagram_business_account.profile_picture_url
        } : undefined
      }));
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to fetch Facebook pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get detailed information about a specific page
   */
  async getPageDetails(pageId: string, pageAccessToken: string): Promise<MetaPage> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.client['config'].apiVersion}/${pageId}?fields=id,name,category,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        accessToken: data.access_token,
        instagram_business_account: data.instagram_business_account ? {
          id: data.instagram_business_account.id,
          username: data.instagram_business_account.username,
          name: data.instagram_business_account.name,
          profilePictureUrl: data.instagram_business_account.profile_picture_url
        } : undefined
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to fetch page details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Publish content to a Facebook Page
   */
  async publishToPage(
    pageId: string,
    pageAccessToken: string,
    params: Omit<MetaPublishParams, 'pageId' | 'instagramAccountId'>
  ): Promise<MetaPublishResult> {
    const { message, mediaUrl, linkUrl } = params;
    
    if (!message) {
      throw new Error('Message is required for publishing');
    }
    
    try {
      // Prepare the publish endpoint
      const publishUrl = `https://graph.facebook.com/${this.client['config'].apiVersion}/${pageId}/feed`;
      
      // Prepare the request body
      const bodyData: any = {
        message,
        access_token: pageAccessToken
      };
      
      if (linkUrl) {
        bodyData.link = linkUrl;
      }
      
      // Note: For photo/video publishing, we would need to use different endpoints
      // This implementation covers text and link posts
      // For media attachments, we would need to use the /photos or /videos endpoints
      
      const response = await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        facebookPostId: data.id,
        publishedAt: new Date().toISOString(),
        destination: 'facebook'
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to publish to Facebook page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get insights for a Facebook Page
   */
  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    params: Omit<MetaInsightsParams, 'entityId'>
  ): Promise<MetaInsightsResult> {
    const { metric, period, since, until } = params;
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        metric
      });
      
      if (period) queryParams.append('period', period);
      if (since) queryParams.append('since', since);
      if (until) queryParams.append('until', until);
      
      const url = `https://graph.facebook.com/${this.client['config'].apiVersion}/${pageId}/insights?${queryParams.toString()}&access_token=${pageAccessToken}`;
      
      const response = await fetch(url, {
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
        success: true,
        data: data.data || []
      };
} catch (error) {
       return {
         success: false,
         error: error && typeof error === 'object' && ('code' in error || 'subcode' in error) ? String(error.message) : 'Unknown error'
       };
     }
  }
  
  /**
   * Handle error responses from Meta API
   */
  private async handleErrorResponse(response: Response): Promise<MetaError> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
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
}