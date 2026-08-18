import { 
   MetaInsightsParams,
   MetaInsightsResult,
   MetaConnectionState,
   MetaError,
   MetaAppConfig
 } from '../types';
import { MetaPagesService } from '../pages/pagesService';
import { MetaInstagramService } from '../instagram/instagramService';

/**
 * Meta Insights Service - Handles fetching metrics and analytics from Facebook Pages and Instagram Professional Accounts
 */
export class MetaInsightsService {
  private pagesService: MetaPagesService;
  private instagramService: MetaInstagramService;
  
constructor(metaAppConfig: MetaAppConfig) {
     this.pagesService = new MetaPagesService(metaAppConfig);
     this.instagramService = new MetaInstagramService(metaAppConfig);
   }
  
  /**
   * Get insights for Facebook Pages and/or Instagram Professional Accounts
   * based on the connection state and provided parameters
   */
  async getInsights(
    connectionState: MetaConnectionState,
    params: MetaInsightsParams
  ): Promise<MetaInsightsResult> {
    const { entityId, metric, period, since, until } = params;
    
    // Validate connection state
    if (!connectionState.isConnected || !connectionState.pages?.length) {
      throw new Error('No active Meta connection available for fetching insights');
    }
    
    // Determine which entity to fetch insights for
    let targetEntityId = entityId;
    let targetPageAccessToken: string | undefined;
    let entityType: 'page' | 'instagram' = 'page'; // default
    
    // If entityId is provided, use it directly
    if (targetEntityId) {
      // Find the page that owns this entity (could be page ID or Instagram account ID)
      const owningPage = connectionState.pages.find(page => 
        page.id === targetEntityId || 
        page.instagramBusinessAccount?.id === targetEntityId
      );
      
      if (!owningPage) {
        throw new Error(`Entity with ID ${targetEntityId} not found in connection`);
      }
      
      targetPageAccessToken = owningPage.accessToken;
      
      // Determine if it's a page or Instagram account
      if (owningPage.instagramBusinessAccount?.id === targetEntityId) {
        entityType = 'instagram';
      } else {
        entityType = 'page';
      }
    } else {
      // Use the first available page or selected entities
      if (connectionState.pages.length === 0) {
        throw new Error('No pages available in connection');
      }
      
      // Default to selected page or first page
      const selectedPageId = connectionState.selectedPageId || connectionState.pages[0].id;
      const selectedPage = connectionState.pages.find(page => page.id === selectedPageId);
      
      if (!selectedPage) {
        throw new Error('Selected page not found in connection');
      }
      
      targetPageAccessToken = selectedPage.accessToken;
      
      // If no specific entityId, check if we want Instagram insights specifically
      // For now, we'll default to page insights if no entityId specified
      // In a more complete implementation, we might have a parameter to specify entity type
      entityType = 'page';
      targetEntityId = selectedPage.id;
      
      // Override to Instagram if selectedInstagramId is set and we're asking for Instagram-specific metrics
      // This is a simplification - a real implementation would be more sophisticated
      if (connectionState.selectedInstagramId) {
        const igPage = connectionState.pages.find(page => 
          page.instagramBusinessAccount?.id === connectionState.selectedInstagramId
        );
        if (igPage) {
          targetEntityId = connectionState.selectedInstagramId;
          entityType = 'instagram';
          targetPageAccessToken = igPage.accessToken;
        }
      }
    }
    
    if (!targetPageAccessToken) {
      throw new Error(`No access token available for entity ${targetEntityId}`);
    }
    
    try {
      // Fetch insights based on entity type
      if (entityType === 'page') {
        return await this.pagesService.getPageInsights(
          targetEntityId,
          targetPageAccessToken,
          { metric, period, since, until }
        );
      } else {
        return await this.instagramService.getInstagramInsights(
          targetEntityId,
          targetPageAccessToken,
          { metric, period, since, until }
        );
      }
} catch (error) {
       throw new Error(
          error instanceof Error ? error.message : 'Failed to fetch insights: Unknown error'
        );
     }
  }
  
  /**
   * Get available metrics for a Facebook Page or Instagram Account
   * Note: This would typically require calling the API without a specific metric to get the list
   * For simplicity, we're returning common metrics
   */
  async getAvailableMetrics(
    connectionState: MetaConnectionState,
    entityType: 'page' | 'instagram' = 'page'
  ): Promise<string[]> {
    if (!connectionState.isConnected || !connectionState.pages?.length) {
      throw new Error('No active Meta connection available');
    }
    
    // Get the first page's access token
    const firstPage = connectionState.pages[0];
if (!firstPage.accessToken) {
       throw new Error('No access token available');
     }
    
    // In a real implementation, we would make an API call to get the metric list
    // For now, we'll return a predefined list of common metrics
    
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
  }
  
  /**
   * Get insights for multiple entities (pages and/or Instagram accounts)
   */
  async getMultipleInsights(
    connectionState: MetaConnectionState,
    requests: Array<{
      entityId?: string; // If not provided, uses selected/default
      metric: string;
      period?: 'day' | 'week' | 'days_28' | 'month';
      since?: string; // ISO string
      until?: string; // ISO string
    }>
  ): Promise<Array<{
    entityId: string;
    entityType: 'page' | 'instagram';
    result: MetaInsightsResult;
    error?: string;
  }>> {
    const results: Array<{
      entityId: string;
      entityType: 'page' | 'instagram';
      result: MetaInsightsResult;
      error?: string;
    }> = [];
    
    for (const request of requests) {
      try {
        const entityId = request.entityId;
        const result = await this.getInsights(connectionState, {
          entityId,
          metric: request.metric,
          period: request.period,
          since: request.since,
          until: request.until
        });
        
        // Determine entity type
        let entityType: 'page' | 'instagram' = 'page';
        if (entityId) {
          const owningPage = connectionState.pages.find(page => 
            page.id === entityId || 
            page.instagramBusinessAccount?.id === entityId
          );
          if (owningPage && owningPage.instagramBusinessAccount?.id === entityId) {
            entityType = 'instagram';
          }
        } else {
          // Use selected/default entity
          const selectedPageId = connectionState.selectedPageId || connectionState.pages[0].id;
          const selectedPage = connectionState.pages.find(page => page.id === selectedPageId);
          if (selectedPage && connectionState.selectedInstagramId && 
              selectedPage.instagramBusinessAccount?.id === connectionState.selectedInstagramId) {
            entityType = 'instagram';
          }
        }
        
        results.push({
          entityId: entityId || (entityType === 'page' ? 
            (connectionState.selectedPageId || connectionState.pages[0].id) : 
            connectionState.selectedInstagramId || ''),
          entityType,
          result
        });
} catch (error) {
         let entityType: 'page' | 'instagram' = 'page';
         if (request.entityId) {
           const owningPage = connectionState.pages.find(page => 
             page.id === request.entityId || 
             page.instagramBusinessAccount?.id === request.entityId
           );
           if (owningPage && owningPage.instagramBusinessAccount?.id === request.entityId) {
             entityType = 'instagram';
           }
         }
         
         results.push({
           entityId: request.entityId || '',
           entityType,
           result: {
             success: false,
             data: [],
             error: error && typeof error === 'object' && ('code' in error || 'subcode' in error) ? String(error.message) : 'Unknown error'
           },
           error: error && typeof error === 'object' && ('code' in error || 'subcode' in error) ? String(error.message) : 'Unknown error'
         });
       }
    }
    
    return results;
  }
}