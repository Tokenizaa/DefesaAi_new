// PagBank Webhooks - Robust webhook handler with HMAC verification and idempotency
// Based on DefesAi v1 implementation

import { PagBankApiError } from './types';
import type {
  PagBankOrderResponse,
  PagBankCharge,
  PagBankQRCode,
  PagBankPaymentMethod,
  PagBankEnvironment,
  PagBankErrorResponse,
} from './types';
import { pagbankServer } from './client.server';
import { mapearStatusPagBank } from './types';
import { supabase } from '../../../lib/supabase';

// Verify HMAC signature (PagBank signature header)
function verifyHmacSignature(
  body: string,
  signatureHeader: string
): boolean {
  const crypto = require('node:crypto');
  const expectedSignature = signatureHeader.replace('sha256=', '');
  
  const hmac = crypto.createHmac('sha256', process.env.PAGBANK_WEBHOOK_SECRET || 'secret');
  hmac.update(body);
  
  const calculatedSignature = hmac.digest('hex');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(expectedSignature)
  );
}

// Process webhook payload
async function processWebhook(payload: any): Promise<void> {
  try {
    // Validate payload structure
    if (!payload.order_id || !payload.charge_id || !payload.status) {
      throw new Error('Invalid webhook payload: missing required fields');
    }

    if (!supabase) {
      console.log('[PagBank] Supabase not configured, processed in memory:', payload.order_id);
      return;
    }

    // Check if we've already processed this webhook
    const { data: existing } = await (supabase as any)
      .from('payment_events')
      .select('id')
      .eq('payload_id', payload.id)
      .single();

    if (existing) {
      console.log('[PagBank] Webhook already processed, skipping:', payload.id);
      return;
    }

    // Find the order in our database
    const { data: order } = await (supabase as any)
      .from('payment_orders')
      .select('*')
      .eq('pagbank_order_id', payload.order_id)
      .single();

    if (!order) {
      console.warn('[PagBank] Order not found in our database:', payload.order_id);
      return;
    }

    // Update order status based on webhook status
    const newStatus = mapearStatusPagBank(payload.status);
    const { error } = await (supabase as any)
      .from('payment_orders')
      .update({ status: newStatus, status_detail: payload.status })
      .eq('pagbank_order_id', payload.order_id);

    if (error) throw error;

    // Save webhook event for audit
    const { error: eventError } = await (supabase as any).from('payment_events').insert({
      payment_id: order.id,
      event_type: 'status_changed',
      payload,
      idempotency_key: payload.id,
      created_at: new Date().toISOString(),
    });

    if (eventError) throw eventError;

    console.log('[PagBank] Webhook processed successfully:', payload.order_id, payload.status);
  } catch (error) {
    console.error('[PagBank] Webhook processing error:', error);
    // We don't throw to avoid retry loops - PagBank will retry automatically
  }
}

// Main webhook handler
async function handlePagBankWebhook(
  request: any,
  response: any
): Promise<void> {
  try {
    // Verify HMAC signature
    const signatureHeader = request.headers ? (request.headers['x-pagbank-signature'] || request.headers.get?.('x-pagbank-signature')) : null;
    if (!signatureHeader) {
      throw new PagBankApiError('Missing x-pagbank-signature header', 400, {
        error_messages: [{ error: 'Missing signature header', description: 'Missing x-pagbank-signature header' }],
      });
    }

    const body = typeof request.text === 'function' ? await request.text() : JSON.stringify(request.body);
    if (!verifyHmacSignature(body, signatureHeader)) {
      throw new PagBankApiError('Invalid signature', 401, {
        error_messages: [{ error: 'Invalid HMAC signature', description: 'Webhook HMAC signature mismatch' }],
      });
    }

    // Parse JSON payload
    const payload = typeof body === 'string' ? JSON.parse(body) : body;

    // Process the webhook
    await processWebhook(payload);

    // Return 200 OK to acknowledge receipt
    response.status(200).send('Webhook processed');
  } catch (error: any) {
    if (error instanceof PagBankApiError) {
      response.status(error.status).send(error.message);
    } else {
      console.error('[PagBank] Unexpected webhook error:', error);
      response.status(500).send('Internal server error');
    }
  }
}

// Helper to get webhook ID from payload
function getWebhookId(payload: any): string {
  return payload.id || payload.order_id || payload.charge_id || 'unknown';
}

// Export the handler for API routes
export { handlePagBankWebhook, processWebhook };
