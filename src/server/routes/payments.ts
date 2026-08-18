import { Router, Request, Response } from 'express';
import { pagBankIntegration } from '../integrations/pagbank';
import { gatewayManager, processGatewayWebhook } from '../integrations/gateway';
import { commercialService } from '../commercial/commercial-service';
import { databaseRows, auditLogs } from '../app';
import { CanonicalMapper } from '../../core/mappers/canonical-mapper';
import { eventBus, EventTopics } from '../../core/events/topics';
import { logger } from '../observability/logger';
import { CaseDomain } from '../../types';

const router = Router();

// Middleware to capture raw body for webhook signature verification
router.use('/webhooks/pagbank', (req: Request, res: Response, next) => {
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { rawBody += chunk; });
  req.on('end', () => {
    (req as any).rawBody = rawBody;
    next();
  });
});

// Raw body middleware for GGPIXAPI webhooks (no HMAC, but needs raw for logging)
router.use('/webhooks/ggpix', (req: Request, res: Response, next) => {
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { rawBody += chunk; });
  req.on('end', () => {
    (req as any).rawBody = rawBody;
    next();
  });
});

// Official PagBank Integration (Orders, PIX & Webhooks)
router.post('/pagbank/orders', async (req, res) => {
  try {
    const { caseId, customerName, customerEmail, customerCpf, amount = 89.90 } = req.body;
    
    const orderResult = await pagBankIntegration.createPixOrder({
      caseId: caseId || `case_${Date.now()}`,
      customer: {
        name: customerName || 'Condutor DefesAi',
        email: customerEmail || 'contato@defesai.com.br',
        taxId: customerCpf || '12345678909',
      },
      amount: Number(amount),
    });

    // Update case with payment reference if existing
    if (caseId) {
      const row = databaseRows.get(caseId);
      if (row) {
        const domain = CanonicalMapper.rowToDomain(row);
        domain.payment = {
          status: 'pending',
          amount: Number(amount),
          transactionId: orderResult.orderId,
          paymentMethod: 'pix',
        };
        const updatedRow = CanonicalMapper.domainToRow(domain);
        databaseRows.set(caseId, updatedRow);
      }
    }

    res.json({
      success: true,
      order: orderResult,
      pixCopyPasteString: orderResult.qrCodeText,
      qrCodeDataUrl: orderResult.qrCodeDataUrl,
      txId: orderResult.orderId,
      status: 'aguardando_pagamento',
    });
  } catch (error: any) {
    logger.error('payments', 'pagbank', 'create_pix_order', 'Error creating PIX order', { error: error.message });
    res.status(500).json({ error: error.message || 'Erro ao gerar pedido PagBank' });
  }
});

// Alias for existing frontend compatibility — now gateway-agnostic
router.post('/pix/create', async (req, res) => {
  try {
    const { caseId, amount = 89.90, customerCpf, customerName, customerEmail } = req.body;

    // Usar o gateway ativo (PagBank ou GGPIXAPI)
    const gateway = gatewayManager.getActiveGateway();
    const appUrl = process.env.APP_URL || 'https://defesai.com.br';

    const pixResult = await gateway.createPix({
      caseId: caseId || `case_${Date.now()}`,
      amountInCents: Math.round(Number(amount) * 100),
      description: 'DefesaAi - Minuta Jurídica',
      referenceId: `defesai_case_${caseId || Date.now()}`,
      payer: {
        name: customerName || 'Condutor DefesAi',
        email: customerEmail || 'contato@defesai.com.br',
        document: customerCpf || '12345678909',
      },
      webhookUrl: `${appUrl}/api/webhooks/${gateway.id === 'ggpixapi' ? 'ggpix' : 'pagbank'}`,
    });

    logger.info('payments', 'gateway', 'create_pix', `PIX created via ${gateway.id}`, {
      caseId,
      gatewayTransactionId: pixResult.gatewayTransactionId,
      gateway: gateway.id,
    });

    res.json({
      success: true,
      txId: pixResult.gatewayTransactionId,
      amount: pixResult.amountInCents / 100,
      pixCopyPasteString: pixResult.pixCopyPaste,
      qrCodeDataUrl: pixResult.qrCodeDataUrl,
      expiresInMinutes: 30,
      status: 'aguardando_pagamento',
      gateway: gateway.id,
      order: pixResult,
    });
  } catch (err: any) {
    logger.error('payments', 'gateway', 'create_pix_order_alias', 'Error creating PIX order', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Credit Card Order Creation Endpoint — gateway-agnostic
router.post('/credit-card/create', async (req, res) => {
  try {
    const {
      caseId,
      customerName,
      customerEmail,
      customerCpf,
      amount = 89.90,
      installments = 1,
      cardToken,
      authenticationMethod = 'CHALLENGE',
      softDescriptor
    } = req.body;

    if (!cardToken) {
      return res.status(400).json({ error: 'cardToken é obrigatório para pagamento com cartão de crédito' });
    }

    const gateway = gatewayManager.getActiveGateway();

    // GGPIXAPI não suporta cartão — retornar erro claro
    if (gateway.id !== 'pagbank') {
      return res.status(400).json({
        error: 'Gateway ativo não suporta pagamento com cartão de crédito.',
        message: `O gateway '${gateway.displayName}' só aceita PIX. Altere o gateway para PagBank nas configurações de pagamento.`,
        gateway: gateway.id,
        supportedMethods: ['pix'],
      });
    }

    const orderResult = await pagBankIntegration.createCreditCardOrder({
      caseId: caseId || `case_${Date.now()}`,
      customer: {
        name: customerName || 'Condutor DefesAi',
        email: customerEmail || 'contato@defesai.com.br',
        taxId: customerCpf || '12345678909',
      },
      amount: Number(amount),
      installments: Number(installments),
      cardToken,
      authenticationMethod,
      softDescriptor,
    });

    // Update case with payment reference if existing
    if (caseId) {
      const row = databaseRows.get(caseId);
      if (row) {
        const domain = CanonicalMapper.rowToDomain(row);
        domain.payment = {
          status: 'pending',
          amount: Number(amount),
          transactionId: orderResult.orderId,
          paymentMethod: 'credit_card',
        };
        const updatedRow = CanonicalMapper.domainToRow(domain);
        databaseRows.set(caseId, updatedRow);
      }
    }

    logger.info('payments', 'gateway', 'create_credit_card_order', 'Credit card order endpoint called', {
      caseId,
      status: 'success',
      metadata: {
        orderId: orderResult.orderId,
        orderStatus: orderResult.status,
        threeDsRequired: orderResult.threeDsChallengeRequired,
        gateway: 'pagbank',
      },
    });

    res.json({
      success: true,
      order: orderResult,
      txId: orderResult.orderId,
      status: orderResult.threeDsChallengeRequired ? 'aguardando_3ds' : 'autorizado',
      threeDsUrl: orderResult.threeDsUrl,
      threeDsChallengeRequired: orderResult.threeDsChallengeRequired,
    });
  } catch (error: any) {
    logger.error('payments', 'gateway', 'create_credit_card_order', 'Error creating credit card order', { error: error.message });
    res.status(500).json({ error: error.message || 'Erro ao gerar pedido de cartão de crédito' });
  }
});

// PagBank Order Status polling endpoint
router.get('/pagbank/orders/:id', (req, res) => {
  const order = pagBankIntegration.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido PagBank não encontrado' });
  }
  res.json(order);
});

// PagBank Official Webhook with HMAC-SHA256 Signature Verification & Idempotency
router.post('/webhooks/pagbank', (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const payload = req.body;
    const signature = req.headers['x-hub-signature-256'] as string || 
                     req.headers['x-pagbank-signature'] as string ||
                     req.headers['x-authenticity-token'] as string;

    const webhookResult = pagBankIntegration.processWebhook(rawBody, signature, payload);

    if (!webhookResult.signatureValid) {
      logger.error('payments', 'pagbank', 'webhook', 'Invalid signature - rejecting webhook', {
        eventId: payload.id,
      });
      return res.status(401).json({ error: 'Assinatura inválida', received: false });
    }

    if (webhookResult.caseId) {
      const row = databaseRows.get(webhookResult.caseId);
      if (row && webhookResult.status === 'PAID') {
        const domain = CanonicalMapper.rowToDomain(row);
        domain.isPaid = true;
        domain.paidAt = new Date().toISOString();
        domain.status = 'defesa_pronta';
        domain.currentStage = 3;
        
        const paymentMethod = payload.charges?.[0]?.payment_method?.type === 'CREDIT_CARD' ? 'credit_card' : 'pix';
        
        domain.payment = {
          status: 'approved',
          amount: payload.charges?.[0]?.amount?.value / 100 || 89.90,
          paidAt: new Date().toISOString(),
          transactionId: webhookResult.orderId,
          paymentMethod,
        };
        domain.timeline.push({
          id: `tl_webhook_${Date.now()}`,
          title: 'Pagamento Confirmado via Webhook PagBank',
          description: `Transação ${webhookResult.orderId} aprovada automaticamente pela instituição financeira.`,
          timestamp: new Date().toISOString(),
          type: 'payment',
        });

        const updatedRow = CanonicalMapper.domainToRow(domain);
        databaseRows.set(webhookResult.caseId, updatedRow);

        // Dispatch Commercial Payment Event (Calculates 3-level commissions & ledgers)
        commercialService.processPaymentConfirmationEvent({
          paymentId: webhookResult.orderId || `ord_${domain.id}`,
          caseId: domain.id,
          buyerUserId: domain.clientEmail || `usr_${domain.id.substring(0, 8)}`,
          buyerUserName: domain.clientName || 'Condutor DefesAi',
          grossAmount: domain.payment?.amount || 89.90,
          discountAmount: 0,
          effectivelyPaid: domain.payment?.amount || 89.90,
        });

        auditLogs.unshift({
          id: `audit_pay_${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: domain.clientName || 'Cliente',
          role: 'citizen',
          action: 'PAYMENT_CONFIRMED',
          targetResource: domain.id,
          ipHash: '3a88c42b109e',
          details: `Pagamento de R$ ${domain.payment?.amount || 89.90} via ${paymentMethod.toUpperCase()} PagBank confirmado.`,
          gdprCompliant: true,
        });
      }
    }

    res.status(200).json({ received: true, ...webhookResult });
  } catch (error: any) {
    logger.error('payments', 'pagbank', 'webhook', 'Webhook processing error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Simulate confirm for local testing / instant preview — gateway-agnostic
router.post('/pix/simulate-confirm', (req, res) => {
  const { caseId } = req.body;
  const row = databaseRows.get(caseId);
  if (!row) {
    return res.status(404).json({ error: 'Caso não encontrado' });
  }

  const gateway = gatewayManager.getActiveGateway();

  // Se o gateway suportar simulação (PagBank tem confirmPayment),
  // usar o fluxo existente; caso contrário, simular diretamente
  let orderId = `sim_${Date.now()}`;
  if (gateway.id === 'pagbank') {
    try {
      const confirmResult = pagBankIntegration.confirmPayment(caseId);
      orderId = confirmResult.order.orderId;
    } catch {
      // Se PagBank não estiver configurado, simula direto
    }
  } else {
    // Para GGPIXAPI (ou outros), simula confirmação direta
    const simResult = gateway.simulateConfirmation(caseId, 8990);
    orderId = simResult.gatewayTransactionId;
  }

  const domain = CanonicalMapper.rowToDomain(row);
  domain.isPaid = true;
  domain.paidAt = new Date().toISOString();
  domain.status = 'defesa_pronta';
  domain.currentStage = 3;
  domain.payment = {
    status: 'approved',
    amount: 89.90,
    paidAt: new Date().toISOString(),
    transactionId: orderId,
    paymentMethod: 'pix',
  };
  domain.updatedAt = new Date().toISOString();

  domain.timeline.push({
    id: `tl_pay_${Date.now()}`,
    title: `Pagamento PIX Compensado (${gateway.displayName})`,
    description: 'Acesso liberado à minuta jurídica formal para impressão e orientações de protocolo.',
    timestamp: new Date().toISOString(),
    type: 'payment',
  });

  const updatedRow = CanonicalMapper.domainToRow(domain);
  databaseRows.set(domain.id, updatedRow);

  // Dispatch Commercial Payment Event (Calculates 3-level commissions & ledgers)
  commercialService.processPaymentConfirmationEvent({
    paymentId: orderId || `ord_${domain.id}`,
    caseId: domain.id,
    buyerUserId: domain.clientEmail || `usr_${domain.id.substring(0, 8)}`,
    buyerUserName: domain.clientName || 'Condutor DefesAi',
    grossAmount: domain.payment?.amount || 89.90,
    discountAmount: 0,
    effectivelyPaid: domain.payment?.amount || 89.90,
  });

  auditLogs.unshift({
    id: `audit_pay_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: domain.clientName || 'Cliente',
    role: 'citizen',
    action: 'PAYMENT_CONFIRMED',
    targetResource: domain.id,
    ipHash: '3a88c42b109e',
    details: `Pagamento de R$ 89,90 via PIX ${gateway.displayName} confirmado.`,
    gdprCompliant: true,
  });

  res.json({
    success: true,
    message: 'Pagamento confirmado com sucesso!',
    case: domain,
    gateway: gateway.id,
    order: { orderId },
  });
});

// ============================================================================
// GGPIXAPI Webhook — gateway-agnostic via processGatewayWebhook()
// ============================================================================
router.post('/webhooks/ggpix', (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const payload = req.body;

    const result = processGatewayWebhook('/webhooks/ggpix', rawBody, req.headers as Record<string, string | undefined>, payload);

    if (!result) {
      logger.warn('payments', 'ggpix', 'webhook', 'GGPIXAPI webhook not recognized', {
        hasTransactionId: !!payload?.transactionId,
      });
      return res.status(400).json({ error: 'Webhook não reconhecido' });
    }

    const { event } = result;

    // Normalizar: extrair caseId do referenceId (formato: "defesai_case_{caseId}")
    const caseId = event.referenceId?.replace('defesai_case_', '') || null;

    if (caseId && event.status === 'PAID') {
      const row = databaseRows.get(caseId);
      if (row) {
        const domain = CanonicalMapper.rowToDomain(row);
        domain.isPaid = true;
        domain.paidAt = event.paidAt || new Date().toISOString();
        domain.status = 'defesa_pronta';
        domain.currentStage = 3;

        domain.payment = {
          status: 'approved',
          amount: (event.amountInCents || 8990) / 100,
          paidAt: event.paidAt || new Date().toISOString(),
          transactionId: event.gatewayTransactionId,
          paymentMethod: 'pix',
        };
        domain.timeline.push({
          id: `tl_webhook_${Date.now()}`,
          title: 'Pagamento Confirmado via Webhook GGPIXAPI',
          description: `Transação ${event.gatewayTransactionId} aprovada automaticamente pelo gateway GGPIXAPI.`,
          timestamp: new Date().toISOString(),
          type: 'payment',
        });

        const updatedRow = CanonicalMapper.domainToRow(domain);
        databaseRows.set(caseId, updatedRow);

        commercialService.processPaymentConfirmationEvent({
          paymentId: event.gatewayTransactionId || `ord_${domain.id}`,
          caseId: domain.id,
          buyerUserId: domain.clientEmail || `usr_${domain.id.substring(0, 8)}`,
          buyerUserName: domain.clientName || 'Condutor DefesAi',
          grossAmount: domain.payment?.amount || 89.90,
          discountAmount: 0,
          effectivelyPaid: domain.payment?.amount || 89.90,
        });

        auditLogs.unshift({
          id: `audit_pay_${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: domain.clientName || 'Cliente',
          role: 'citizen',
          action: 'PAYMENT_CONFIRMED',
          targetResource: domain.id,
          ipHash: '3a88c42b109e',
          details: `Pagamento de R$ ${(domain.payment?.amount || 89.90).toFixed(2)} via PIX GGPIXAPI confirmado.`,
          gdprCompliant: true,
        });
      }
    }

    res.status(200).json({ received: true, gatewayEventId: event.gatewayEventId });
  } catch (error: any) {
    logger.error('payments', 'ggpix', 'webhook', 'GGPIXAPI webhook processing error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Gateway Status — usado pelo Admin UI para exibir status dos gateways
// ============================================================================
router.get('/gateway/status', (req, res) => {
  const status = gatewayManager.getGatewayStatus();
  const activeId = gatewayManager.getActiveGatewayId();
  res.json({
    activeGateway: activeId,
    gateways: status,
  });
});

// ============================================================================
// Gateway Switch — Admin UI pode alternar gateway em runtime
// ============================================================================
router.post('/gateway/switch', (req, res) => {
  const { gatewayId } = req.body;
  if (!gatewayId) {
    return res.status(400).json({ error: 'gatewayId é obrigatório' });
  }

  const result = gatewayManager.setActiveGateway(gatewayId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ success: true, message: result.message, activeGateway: gatewayId });
});

export default router;