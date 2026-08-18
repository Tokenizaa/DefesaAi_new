import { 
  MetaUser, 
  MetaPage, 
  MetaConnectionState,
  MetaPublishParams,
  MetaPublishResult,
  MetaInsightsParams,
  MetaInsightsResult
} from '../types';

/**
 * Meta Data Adapters - Convert between Meta API data structures and internal domain models
 */
export class MetaAdapters {
  /**
   * Adapt Meta user data from API response to internal MetaUser model
   */
  static adaptUser(userData: any): MetaUser {
    return {
      id: userData.id || '',
      name: userData.name || '',
      email: userData.email || undefined
    };
  }
  
  /**
   * Adapt Meta page data from API response to internal MetaPage model
   */
  static adaptPage(pageData: any): MetaPage {
return {
       id: pageData.id || '',
       name: pageData.name || '',
       category: pageData.category || undefined,
       accessToken: pageData.accessToken || '',
       instagramBusinessAccount: pageData.instagramBusinessAccount ? {
         id: pageData.instagramBusinessAccount.id || '',
         username: pageData.instagramBusinessAccount.username || '',
         name: pageData.instagramBusinessAccount.name || undefined,
         profilePictureUrl: pageData.instagramBusinessAccount.profilePictureUrl || undefined
       } : undefined
     };
  }
  
  /**
   * Adapt Meta connection state from API response/persisted state to internal model
   */
  static adaptConnectionState(rawState: any): MetaConnectionState {
    return {
      isConnected: rawState.isConnected || false,
      user: rawState.user ? this.adaptUser(rawState.user) : undefined,
      pages: Array.isArray(rawState.pages) ? rawState.pages.map(this.adaptPage) : [],
      selectedPageId: rawState.selectedPageId || undefined,
      selectedInstagramId: rawState.selectedInstagramId || undefined,
      tokenExpiresAt: rawState.tokenExpiresAt || undefined,
      connectedAt: rawState.connectedAt || undefined,
      lastRefreshedAt: rawState.lastRefreshedAt || undefined,
      error: rawState.error || undefined
    };
  }
  
  /**
   * Adapt internal MetaConnectionState to a format suitable for persistence
   * (removes sensitive data like access tokens for secure storage)
   */
  static adaptForPersistence(state: MetaConnectionState): any {
    return {
      isConnected: state.isConnected,
      user: state.user ? {
        id: state.user.id,
        name: state.user.name,
        email: state.user.email
      } : undefined,
pages: state.pages.map(page => ({
         id: page.id,
         name: page.name,
         category: page.category,
         // Important: DO NOT persist access tokens in unsecured storage
         instagramBusinessAccount: page.instagramBusinessAccount ? {
           id: page.instagramBusinessAccount.id,
username: page.instagramBusinessAccount.username,
           name: page.instagramBusinessAccount.name,
           profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl
         } : undefined
       })),
      selectedPageId: state.selectedPageId,
      selectedInstagramId: state.selectedInstagramId,
      tokenExpiresAt: state.tokenExpiresAt,
      connectedAt: state.connectedAt,
      lastRefreshedAt: state.lastRefreshedAt,
      error: state.error
    };
  }
  
  /**
   * Adapt persisted state (without access tokens) back to connection state
   * Note: This requires re-authentication to get fresh access tokens
   */
  static adaptFromPersisted(persistedState: any): MetaConnectionState {
    return {
      isConnected: persistedState.isConnected || false,
      user: persistedState.user ? {
        id: persistedState.user.id,
        name: persistedState.user.name,
        email: persistedState.user.email
      } : undefined,
      pages: Array.isArray(persistedState.pages) ? persistedState.pages.map(page => ({
        id: page.id,
        name: page.name,
        category: page.category,
        // Access tokens will need to be refreshed/re-obtained
        access_token: '', // Will be populated after re-authentication
        instagram_business_account: page.instagram_business_account ? {
          id: page.instagram_business_account.id,
username: page.instagramBusinessAccount.username,
           name: page.instagramBusinessAccount.name,
           profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl
         } : undefined
       })) : [],
      selectedPageId: persistedState.selectedPageId,
      selectedInstagramId: persistedState.selectedInstagramId,
      tokenExpiresAt: persistedState.tokenExpiresAt,
      connectedAt: persistedState.connectedAt,
      lastRefreshedAt: persistedState.lastRefreshedAt,
      error: persistedState.error
    };
  }
  
  /**
   * Adapt publishing parameters from internal format to Meta API format
   */
  static adaptPublishParams(params: MetaPublishParams): any {
    const adapted: any = {
      message: params.message
    };
    
    if (params.linkUrl) {
      adapted.link = params.linkUrl;
    }
    
    // Note: mediaUrl handling is more complex and depends on the endpoint
    // For feed/posts endpoint, we would need to use different parameters
    // For simplicity, we're not including mediaUrl in the base adaptation
    // Specific implementations (pages vs instagram) will handle media appropriately
    
    return adapted;
  }
  
  /**
   * Adapt publishing result from Meta API response to internal model
   */
  static adaptPublishResult(rawResult: any, destination: 'facebook' | 'instagram' | 'both'): MetaPublishResult {
    return {
      success: !!rawResult.id,
      facebookPostId: destination === 'facebook' || destination === 'both' ? 
        (rawResult.id || undefined) : undefined,
      instagramMediaId: destination === 'instagram' || destination === 'both' ? 
        (rawResult.id || undefined) : undefined,
      publishedAt: new Date().toISOString(),
      destination
    };
  }
  
  /**
   * Adapt insights parameters from internal format to Meta API format
   */
  static adaptInsightsParams(params: MetaInsightsParams): string {
    const queryParams = new URLSearchParams();
    
    if (params.metric) {
      queryParams.append('metric', params.metric);
    }
    
    if (params.period) {
      queryParams.append('period', params.period);
    }
    
    if (params.since) {
      queryParams.append('since', params.since);
    }
    
    if (params.until) {
      queryParams.append('until', params.until);
    }
    
    return queryParams.toString();
  }
  
  /**
   * Adapt insights result from Meta API response to internal model
   */
  static adaptInsightsResult(rawResult: any): MetaInsightsResult {
    return {
      success: !!rawResult.data,
      data: Array.isArray(rawResult.data) ? rawResult.data : []
    };
  }
  
  /**
   * Create a sanitized version of MetaPage safe for frontend use
   * (excludes access tokens)
   */
static adaptPageForFrontend(pageData: any): Omit<MetaPage, 'accessToken'> & { 
     accessTokenPresent: boolean 
   } {
   return {
      id: pageData.id || '',
      name: pageData.name || '',
      category: pageData.category || undefined,
      instagramBusinessAccount: pageData.instagramBusinessAccount ? {
        id: pageData.instagramBusinessAccount.id || '',
        username: pageData.instagramBusinessAccount.username || '',
        name: pageData.instagramBusinessAccount.name || undefined,
        profilePictureUrl: pageData.instagramBusinessAccount.profilePictureUrl || undefined
      } : undefined,
      accessTokenPresent: !!pageData.accessToken
    };
   }
  
  /**
   * Create a sanitized version of MetaConnectionState safe for frontend use
   * (excludes access tokens)
   */
static adaptConnectionStateForFrontend(state: MetaConnectionState): Omit<MetaConnectionState, 'pages'> & {
     pages: Array<Omit<MetaPage, 'accessToken'> & { 
       accessTokenPresent: boolean 
     }>;
   } {
     return {
       isConnected: state.isConnected,
       user: state.user,
       pages: state.pages.map(page => ({
         id: page.id,
         name: page.name,
         category: page.category,
         // Important: DO NOT include accessToken in frontend state
         instagramBusinessAccount: page.instagramBusinessAccount ? {
           id: page.instagramBusinessAccount.id,
           username: page.instagramBusinessAccount.username,
           name: page.instagramBusinessAccount.name,
           profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl
         } : undefined,
         accessTokenPresent: !!page.accessToken
       })),
       selectedPageId: state.selectedPageId,
       selectedInstagramId: state.selectedInstagramId,
       tokenExpiresAt: state.tokenExpiresAt,
       connectedAt: state.connectedAt,
       lastRefreshedAt: state.lastRefreshedAt,
       error: state.error
     };
   }
}