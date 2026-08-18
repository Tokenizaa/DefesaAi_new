import { 
  MetaPublishParams,
  MetaPublishResult,
  MetaConnectionState,
  MetaError
} from '../types';
import { MetaPagesService } from '../pages/pagesService';
import { MetaInstagramService } from '../instagram/instagramService';

/**
 * Meta Publishing Service - Coordinated publishing to Facebook Pages and Instagram Professional Accounts
 */
export class MetaPublishingService {
  private pagesService: MetaPagesService;
  private instagramService: MetaInstagramService;
  
constructor(metaAppConfig: MetaAppConfig) {
     this.pagesService = new MetaPagesService(metaAppConfig);
     this.instagramService = new MetaInstagramService(metaAppConfig);
   }
  
  /**
   * Publish content to Facebook Page and/or Instagram Professional Account
   * based on the connection state and provided parameters
   */
  async publishContent(
    connectionState: MetaConnectionState,
    params: MetaPublishParams
  ): Promise<MetaPublishResult> {
    const { destination, message, mediaUrl, linkUrl, pageId, instagramAccountId } = params;
    
    // Validate connection state
    if (!connectionState.isConnected || !connectionState.pages?.length) {
      throw new Error('No active Meta connection available for publishing');
    }
    
    // Validate required parameters
    if (!message) {
      throw new Error('Message is required for publishing');
    }
    
    // Determine target page and Instagram account
    let targetPageId = pageId || connectionState.selectedPageId;
    let targetInstagramId = instagramAccountId || connectionState.selectedInstagramId;
    
    // If no specific IDs provided, use the first available
    if (!targetPageId && connectionState.pages.length > 0) {
      targetPageId = connectionState.pages[0].id;
    }
    
    if (!targetInstagramId && connectionState.pages.length > 0) {
      // Find first page with Instagram account
      const pageWithIg = connectionState.pages.find(page => 
        page.instagramBusinessAccount?.id
      );
      if (pageWithIg) {
        targetInstagramId = pageWithIg.instagramBusinessAccount.id;
      }
    }
    
    // Validate we have the necessary IDs for the requested destination
    if ((destination === 'facebook' || destination === 'both') && !targetPageId) {
      throw new Error('Facebook Page ID is required for publishing to Facebook');
    }
    
    if ((destination === 'instagram' || destination === 'both') && !targetInstagramId) {
      throw new Error('Instagram Account ID is required for publishing to Instagram');
    }
    
    // Find the page access token for the target page
    const targetPage = connectionState.pages.find(page => page.id === targetPageId);
    if (!targetPage) {
      throw new Error(`Target page with ID ${targetPageId} not found in connection`);
    }
    
    if (!targetPage.accessToken) {
      throw new Error(`No access token available for page ${targetPageId}`);
    }
    
    const pageAccessToken = targetPage.accessToken;
    
    // Initialize result
    const result: MetaPublishResult = {
      success: false,
      destination,
      publishedAt: new Date().toISOString()
    };
    
    let facebookPostId: string | undefined;
    let instagramMediaId: string | undefined;
    let error: string | undefined;
    
    try {
      // Publish to Facebook if requested
      if (destination === 'facebook' || destination === 'both') {
        const fbResult = await this.pagesService.publishToPage(
          targetPageId,
          pageAccessToken,
          { message, mediaUrl, linkUrl }
        );
        facebookPostId = fbResult.facebookPostId;
      }
      
      // Publish to Instagram if requested
      if (destination === 'instagram' || destination === 'both') {
        const igResult = await this.instagramService.publishToInstagram(
          targetInstagramId!,
          pageAccessToken,
          { message, mediaUrl, linkUrl }
        );
        instagramMediaId = igResult.instagramMediaId;
      }
      
      // Success
      result.success = true;
      result.facebookPostId = facebookPostId;
      result.instagramMediaId = instagramMediaId;
      
      return result;
} catch (err) {
       // Error occurred
       result.error = err && typeof err === 'object' && ('code' in err || 'subcode' in err) ? String(err.message) : 'Unknown error during publishing';
       
       // If we had partial success, we might want to include those IDs
      if (facebookPostId) {
        result.facebookPostId = facebookPostId;
      }
if (instagramMediaId) {
         result.instagramMediaId = instagramMediaId;
       }
       
       throw new Error(result.error);
    }
  }
  
  /**
   * Validate that the user has permission to publish to the specified destinations
   */
  async validatePublishPermissions(
    connectionState: MetaConnectionState,
    destination: 'facebook' | 'instagram' | 'both'
  ): Promise<{ 
    canPublishToFacebook: boolean; 
    canPublishToInstagram: boolean;
    missingPermissions: string[];
  }> {
    if (!connectionState.isConnected || !connectionState.pages?.length) {
      return {
        canPublishToFacebook: false,
        canPublishToInstagram: false,
        missingPermissions: ['No active Meta connection']
      };
    }
    
    // Check if we have at least one page
    const hasPages = connectionState.pages.length > 0;
    
    // Check if we have pages with Instagram accounts
    const hasInstagramAccounts = connectionState.pages.some(page => 
      page.instagramBusinessAccount?.id
    );
    
    const missingPermissions: string[] = [];
    
    if ((destination === 'facebook' || destination === 'both') && !hasPages) {
      missingPermissions.push('No Facebook Pages accessible');
    }
    
    if ((destination === 'instagram' || destination === 'both') && !hasInstagramAccounts) {
      missingPermissions.push('No Instagram Business Accounts accessible');
    }
    
    return {
      canPublishToFacebook: !missingPermissions.includes('No Facebook Pages accessible'),
      canPublishToInstagram: !missingPermissions.includes('No Instagram Business Accounts accessible'),
      missingPermissions
    };
  }
}