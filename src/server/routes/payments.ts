import { Router, Request, Response } from 'express';
import { pagBankIntegration } from '../integrations/pagbank';
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

// Alias for existing frontend compatibility
router.post('/pix/create', async (req, res) => {
  try {
    const { caseId, amount = 89.90, customerCpf, customerName, customerEmail } = req.body;
    const orderResult = await pagBankIntegration.createPixOrder({
      caseId: caseId || `case_${Date.now()}`,
      customer: {
        name: customerName || 'Condutor DefesAi',
        email: customerEmail || 'contato@defesai.com.br',
        taxId: customerCpf || '12345678909',
      },
      amount: Number(amount),
    });

    res.json({
      success: true,
      txId: orderResult.orderId,
      amount: orderResult.amount,
      pixCopyPasteString: orderResult.qrCodeText,
      qrCodeDataUrl: orderResult.qrCodeDataUrl,
      expiresInMinutes: 30,
      status: 'aguardando_pagamento',
      order: orderResult,
    });
  } catch (err: any) {
    logger.error('payments', 'pagbank', 'create_pix_order_alias', 'Error creating PIX order', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Credit Card Order Creation Endpoint (NEW FEATURE)
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

    logger.info('payments', 'pagbank', 'create_credit_card_order', 'Credit card order endpoint called', {
      caseId,
      status: 'success',
      metadata: {
        orderId: orderResult.orderId,
        orderStatus: orderResult.status,
        threeDsRequired: orderResult.threeDsChallengeRequired,
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
    logger.error('payments', 'pagbank', 'create_credit_card_order', 'Error creating credit card order', { error: error.message });
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

// Simulate confirm for local testing / instant preview
router.post('/pix/simulate-confirm', (req, res) => {
  const { caseId } = req.body;
  const row = databaseRows.get(caseId);
  if (!row) {
    return res.status(404).json({ error: 'Caso não encontrado' });
  }

  // Idempotent confirm through PagBank service
  const confirmResult = pagBankIntegration.confirmPayment(caseId);

  const domain = CanonicalMapper.rowToDomain(row);
  domain.isPaid = true;
  domain.paidAt = new Date().toISOString();
  domain.status = 'defesa_pronta';
  domain.currentStage = 3;
  domain.payment = {
    status: 'approved',
    amount: 89.90,
    paidAt: new Date().toISOString(),
    transactionId: confirmResult.order.orderId,
    paymentMethod: 'pix',
  };
  domain.updatedAt = new Date().toISOString();

  domain.timeline.push({
    id: `tl_pay_${Date.now()}`,
    title: 'Pagamento PIX Compensado (PagBank)',
    description: 'Acesso liberado à minuta jurídica formal para impressão e orientações de protocolo.',
    timestamp: new Date().toISOString(),
    type: 'payment',
  });

  const updatedRow = CanonicalMapper.domainToRow(domain);
  databaseRows.set(domain.id, updatedRow);

  // Dispatch Commercial Payment Event (Calculates 3-level commissions & ledgers)
  commercialService.processPaymentConfirmationEvent({
    paymentId: confirmResult.order.orderId || `ord_${domain.id}`,
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
    details: `Pagamento de R$ 89,90 via PIX PagBank confirmado.`,
    gdprCompliant: true,
  });

  res.json({
    success: true,
    message: 'Pagamento confirmado com sucesso!',
    case: domain,
    order: confirmResult.order,
  });
});

export default router;