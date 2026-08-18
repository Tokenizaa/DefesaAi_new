import { 
  MetaWebhookEvent,
  MetaError
} from '../types';

/**
 * Meta Webhooks Service - Handles verification, parsing, and processing of Meta webhooks
 */
export class MetaWebhooksService {
  private verifyToken: string;
  
  constructor(verifyToken: string) {
    this.verifyToken = verifyToken;
  }
  
  /**
   * Verify the webhook request from Meta
   * Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge
   */
  verifyWebhookRequest(queryParams: Record<string, string>): { verified: true; challenge: string } | { verified: false; reason: string } {
    const mode = queryParams['hub.mode'];
    const token = queryParams['hub.verify_token'];
    const challenge = queryParams['hub.challenge'];
    
    // Check if this is a verification request
    if (mode === 'subscribe' && token === this.verifyToken) {
      if (typeof challenge !== 'string') {
        return { verified: false, reason: 'Missing or invalid challenge parameter' };
      }
      return { verified: true, challenge };
    }
    
    return { verified: false, reason: 'Verification failed: mode or token mismatch' };
  }
  
  /**
   * Parse and validate incoming webhook payload
   */
  parseWebhookPayload(payload: any): { valid: true; event: MetaWebhookEvent } | { valid: false; error: string } {
    try {
      // Basic validation
      if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Invalid payload: must be an object' };
      }
      
      if (!payload.object) {
        return { valid: false, error: 'Invalid payload: missing "object" field' };
      }
      
      if (!Array.isArray(payload.entry)) {
        return { valid: false, error: 'Invalid payload: "entry" must be an array' };
      }
      
      // Additional validation could go here based on the object type
      // For now, we'll assume the payload is valid if it has the basic structure
      
      // Cast to our event type (in a real implementation, we would do more thorough validation)
      const event = payload as MetaWebhookEvent;
      
      return { valid: true, event };
    } catch (error) {
      return { valid: false, error: `Failed to parse webhook payload: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  /**
   * Process a parsed webhook event and extract actionable information
   */
  async processWebhookEvent(event: MetaWebhookEvent): Promise<{
    success: true;
    actions: string[];
    processingTimeMs: number;
  } | {
    success: false;
    error: string;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const actions: string[] = [];
    
    try {
      // Process based on object type
      if (event.object === 'page') {
        // Handle Facebook Page webhooks
        for (const entry of event.entry) {
          const pageId = entry.id;
          const timestamp = new Date(entry.time * 1000).toISOString(); // Convert seconds to milliseconds
          
          // Handle various entry types
if (entry.messaging) {
             // Handle messages
             for (const messaging of entry.messaging) {
               actions.push(`Received message from user ${messaging.sender?.id} on page ${pageId} at ${timestamp}`);
               // In a real implementation, we would:
               // - Store the message
               // - Trigger notifications
               // - Potentially auto-respond based on rules
             }
           }
          
          if (entry.standby) {
            // Handle standby messages (messages from users who messaged the page before)
            for (const standby of entry.standby) {
              actions.push(`Processed standby message for page ${pageId} at ${timestamp}`);
            }
          }
          
          if (entry.checkin_whitelists) {
            // Handle checkin whitelist changes
            actions.push(`Processed checkin whitelist update for page ${pageId} at ${timestamp}`);
          }
          
          if (entry.message_reactions) {
            // Handle message reactions (likes, loves, etc. on messages)
            for (const reaction of entry.message_reactions) {
              actions.push(`Processed message reaction for page ${pageId} at ${timestamp}`);
            }
          }
          
          if (entry.message_deliveries) {
            // Handle message delivery receipts
            for (const delivery of entry.message_deliveries) {
              actions.push(`Processed message delivery for page ${pageId} at ${timestamp}`);
            }
          }
          
          if (entry.message_reads) {
            // Handle message read receipts
            for (const read of entry.message_reads) {
              actions.push(`Processed message read for page ${pageId} at ${timestamp}`);
            }
          }
          
          if (entry.optins) {
            // Handle optins (users opting in to receive messages)
            for (const optin of entry.optins) {
              actions.push(`Processed user optin for page ${pageId} at ${timestamp}`);
            }
          }
          
          // Handle changes-based format (newer)
          if (entry.changes) {
            for (const change of entry.changes) {
              actions.push(`Processed change '${change.field}' for page ${pageId} at ${timestamp}`);
              // In a real implementation, we would handle different change types:
              // - feed: new posts to the page's feed
              // - comments: new comments on page posts
              // - etc.
            }
          }
        }
      } else if (event.object === 'instagram') {
        // Handle Instagram webhooks
        for (const entry of event.entry) {
          const igAccountId = entry.id; // Instagram Account ID
          const timestamp = new Date(entry.time * 1000).toISOString(); // Convert seconds to milliseconds
          
          // Handle various entry types
          if (entry.messaging) {
            // Handle Instagram Direct messages
            for (const messaging of entry.messaging) {
              actions.push(`Received Instagram Direct message from user ${messaging.sender?.id} for account ${igAccountId} at ${timestamp}`);
              // In a real implementation, we would:
              // - Store the message
              // - Trigger notifications
              // - Potentially auto-respond based on rules
            }
          }
          
          // Handle changes-based format (newer)
          if (entry.changes) {
            for (const change of entry.changes) {
              actions.push(`Processed change '${change.field}' for Instagram account ${igAccountId} at ${timestamp}`);
              // In a real implementation, we would handle different change types:
              // - comments: new comments on media
              // - media: new media published
              // - insights: insights updates
              // - etc.
            }
          }
        }
      } else {
        return {
          success: false,
          error: `Unsupported webhook object type: ${event.object}`,
          processingTimeMs: Date.now() - startTime
        };
      }
      
      return {
        success: true,
        actions,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
        processingTimeMs: Date.now() - startTime
      };
    }
  }
  
  /**
   * Handle error responses
   */
  private handleError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}