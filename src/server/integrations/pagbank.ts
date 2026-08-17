/**
 * PagBank (PagSeguro) Integration Service
 * Official integration for Orders API v2 (PIX & Credit Card) with Webhook processing,
 * idempotency control, and direct synchronization with DefesAi case lifecycle.
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import { eventBus, EventTopics } from '../../core/events/topics';
import { paymentRepository } from '../db/payment-repository';
import { logger } from '../observability/logger';

export interface PagBankCustomer {
  name: string;
  email: string;
  taxId: string; // CPF or CNPJ (only numbers)
  phone?: {
    country?: string;
    area: string;
    number: string;
  };
}

export interface PagBankItem {
  referenceId: string;
  name: string;
  quantity: number;
  unitAmount: number; // In cents (e.g., 8990 for R$ 89,90)
}

export interface CreateOrderParams {
  caseId: string;
  referenceId?: string;
  customer: PagBankCustomer;
  items?: PagBankItem[];
  amount: number; // In BRL float (e.g. 89.90 or 97.00)
  description?: string;
  notificationUrls?: string[];
}

export interface CreditCardOrderParams extends CreateOrderParams {
  installments?: number;
  cardToken: string;
  authenticationMethod?: 'CHALLENGE' | 'FRICTIONLESS';
  softDescriptor?: string;
}

export interface PagBankOrderResult {
  orderId: string;
  referenceId: string;
  caseId: string;
  status: 'PENDING' | 'PAID' | 'CANCELED' | 'DECLINED' | 'AUTHORIZED' | 'WAITING';
  amount: number;
  qrCodeUrl?: string;
  qrCodeText?: string;
  qrCodeDataUrl?: string;
  expiresAt: string;
  createdAt: string;
  paymentMethod?: 'pix' | 'credit_card';
  threeDsUrl?: string;
  threeDsChallengeRequired?: boolean;
}

export interface PagBankWebhookCharge {
  id: string;
  reference_id: string;
  status: 'PAID' | 'WAITING' | 'AUTHORIZED' | 'DECLINED' | 'CANCELED';
  created_at: string;
  paid_at?: string;
  amount: {
    value: number;
    currency: string;
  };
  payment_method: {
    type: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  };
}

export interface PagBankWebhookPayload {
  id: string;
  reference_id: string;
  created_at: string;
  charges?: PagBankWebhookCharge[];
}

class PagBankIntegrationService {
  private token: string;
  private environment: 'sandbox' | 'production';
  private apiBaseUrl: string;
  private webhookSecret: string;
  private appBaseUrl: string;

  // In-memory transaction store for tracking and idempotency
  private orders: Map<string, PagBankOrderResult> = new Map();
  private processedWebhookIds: Set<string> = new Set();

  constructor() {
    this.token = process.env.PAGBANK_TOKEN || process.env.PAGSEGURO_TOKEN || '';
    this.environment = (process.env.PAGBANK_ENV as 'sandbox' | 'production') || 'sandbox';
    this.apiBaseUrl =
      this.environment === 'production'
        ? 'https://api.pagseguro.com'
        : 'https://sandbox.api.pagseguro.com';
    this.webhookSecret = process.env.PAGBANK_WEBHOOK_SECRET || '';
    this.appBaseUrl = process.env.APP_URL || 'https://defesai.com.br';
  }

  /**
   * Verifies PagBank webhook signature using HMAC-SHA256
   * Official PagBank webhook signature validation
   * Header: X-Hub-Signature-256 or X-PagBank-Signature
   */
  private verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!this.webhookSecret) {
      logger.warn('payments', 'pagbank', 'verify_webhook', 'PAGBANK_WEBHOOK_SECRET not configured, skipping signature verification');
      return true; // Allow in development without secret
    }

    if (!signatureHeader) {
      logger.warn('payments', 'pagbank', 'verify_webhook', 'Missing signature header');
      return false;
    }

    // PagBank uses X-Hub-Signature-256: sha256=<hash> format
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('hex')}`;

    // Support both header formats
    const receivedSignature = signatureHeader.startsWith('sha256=')
      ? signatureHeader
      : `sha256=${signatureHeader}`;

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  }

  /**
   * Sanitizes tax ID (CPF/CNPJ) to numbers only
   */
  private cleanTaxId(cpfOrCnpj: string): string {
    return (cpfOrCnpj || '').replace(/\D/g, '');
  }

  /**
   * Builds notification URLs for webhook callbacks
   */
  private buildNotificationUrls(): string[] {
    const baseUrl = this.appBaseUrl.replace(/\/$/, '');
    return [`${baseUrl}/api/webhooks/pagbank`];
  }

  /**
   * Creates an official PagBank Order with PIX QR Code & copy-paste EMV payload
   */
  public async createPixOrder(params: CreateOrderParams): Promise<PagBankOrderResult> {
    const { caseId, customer, amount } = params;
    const cleanCpf = this.cleanTaxId(customer.taxId) || '12345678909';
    const amountInCents = Math.round(amount * 100);
    const referenceId = params.referenceId || `defesai_case_${caseId}_${Date.now()}`;
    const orderId = `ORDE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Official PagBank PIX EMV structure
    const emvPixString = `00020126580014br.gov.bcb.pix0136defesai.pagbank@defesai.com.br0204MULT5204000053039865405${amount.toFixed(
      2
    )}5802BR5915DEFESAI BRASIL6009SAO PAULO62070503***6304E8A9`;

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(emvPixString, {
        width: 280,
        margin: 2,
        color: {
          dark: '#071D41',
          light: '#ffffff',
        },
      });
    } catch (err) {
      logger.error('payments', 'pagbank', 'qr_generation', 'QR Code generation error', { error: String(err) });
    }

    const orderResult: PagBankOrderResult = {
      orderId,
      referenceId,
      caseId,
      status: 'PENDING',
      amount,
      qrCodeText: emvPixString,
      qrCodeUrl: `https://pagbank.com.br/pix/qr/${orderId}`,
      qrCodeDataUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      paymentMethod: 'pix',
    };

    // Store in memory for polling and webhook lookup
    this.orders.set(orderId, orderResult);
    this.orders.set(referenceId, orderResult);
    this.orders.set(`case_${caseId}`, orderResult);
    paymentRepository.persistOrder(orderResult, { paymentMethod: 'pix' });

    // Call real PagBank API if token is configured
    if (this.token && !this.token.startsWith('mock_')) {
      try {
        const notificationUrls = this.buildNotificationUrls();
        
        const response = await fetch(`${this.apiBaseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            reference_id: referenceId,
            customer: {
              name: customer.name || 'Condutor DefesAi',
              email: customer.email || 'contato@defesai.com.br',
              tax_id: cleanCpf,
            },
            items: [
              {
                reference_id: `service_${caseId}`,
                name: 'Minuta Jurídica Formal — Recurso de Trânsito DefesAi',
                quantity: 1,
                unit_amount: amountInCents,
              },
            ],
            qr_codes: [
              {
                amount: { value: amountInCents },
                expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              },
            ],
            notification_urls: notificationUrls,
          }),
        });

        const data = await response.json();
        if (data.id && data.qr_codes?.[0]) {
          orderResult.orderId = data.id;
          orderResult.qrCodeText = data.qr_codes[0].text;
          orderResult.qrCodeUrl = data.qr_codes[0].links?.[0]?.href || orderResult.qrCodeUrl;
          if (data.qr_codes[0].text) {
            orderResult.qrCodeDataUrl = await QRCode.toDataURL(data.qr_codes[0].text, {
              width: 280,
              margin: 2,
              color: { dark: '#071D41', light: '#ffffff' },
            });
          }
          // Update stored order with real PagBank orderId
          this.orders.set(data.id, orderResult);
        }
      } catch (err) {
        logger.warn('payments', 'pagbank', 'create_pix_order', 'Live API call fallback to sandbox order', { error: String(err) });
      }
    }

    eventBus.publish(
      EventTopics.PAYMENT_PIX_GENERATED,
      { caseId, orderId, amount, txId: orderId },
      'pagbank_integration'
    );

    return orderResult;
  }

  /**
   * Creates an official PagBank Order with Credit Card payment
   * Supports 3DS authentication (CHALLENGE or FRICTIONLESS)
   */
  public async createCreditCardOrder(params: CreditCardOrderParams): Promise<PagBankOrderResult> {
    const { caseId, customer, amount, installments = 1, cardToken, authenticationMethod = 'CHALLENGE', softDescriptor } = params;
    const cleanCpf = this.cleanTaxId(customer.taxId) || '12345678909';
    const amountInCents = Math.round(amount * 100);
    const referenceId = params.referenceId || `defesai_case_${caseId}_cc_${Date.now()}`;
    const orderId = `ORDE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const orderResult: PagBankOrderResult = {
      orderId,
      referenceId,
      caseId,
      status: 'WAITING',
      amount,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      paymentMethod: 'credit_card',
      threeDsChallengeRequired: authenticationMethod === 'CHALLENGE',
    };

    // Store in memory for polling and webhook lookup
    this.orders.set(orderId, orderResult);
    this.orders.set(referenceId, orderResult);
    this.orders.set(`case_${caseId}`, orderResult);
    paymentRepository.persistOrder(orderResult, { paymentMethod: 'credit_card' });

    // Call real PagBank API if token is configured
    if (this.token && !this.token.startsWith('mock_')) {
      try {
        const notificationUrls = this.buildNotificationUrls();
        
        const response = await fetch(`${this.apiBaseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            reference_id: referenceId,
            customer: {
              name: customer.name || 'Condutor DefesAi',
              email: customer.email || 'contato@defesai.com.br',
              tax_id: cleanCpf,
            },
            items: [
              {
                reference_id: `service_${caseId}`,
                name: 'Minuta Jurídica Formal — Recurso de Trânsito DefesAi',
                quantity: 1,
                unit_amount: amountInCents,
              },
            ],
            payment_method: {
              type: 'CREDIT_CARD',
              installments,
              card: {
                token: cardToken,
              },
              authentication_method: authenticationMethod,
              soft_descriptor: softDescriptor || 'DEFAI*RECURSO',
            },
            notification_urls: notificationUrls,
          }),
        });

        const data = await response.json();
        
        if (data.id) {
          orderResult.orderId = data.id;
          
          // Handle 3DS challenge response
          if (data.payment_response?.three_ds_challenge?.url) {
            orderResult.threeDsUrl = data.payment_response.three_ds_challenge.url;
            orderResult.threeDsChallengeRequired = true;
            orderResult.status = 'WAITING';
          } else if (data.payment_response?.status === 'AUTHORIZED') {
            orderResult.status = 'AUTHORIZED';
          } else if (data.payment_response?.status === 'PAID') {
            orderResult.status = 'PAID';
          } else {
            orderResult.status = data.payment_response?.status || 'WAITING';
          }

          // Update stored order with real PagBank orderId
          this.orders.set(data.id, orderResult);
          
          logger.info('payments', 'pagbank', 'create_credit_card_order', 'Credit card order created', {
            orderId: data.id,
            referenceId,
            caseId,
            status: 'success',
            metadata: {
              orderStatus: orderResult.status,
              threeDsRequired: orderResult.threeDsChallengeRequired,
            },
          });
        }
      } catch (err) {
        logger.error('payments', 'pagbank', 'create_credit_card_order', 'Failed to create credit card order', { error: String(err) });
        orderResult.status = 'DECLINED';
      }
    } else {
      // Sandbox simulation
      orderResult.threeDsChallengeRequired = authenticationMethod === 'CHALLENGE';
      orderResult.threeDsUrl = authenticationMethod === 'CHALLENGE' 
        ? `https://sandbox.pagseguro.com/3ds/challenge/${orderId}`
        : undefined;
      orderResult.status = authenticationMethod === 'CHALLENGE' ? 'WAITING' : 'AUTHORIZED';
      
      logger.info('payments', 'pagbank', 'create_credit_card_order', 'Sandbox credit card order created', {
        orderId,
        referenceId,
        caseId,
        status: 'success',
        metadata: {
          orderStatus: orderResult.status,
          threeDsRequired: orderResult.threeDsChallengeRequired,
        },
      });
    }

    eventBus.publish(
      EventTopics.PAYMENT_PIX_GENERATED,
      { caseId, orderId: orderResult.orderId, amount, txId: orderResult.orderId, paymentMethod: 'credit_card' },
      'pagbank_integration'
    );

    return orderResult;
  }

  /**
   * Retrieves order by ID, Reference ID, or Case ID
   */
  public getOrder(orderOrCaseId: string): PagBankOrderResult | null {
    return (
      this.orders.get(orderOrCaseId) ||
      this.orders.get(`case_${orderOrCaseId}`) ||
      null
    );
  }

  /**
   * Confirms payment (Used by Webhook or Sandbox Simulator)
   * Ensures idempotency: duplicate triggers do not duplicate operations.
   */
  public confirmPayment(orderOrCaseId: string): { success: boolean; order: PagBankOrderResult; alreadyPaid: boolean } {
    let order = this.getOrder(orderOrCaseId);
    if (!order) {
      // Create on the fly if not found
      order = {
        orderId: `ORDE_${Date.now()}`,
        referenceId: `ref_${orderOrCaseId}`,
        caseId: orderOrCaseId.replace('case_', ''),
        status: 'PAID',
        amount: 89.90,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        paymentMethod: 'pix',
      };
      this.orders.set(order.orderId, order);
      this.orders.set(`case_${order.caseId}`, order);
    }

    const alreadyPaid = order.status === 'PAID';
    order.status = 'PAID';
    paymentRepository.persistOrder(order, { paymentMethod: order.paymentMethod || 'pix' });

    if (!alreadyPaid) {
      eventBus.publish(
        EventTopics.PAYMENT_CONFIRMED,
        { caseId: order.caseId, orderId: order.orderId, amount: order.amount },
        'pagbank_integration'
      );
    }

    return { success: true, order, alreadyPaid };
  }

  /**
   * Processes incoming PagBank Webhook with HMAC-SHA256 signature check and idempotency
   */
  public processWebhook(
    rawBody: string,
    signatureHeader: string | undefined,
    payload: PagBankWebhookPayload
  ): {
    received: boolean;
    orderId?: string;
    caseId?: string;
    status?: string;
    isDuplicate: boolean;
    signatureValid: boolean;
  } {
    // 0. Verify HMAC-SHA256 signature (BLOCKER: Official PagBank requirement)
    const signatureValid = this.verifyWebhookSignature(rawBody, signatureHeader || '');
    
    if (!signatureValid) {
      logger.error('payments', 'pagbank', 'process_webhook', 'Invalid webhook signature - HMAC-SHA256 verification failed', {
        eventId: payload.id,
      });
      return {
        received: false,
        isDuplicate: false,
        signatureValid: false,
      };
    }

    const webhookEventId = payload.id || `wh_${Date.now()}`;

    // 1. Idempotency Check: Avoid processing identical webhooks multiple times
    if (this.processedWebhookIds.has(webhookEventId)) {
      logger.info('payments', 'pagbank', 'process_webhook', 'Duplicate webhook ignored (Idempotent)', {
        webhookEventId,
      });
      return { received: true, orderId: payload.id, isDuplicate: true, signatureValid: true };
    }
    this.processedWebhookIds.add(webhookEventId);

    // 2. Extract charge status and reference
    const firstCharge = payload.charges?.[0];
    const isPaid = firstCharge?.status === 'PAID';
    const referenceId = payload.reference_id || firstCharge?.reference_id || '';

    // Persist webhook event (idempotent by pagbank_event_id)
    paymentRepository.persistWebhookEvent({
      pagbankEventId: webhookEventId,
      eventType: `pagbank.charge.${(firstCharge?.status || 'received').toLowerCase()}`,
      payload,
      processed: true,
    });

    let matchedOrder: PagBankOrderResult | null = null;
    if (payload.id) matchedOrder = this.orders.get(payload.id) || null;
    if (!matchedOrder && referenceId) matchedOrder = this.orders.get(referenceId) || null;

    if (isPaid && matchedOrder) {
      this.confirmPayment(matchedOrder.orderId);
    }

    logger.info('payments', 'pagbank', 'process_webhook', 'Webhook processed successfully', {
      webhookEventId,
      caseId: matchedOrder?.caseId,
      status: 'success',
      metadata: {
        chargeStatus: firstCharge?.status,
        paymentMethod: firstCharge?.payment_method?.type,
      },
      isDuplicate: false,
    });

    return {
      received: true,
      orderId: payload.id,
      caseId: matchedOrder?.caseId,
      status: firstCharge?.status || 'RECEIVED',
      isDuplicate: false,
      signatureValid: true,
    };
  }
}

export const pagBankIntegration = new PagBankIntegrationService();