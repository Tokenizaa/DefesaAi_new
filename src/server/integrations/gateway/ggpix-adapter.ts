/**
 * @file gateway/ggpix-adapter.ts
 * GGPIXAPI Adapter — Implementa PaymentGateway para o gateway GGPIXAPI.
 *
 * Integra PIX In via API REST do GGPIXAPI (https://ggpixapi.com/api/v1).
 * Credenciais ficam APENAS no backend (X-API-Key header), conforme orientação
 * oficial da GGPIXAPI: https://ggpixapi.com/docs/
 *
 * O GGPIXAPI suporta apenas PIX In (não tem cartão de crédito).
 * createCreditCard lança Error — o Checkout deve desabilitar a aba Cartão
 * quando o gateway ativo for GGPIXAPI.
 *
 * Webhooks do GGPIXAPI:
 * - Enviamos X-API-Key no header
 * - Payload: { transactionId, externalId, status, type, amount, netAmount, gatewayFee, paidAt, ... }
 * - Não há assinatura HMAC — identificação por externalId e idempotência
 */

import QRCode from 'qrcode';
import { eventBus, EventTopics } from '../../../core/events/topics';
import { logger } from '../../observability/logger';
import {
  PaymentGateway,
  GatewayId,
  GatewayCreatePixInput,
  GatewayCreateCreditCardInput,
  GatewayPixResult,
  GatewayCreditCardResult,
  GatewayPaymentStatus,
  GatewayPaymentStatusResult,
  NormalizedWebhookEvent,
} from './types';

// ============================================================================
// Configuração
// ============================================================================

const GGRAPI_BASE_URL = 'https://ggpixapi.com/api/v1';
const GGRAPI_BACKUP_URL = 'https://ggatepixapi.com/api/v1';

function getConfig() {
  return {
    apiKey: process.env.GGPIX_API_KEY || '',
    appUrl: process.env.APP_URL || 'https://defesai.com.br',
    enabled: process.env.GGPIX_ENABLED === 'true',
  };
}

// ============================================================================
// Tipos internos do GGPIXAPI (baseado na documentação GGpixpay.md)
// ============================================================================

interface GGPixInResponse {
  id: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED' | 'CANCELED';
  amount: number;
  pixCode: string;
  pixCopyPaste: string;
  externalId?: string;
  createdAt: string;
  fees?: {
    total: number;
    netAmount: number;
  };
  splits?: unknown[];
}

interface GGWebhookPayload {
  transactionId: string;
  externalId?: string;
  status: 'COMPLETE' | 'FAILED' | 'CANCELED' | 'PENDING';
  type: string;
  amount: number;
  netAmount?: number;
  gatewayFee?: number;
  paidAt?: string;
  createdAt?: string;
  merchantId?: string;
}

// ============================================================================
// Mapeamento de Status
// ============================================================================

function mapGGPixStatus(status: string): GatewayPaymentStatus {
  const map: Record<string, GatewayPaymentStatus> = {
    PENDING: 'PENDING',
    COMPLETE: 'PAID',
    FAILED: 'DECLINED',
    CANCELED: 'CANCELED',
  };
  return map[status] || 'PENDING';
}

// ============================================================================
// HTTP Client (resiliente com fallback de domínio)
// ============================================================================

async function ggFetch(
  path: string,
  options: RequestInit = {},
  config: ReturnType<typeof getConfig> = getConfig()
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey,
    ...options.headers,
  };

  // Tentar host principal primeiro
  try {
    const res = await fetch(`${GGRAPI_BASE_URL}${path}`, { ...options, headers });
    if (res.ok || res.status < 500) return res;
    // 5xx → tentar contingência
    throw new Error(`Server error ${res.status}`);
  } catch (err) {
    logger.warn('payments', 'ggpix', 'gg_fetch', 'Primary host failed, trying contingency', {
      error: String(err),
    });
    const res = await fetch(`${GGRAPI_BACKUP_URL}${path}`, { ...options, headers });
    return res;
  }
}

// ============================================================================
// Adapter
// ============================================================================

export class GGPIXAdapter implements PaymentGateway {
  readonly id: GatewayId = 'ggpixapi';
  readonly displayName = 'GGPIXAPI (PIX)';

  isConfigured(): boolean {
    const config = getConfig();
    return config.enabled && Boolean(config.apiKey);
  }

  async createPix(input: GatewayCreatePixInput): Promise<GatewayPixResult> {
    const config = getConfig();
    if (!this.isConfigured()) {
      throw new Error('GGPIXAPI não está configurado. Configure GGPIX_API_KEY e GGPIX_ENABLED=true.');
    }

    const webhookUrl = input.webhookUrl || `${config.appUrl.replace(/\/$/, '')}/api/webhooks/ggpix`;

    const response = await ggFetch('/pix/in', {
      method: 'POST',
      body: JSON.stringify({
        amountCents: input.amountInCents,
        description: input.description,
        payerName: input.payer.name || 'Condutor DefesAi',
        payerDocument: (input.payer.document || '12345678909').replace(/\D/g, ''),
        externalId: input.referenceId || `defesai_case_${input.caseId}_${Date.now()}`,
        webhookUrl,
        payerEmail: input.payer.email,
        payerPhone: input.payer.phone,
      }),
    }, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      const errorMsg = (errorData as any).error || `GGPIXAPI retornou status ${response.status}`;
      logger.error('payments', 'ggpix', 'create_pix', 'GGPIXAPI PIX In failed', {
        httpStatus: response.status,
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const data: GGPixInResponse = await response.json();

    // Gerar QR Code localmente a partir do pixCopyPaste
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(data.pixCopyPaste, {
        width: 280,
        margin: 2,
        color: { dark: '#071D41', light: '#ffffff' },
      });
    } catch (err) {
      logger.warn('payments', 'ggpix', 'qr_generation', 'QR Code generation error', { error: String(err) });
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      gatewayTransactionId: data.id,
      referenceId: data.externalId || input.referenceId || '',
      gateway: 'ggpixapi',
      status: mapGGPixStatus(data.status),
      amountInCents: data.amount,
      pixCopyPaste: data.pixCopyPaste,
      qrCodeDataUrl,
      qrCodeUrl: undefined,
      expiresAt,
      createdAt: data.createdAt || new Date().toISOString(),
      feeInCents: data.fees?.total,
      netAmountInCents: data.fees?.netAmount,
    };
  }

  async createCreditCard(_input: GatewayCreateCreditCardInput): Promise<GatewayCreditCardResult> {
    throw new Error(
      'GGPIXAPI não suporta pagamento com cartão de crédito. ' +
      'Para usar cartão, altere o gateway ativo para PagBank nas configurações.'
    );
  }

  async getPaymentStatus(gatewayTransactionId: string): Promise<GatewayPaymentStatusResult> {
    const config = getConfig();

    const response = await ggFetch(`/transactions/${gatewayTransactionId}`, {
      method: 'GET',
    }, config);

    if (!response.ok) {
      logger.warn('payments', 'ggpix', 'get_status', 'Transaction query failed', {
        transactionId: gatewayTransactionId,
        httpStatus: response.status,
      });
      return {
        gatewayTransactionId,
        gateway: 'ggpixapi',
        status: 'PENDING',
      };
    }

    const data = await response.json() as {
      id: string;
      status: string;
      paidAt?: string;
    };

    return {
      gatewayTransactionId,
      gateway: 'ggpixapi',
      status: mapGGPixStatus(data.status),
      paidAt: data.paidAt,
    };
  }

  processWebhook(
    _rawBody: string,
    _headers: Record<string, string | undefined>,
    body: unknown
  ): NormalizedWebhookEvent {
    const payload = body as GGWebhookPayload;

    return {
      gatewayEventId: `ggpix_${payload.transactionId}_${payload.status}_${Date.now()}`,
      gateway: 'ggpixapi',
      gatewayTransactionId: payload.transactionId,
      referenceId: payload.externalId || undefined,
      status: mapGGPixStatus(payload.status),
      transactionType: payload.type || 'PIX_IN',
      amountInCents: payload.amount,
      netAmountInCents: payload.netAmount,
      gatewayFeeInCents: payload.gatewayFee,
      paidAt: payload.paidAt,
      rawPayload: body,
      isDuplicate: false, // GGPIXAPI não tem HMAC, idempotência por externalId
    };
  }

  simulateConfirmation(caseId: string, amountInCents?: number): GatewayPixResult {
    // Para sandbox/testing: simula uma confirmação de pagamento
    const simulatedId = `ggpix_sim_${Date.now()}`;
    const referenceId = `defesai_case_${caseId}`;

    return {
      gatewayTransactionId: simulatedId,
      referenceId,
      gateway: 'ggpixapi',
      status: 'PAID',
      amountInCents: amountInCents || 9700,
      pixCopyPaste: '',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}

export const ggpixAdapter = new GGPIXAdapter();
