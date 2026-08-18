import { 
  MetaPage, 
  MetaConnectionState,
  MetaPublishParams,
  MetaPublishResult,
  MetaInsightsParams,
  MetaInsightsResult,
  MetaError,
  MetaAppConfig
} from '../types';
import { MetaGraphApiClient } from '../client/metaClient';
import { MetaErrorFactory } from '../errors/metaErrors';

/**
 * Instagram Professional Account Service - Handles operations related to Instagram Professional Accounts
 */
export class MetaInstagramService {
  private client: MetaGraphApiClient;
  
constructor(metaAppConfig: MetaAppConfig) {
     this.client = new MetaGraphApiClient(metaAppConfig);
   }
  
  /**
   * Get Instagram Business Accounts associated with Facebook Pages
   * This is typically done through the pages service, but we provide a dedicated method
   */
  async getInstagramAccountsFromPages(pages: MetaPage[]): Promise<Array<{
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    pageId: string;
    pageName: string;
  }>> {
    const instagramAccounts: Array<{
      id: string;
      username: string;
      name?: string;
      profilePictureUrl?: string;
      pageId: string;
      pageName: string;
    }> = [];
    
    for (const page of pages) {
      if (page.instagramBusinessAccount) {
        instagramAccounts.push({
          id: page.instagramBusinessAccount.id,
          username: page.instagramBusinessAccount.username,
          name: page.instagramBusinessAccount.name,
          profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl,
          pageId: page.id,
          pageName: page.name
        });
      }
    }
    
    return instagramAccounts;
  }
  
  /**
   * Get detailed information about an Instagram Business Account
   */
  async getInstagramAccountDetails(
    instagramAccountId: string,
    pageAccessToken: string
  ): Promise<{
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    followCount?: number;
    followersCount?: number;
    mediaCount?: number;
  }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.client['config'].apiVersion}/${instagramAccountId}?fields=id,username,name,profile_picture_url,follow_count,followers_count,media_count&access_token=${pageAccessToken}`,
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
        username: data.username,
        name: data.name,
        profilePictureUrl: data.profile_picture_url,
        followCount: data.follow_count,
        followersCount: data.followers_count,
        mediaCount: data.media_count
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to fetch Instagram account details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Publish content to an Instagram Professional Account
   * Note: Instagram publishing requires a two-step process:
   * 1. Create media container
   * 2. Publish the container
   */
  async publishToInstagram(
    instagramAccountId: string,
    pageAccessToken: string,
    params: Omit<MetaPublishParams, 'pageId' | 'instagramAccountId'>
  ): Promise<MetaPublishResult> {
    const { message, mediaUrl, linkUrl } = params;
    
    if (!message) {
      throw new Error('Message (caption) is required for Instagram publishing');
    }
    
    if (!mediaUrl) {
      throw new Error('Media URL is required for Instagram publishing');
    }
    
    // Instagram only supports photo and video posts, not link-only posts
    // For simplicity, we'll assume mediaUrl is an image URL
    // In a full implementation, we would detect media type and handle accordingly
    
    try {
      // Step 1: Create media container
      const containerUrl = `https://graph.facebook.com/${this.client['config'].apiVersion}/${instagramAccountId}/media`;
      const containerParams = new URLSearchParams({
        image_url: mediaUrl,
        caption: message,
        access_token: pageAccessToken
      });
      
      // Note: For carousel, video, or other media types, different parameters would be needed
      
      const containerResponse = await fetch(`${containerUrl}?${containerParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!containerResponse.ok) {
        throw await this.handleErrorResponse(containerResponse);
      }
      
      const containerData = await containerResponse.json();
      
      if (!containerData.id) {
        throw new Error('Failed to create Instagram media container');
      }
      
      // Step 2: Publish the media container
      const publishUrl = `https://graph.facebook.com/${this.client['config'].apiVersion}/${instagramAccountId}/media_publish`;
      const publishParams = new URLSearchParams({
        creation_id: containerData.id,
        access_token: pageAccessToken
      });
      
      const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!publishResponse.ok) {
        throw await this.handleErrorResponse(publishResponse);
      }
      
      const publishData = await publishResponse.json();
      
      return {
        success: true,
        instagramMediaId: publishData.id || containerData.id,
        publishedAt: new Date().toISOString(),
        destination: 'instagram'
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to publish to Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get insights for an Instagram Business Account
   */
  async getInstagramInsights(
    instagramAccountId: string,
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
      
      const url = `https://graph.facebook.com/${this.client['config'].apiVersion}/${instagramAccountId}/insights?${queryParams.toString()}&access_token=${pageAccessToken}`;
      
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
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to fetch Instagram insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get recent media from an Instagram Business Account
   */
  async getRecentMedia(
    instagramAccountId: string,
    pageAccessToken: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    caption?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    mediaUrl?: string;
    permalink?: string;
    timestamp: string; // ISO string
    likeCount?: number;
    commentsCount?: number;
  }>> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.client['config'].apiVersion}/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${pageAccessToken}`,
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
      
      return (data.data || []).map((item: any) => ({
        id: item.id,
        caption: item.caption,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
        likeCount: item.like_count,
        commentsCount: item.comments_count
      }));
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || 'subcode' in error)) {
        throw error;
      }
      throw new Error(`Failed to fetch Instagram media: ${error instanceof Error ? error.message : 'Unknown error'}`);
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