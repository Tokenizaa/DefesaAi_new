import { 
  MetaAppConfig, 
  MetaOAuthTokens, 
  MetaUser, 
  MetaPage, 
  MetaConnectionState,
  MetaError
} from '../types';
import { MetaGraphApiClient } from '../client/metaClient';

/**
 * Meta Authentication Service - Handles OAuth flow, token management, and connection state
 */
export class MetaAuthService {
  private client: MetaGraphApiClient;
  private connectionState: MetaConnectionState = {
    isConnected: false,
    pages: []
  };
  
  constructor(config: MetaAppConfig) {
    this.client = new MetaGraphApiClient(config);
    
    // Try to load persisted connection state
    this.loadConnectionState();
  }
  
  /**
   * Get the current connection state
   */
  getConnectionState(): MetaConnectionState {
    return { ...this.connectionState }; // Return a copy to prevent direct mutation
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state: string = 'meta_auth_state'): string {
    return this.client.getAuthUrl(state);
  }
  
  /**
   * Handle OAuth callback - exchange code for tokens and fetch accounts
   */
  async handleOAuthCallback(code: string, redirectUri: string): Promise<MetaConnectionState> {
    try {
      // Exchange authorization code for access token
      const tokens = await this.client.exchangeCodeForToken(code, redirectUri);
      
      // Get user accounts and pages using the access token
      const { user, pages } = await this.client.getUserAccounts(tokens.accessToken);
      
      // Update connection state
      this.connectionState = {
        isConnected: true,
        user,
        pages,
        selectedPageId: pages.length > 0 ? pages[0].id : undefined,
        selectedInstagramId: 
          pages.length > 0 && pages[0].instagramBusinessAccount 
            ? pages[0].instagramBusinessAccount.id 
            : undefined,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
        connectedAt: new Date().toISOString(),
        lastRefreshedAt: new Date().toISOString()
      };
      
      // Persist connection state
      this.persistConnectionState();
      
      return this.getConnectionState();
} catch (error) {
       // Reset connection state on error
       this.connectionState = {
         isConnected: false,
         pages: []
       };
       
       throw new Error(
         error instanceof Error ? error.message : 'Failed to connect to Meta'
       );
     }
  }
  
  /**
   * Connect using a long-lived page access token (for system users)
   */
  async connectWithPageToken(
    pageAccessToken: string,
    pageId?: string,
    instagramAccountId?: string
  ): Promise<MetaConnectionState> {
    try {
      // Debug the token to get metadata
      const tokenInfo = await this.client.debugToken(pageAccessToken);
      
      // Validate token is valid and has required permissions
      if (!tokenInfo.data?.is_valid) {
        throw new Error('Invalid Meta access token');
      }
      
      // For simplicity, we'll fetch the accounts using this token
      // In a production system, you might want to validate the token belongs to the right app
      const { user, pages } = await this.client.getUserAccounts(pageAccessToken);
      
      // Filter pages if specific IDs were provided
      let filteredPages = pages;
      if (pageId) {
        filteredPages = pages.filter(page => page.id === pageId);
        if (filteredPages.length === 0) {
          throw new Error(`Page with ID ${pageId} not found or not accessible`);
        }
      }
      
      if (instagramAccountId) {
        // Further filter to pages that have the specified Instagram account
        filteredPages = filteredPages.filter(page => 
          page.instagramBusinessAccount?.id === instagramAccountId
        );
        if (filteredPages.length === 0) {
          throw new Error(`Instagram Account with ID ${instagramAccountId} not found`);
        }
      }
      
      // Update connection state
      this.connectionState = {
        isConnected: true,
        user,
        pages: filteredPages,
        selectedPageId: 
          pageId || 
          (filteredPages.length > 0 ? filteredPages[0].id : undefined),
        selectedInstagramId: 
          instagramAccountId ||
          (filteredPages.length > 0 && filteredPages[0].instagramBusinessAccount 
            ? filteredPages[0].instagramBusinessAccount.id 
            : undefined),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days for page tokens
        connectedAt: new Date().toISOString(),
        lastRefreshedAt: new Date().toISOString()
      };
      
      // Persist connection state
      this.persistConnectionState();
      
      return this.getConnectionState();
} catch (error) {
       // Reset connection state on error
       this.connectionState = {
         isConnected: false,
         pages: []
       };
       
       throw new Error(
         error instanceof Error ? error.message : 'Failed to connect with page token'
       );
     }
  }
  
  /**
   * Refresh the connection - validates token and updates page information
   */
  async refreshConnection(): Promise<MetaConnectionState> {
    if (!this.connectionState.isConnected || !this.connectionState.pages?.length) {
      throw new Error('No active connection to refresh');
    }
    
    try {
      // Get fresh token info from the first page's access token
      const firstPage = this.connectionState.pages[0];
      if (!firstPage.accessToken) {
        throw new Error('No access token available for refresh');
      }
      
      const tokenInfo = await this.client.debugToken(firstPage.accessToken);
      
      if (!tokenInfo.data?.is_valid) {
        throw new Error('Access token is no longer valid');
      }
      
      // Get updated accounts
      const { user, pages } = await this.client.getUserAccounts(firstPage.accessToken);
      
      // Update connection state with fresh data
      this.connectionState = {
        ...this.connectionState,
        user,
        pages,
        // Preserve selections if they still exist, otherwise default to first
        selectedPageId: 
          this.connectionState.selectedPageId && 
          pages.some(p => p.id === this.connectionState.selectedPageId)
            ? this.connectionState.selectedPageId
            : pages.length > 0 
              ? pages[0].id 
              : undefined,
        selectedInstagramId: 
          this.connectionState.selectedInstagramId && 
          pages.some(p => p.instagramBusinessAccount?.id === this.connectionState.selectedInstagramId)
            ? this.connectionState.selectedInstagramId
            : pages.length > 0 && pages[0].instagramBusinessAccount
              ? pages[0].instagramBusinessAccount.id
              : undefined,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        lastRefreshedAt: new Date().toISOString()
      };
      
      // Persist updated state
      this.persistConnectionState();
      
      return this.getConnectionState();
    } catch (error) {
      // Mark connection as having an error
      this.connectionState = {
        ...this.connectionState,
        error: error instanceof Error ? error.message : 'Unknown error during refresh'
      };
      
      this.persistConnectionState();
      
      throw error;
    }
  }
  
  /**
   * Disconnect and clear connection state
   */
  disconnect(): void {
    this.connectionState = {
      isConnected: false,
      user: undefined,
      pages: [],
      selectedPageId: undefined,
      selectedInstagramId: undefined,
      tokenExpiresAt: undefined,
      connectedAt: undefined,
      lastRefreshedAt: undefined,
      error: undefined
    };
    
    // Persist the cleared state
    this.persistConnectionState();
  }
  
  /**
   * Validate if the current connection is still valid
   */
  async isValid(): Promise<boolean> {
    if (!this.connectionState.isConnected || !this.connectionState.pages?.length) {
      return false;
    }
    
    try {
      // Try to refresh - if it succeeds, connection is valid
      await this.refreshConnection();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Load connection state from persistent storage
   * In a real implementation, this would load from database or secure storage
   */
  private loadConnectionState(): void {
    // For now, we'll start with an empty state
    // In a real app, this would load from encrypted storage or database
    // The meta-repository handles persistence to Supabase
    try {
      // Attempt to load from localStorage for demo purposes
      // In production, this should be more secure and/or handled by the backend
      // Only access localStorage in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedState = window.localStorage.getItem('meta_connection_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Validate the parsed state has required fields
          if (parsed && typeof parsed === 'object') {
            this.connectionState = {
              isConnected: parsed.isConnected || false,
              user: parsed.user,
              pages: parsed.pages || [],
              selectedPageId: parsed.selectedPageId,
              selectedInstagramId: parsed.selectedInstagramId,
              tokenExpiresAt: parsed.tokenExpiresAt,
              connectedAt: parsed.connectedAt,
              lastRefreshedAt: parsed.lastRefreshedAt,
              error: parsed.error
            };
            
            // Validate token expiration if present
            if (this.connectionState.tokenExpiresAt) {
              const expiresAt = new Date(this.connectionState.tokenExpiresAt).getTime();
              if (expiresAt < Date.now()) {
                // Token has expired, reset connection state
                this.connectionState = {
                  isConnected: false,
                  pages: []
                };
              }
            }
          }
        }
      }
    } catch (e) {
      // If loading fails, start with clean state
      console.warn('Failed to load Meta connection state from storage:', e);
      this.connectionState = {
        isConnected: false,
        pages: []
      };
    }
  }
  
  /**
   * Persist connection state to storage
   * In a real implementation, this would save to database or secure storage
   */
  private persistConnectionState(): void {
    try {
      // For demo purposes, save to localStorage
      // In production, sensitive data like tokens should never be stored in localStorage
      // This should be handled by the backend/repository layer
      // We'll store a sanitized version without tokens for frontend use
      // Only access localStorage in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const sanitizedState = {
          isConnected: this.connectionState.isConnected,
          user: this.connectionState.user,
          pages: this.connectionState.pages.map(page => ({
            id: page.id,
            name: page.name,
            category: page.category,
            // Don't include access_token in frontend state
            instagramBusinessAccount: page.instagramBusinessAccount ? {
              id: page.instagramBusinessAccount.id,
              username: page.instagramBusinessAccount.username,
              name: page.instagramBusinessAccount.name,
              profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl
            } : undefined
          })),
          selectedPageId: this.connectionState.selectedPageId,
          selectedInstagramId: this.connectionState.selectedInstagramId,
          tokenExpiresAt: this.connectionState.tokenExpiresAt,
          connectedAt: this.connectionState.connectedAt,
          lastRefreshedAt: this.connectionState.lastRefreshedAt,
          error: this.connectionState.error
        };
        
        window.localStorage.setItem('meta_connection_state', JSON.stringify(sanitizedState));
      }
    } catch (e) {
      console.warn('Failed to persist Meta connection state:', e);
    }
  }
  
  /**
   * Get a sanitized version of the connection state safe for frontend use
   * (excludes access tokens and other sensitive data)
   */
getSanitizedStateForFrontend(): Omit<MetaConnectionState, 'pages'> & {
     pages: Array<Omit<MetaPage, 'accessToken'> & { 
       accessTokenPresent: boolean 
     }>;
   } {
     return {
       isConnected: this.connectionState.isConnected,
       user: this.connectionState.user,
       pages: this.connectionState.pages.map(page => ({
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
       selectedPageId: this.connectionState.selectedPageId,
       selectedInstagramId: this.connectionState.selectedInstagramId,
       tokenExpiresAt: this.connectionState.tokenExpiresAt,
       connectedAt: this.connectionState.connectedAt,
       lastRefreshedAt: this.connectionState.lastRefreshedAt,
       error: this.connectionState.error
     };
   }
}