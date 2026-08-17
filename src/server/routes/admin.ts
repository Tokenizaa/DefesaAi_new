import { Router } from 'express';
import { databaseRows } from '../app';
import { CanonicalMapper } from '../../core/mappers/canonical-mapper';
import { metricsService } from '../observability/metrics-service';
import { healthService } from '../observability/health-service';
import { aiProviderManager } from '../observability/ai-provider-manager';
import { alertsService } from '../observability/alerts-service';
import { configService } from '../config/config-service';
import { commercialService } from '../commercial/commercial-service';
import { logger } from '../observability/logger';
import { caseRepository } from '../db/case-repository';
import { CaseDomain } from '../../types';
import { metaIntegration } from '../integrations/meta';

const router = Router();

// Dedicated Admin API Suite (Overview, Payments, Documents, AI, Integrations)
router.get('/admin/overview', async (req, res) => {
  const domains: CaseDomain[] = [];
  for (const row of databaseRows.values()) {
    domains.push(CanonicalMapper.rowToDomain(row));
  }

  const totalCases = domains.length;
  const analyzedCases = domains.filter((c) => Boolean(c.analysis) || (c.status as string) !== 'novo').length;
  const defenseReadyCases = domains.filter((c) => (c.status as string) === 'defense_ready' || (c.status as string) === 'defesa_pronta' || Boolean(c.defenseDraft)).length;
  const paidCases = domains.filter((c) => Boolean(c.isPaid) || (c.payment?.status as string) === 'paid' || (c.payment?.status as string) === 'approved').length;
  
  const totalRevenue = paidCases * 89.90;
  const conversionRate = totalCases > 0 ? ((paidCases / totalCases) * 100).toFixed(1) : '0.0';
  const analysisToDocRate = analyzedCases > 0 ? ((defenseReadyCases / analyzedCases) * 100).toFixed(1) : '0.0';

  const metricsOverview = metricsService.getOverview();
  const healthReport = await healthService.getHealth(false);

  res.json({
    metrics: {
      totalUsers: 8, // Seeded users in system
      newUsersToday: 2,
      totalCases,
      analyzedCases,
      defenseReadyCases,
      paidCases,
      totalRevenue,
      conversionRate: Number(conversionRate),
      analysisToDocRate: Number(analysisToDocRate),
      aiErrorRatePercent: metricsOverview.errorRatePercent,
      totalAiCalls: metricsOverview.totalAiRequests,
      pendingJobs: 0,
      systemUptimePercent: 99.98,
    },
    aiStatus: {
      primaryProvider: 'nvidia',
      fallbackProvider: '9router',
      nvidiaHealthy: healthReport.services.find(s => s.id === 'nvidia')?.status === 'HEALTHY',
      nineRouterHealthy: healthReport.services.find(s => s.id === '9router')?.status === 'HEALTHY',
      fallbackRatePercent: metricsOverview.fallbackRatePercent,
      p95LatencyMs: metricsOverview.p95LatencyMs,
    },
    integrationsHealth: {
      supabase: healthReport.services.find(s => s.id === 'supabase_db')?.status || 'HEALTHY',
      pagbank: healthReport.services.find(s => s.id === 'pagbank')?.status || 'HEALTHY',
      meta: healthReport.services.find(s => s.id === 'meta_graph')?.status || 'HEALTHY',
      ocr: healthReport.services.find(s => s.id === 'ocr_vision')?.status || 'HEALTHY',
    },
  });
});

router.get('/admin/payments', (req, res) => {
  const domains: CaseDomain[] = [];
  for (const row of databaseRows.values()) {
    domains.push(CanonicalMapper.rowToDomain(row));
  }

  // Combine pagBank stored orders and cases
  const paymentsList = domains.map((c, index) => {
    const isPaid = Boolean(c.isPaid) || (c.payment?.status as string) === 'paid' || (c.payment?.status as string) === 'approved';
    return {
      id: c.payment?.transactionId || `ord_pagbank_${c.id}`,
      caseId: c.id,
      caseTitle: c.title || `Recurso Auto ${c.infraction?.aitNumber || c.id}`,
      customerName: c.clientName || 'Condutor DefesAi',
      customerEmail: c.clientEmail || 'contato@defesai.com.br',
      customerCpf: c.clientCpf || '***.***.***-**',
      amount: c.payment?.amount || 89.90,
      status: isPaid ? 'PAID' : (c.payment?.status === 'pending' ? 'PENDING' : 'WAITING'),
      method: c.payment?.paymentMethod || 'PIX',
      createdAt: c.createdAt || new Date(Date.now() - (index + 1) * 3600000).toISOString(),
      paidAt: isPaid ? (c.paidAt || c.updatedAt || new Date().toISOString()) : null,
      externalId: `PAGBANK_TX_${c.id.substring(0, 10).toUpperCase()}`,
      infractionCode: c.infraction?.infractionCode || '745-50',
      organ: c.infraction?.autuadorBody || 'DETRAN',
    };
  });

  res.json({
    payments: paymentsList,
    totalCount: paymentsList.length,
    totalVolume: paymentsList.reduce((acc, p) => p.status === 'PAID' ? acc + p.amount : acc, 0),
    paidCount: paymentsList.filter(p => p.status === 'PAID').length,
    pendingCount: paymentsList.filter(p => p.status === 'PENDING' || p.status === 'WAITING').length,
  });
});

router.post('/admin/payments/simulate-webhook', (req, res) => {
  try {
    const { caseId, status = 'PAID', amount = 89.90 } = req.body;
    if (!caseId) {
      return res.status(400).json({ error: 'caseId é obrigatório' });
    }

    const row = databaseRows.get(caseId);
    if (!row) {
      return res.status(404).json({ error: 'Caso não encontrado' });
    }

    const domain = CanonicalMapper.rowToDomain(row);
    if (status === 'PAID') {
      domain.isPaid = true;
      domain.paidAt = new Date().toISOString();
      domain.status = 'defesa_pronta';
      domain.currentStage = 3;
      domain.payment = {
        status: 'approved',
        amount: Number(amount),
        paidAt: new Date().toISOString(),
        transactionId: `PAGBANK_ORDER_${Date.now()}`,
        paymentMethod: 'pix',
      };
      domain.timeline.push({
        id: `tl_admin_sim_${Date.now()}`,
        title: 'Pagamento Simulado via Admin',
        description: `Simulação de Webhook PagBank executada pelo administrador. Valor R$ ${amount}.`,
        timestamp: new Date().toISOString(),
        type: 'payment',
      });
    } else {
      domain.isPaid = false;
      domain.payment = {
        status: 'pending',
        amount: Number(amount),
        transactionId: `PAGBANK_ORDER_${Date.now()}`,
        paymentMethod: 'pix',
      };
    }

    const updatedRow = CanonicalMapper.domainToRow(domain);
    databaseRows.set(caseId, updatedRow);

    logger.info('payments', 'pagbank_webhook', 'simulate', `Webhook simulado para o caso ${caseId} com status ${status}`, {
      caseId,
      status,
      amount,
    });

    res.json({
      success: true,
      message: `Webhook PagBank processado com sucesso para o caso ${caseId}.`,
      case: domain,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/documents', (req, res) => {
  const domains: CaseDomain[] = [];
  for (const row of databaseRows.values()) {
    domains.push(CanonicalMapper.rowToDomain(row));
  }

  const documentsList = domains.map((c) => {
    const hasDraft = Boolean(c.defenseDraft);
    return {
      id: `doc_${c.id}`,
      caseId: c.id,
      title: c.title || `Petição Auto ${c.infraction?.aitNumber || c.id}`,
      clientName: c.clientName || 'Condutor DefesAi',
      clientCpf: c.clientCpf || '000.000.000-00',
      aitNumber: c.infraction?.aitNumber || '1B892014',
      infractionCode: c.infraction?.infractionCode || '745-50',
      infractionDescription: c.infraction?.description || 'Excesso de velocidade',
      organ: c.infraction?.autuadorBody || 'DETRAN-SP',
      procedureType: c.serviceType || 'defesa_previa',
      procedureLabel: c.serviceType === 'conversao_advertencia' ? 'Conversão em Advertência (Art. 267 CTB)' : (c.serviceType === 'recurso_jari' ? 'Recurso JARI (1ª Instância)' : 'Defesa Prévia (Autuação)'),
      status: hasDraft ? (c.isPaid ? 'LIBERADO_PAGO' : 'GERADO_PREVIEW') : 'PENDENTE_DADOS',
      version: '2.1.0',
      thesesCount: c.analysis?.recommendedArguments?.length || ((c.defenseDraft as any)?.selectedArguments?.length || c.defenseDraft?.selectedArgumentIds?.length || 2),
      engine: 'Determinístico CTB + IA Reasoning',
      generatedAt: c.updatedAt || c.createdAt,
      draftText: c.defenseDraft?.fullDraftText || c.defenseDraft?.factsNarrative || 'Minuta jurídica fundamentada perante a autoridade de trânsito...',
      vehiclePlate: c.vehicle?.plate || 'ABC-1234',
    };
  });

  res.json({
    documents: documentsList,
    totalCount: documentsList.length,
    readyCount: documentsList.filter(d => d.status === 'LIBERADO_PAGO').length,
    previewCount: documentsList.filter(d => d.status === 'GERADO_PREVIEW').length,
  });
});

router.get('/admin/ai/overview', (req, res) => {
  const metrics = metricsService.getOverview();
  const traces = aiProviderManager.getRecentTraces();

  res.json({
    architecture: {
      gateway: 'AI Provider Gateway (DefesAi Core)',
      primary: {
        provider: 'nvidia',
        name: 'NVIDIA NIM (Primary)',
        model: 'meta/llama-3.1-70b-instruct',
        endpoint: 'https://integrate.api.nvidia.com/v1',
        status: 'healthy',
        avgLatencyMs: metrics.nvidia.avgLatencyMs,
        successRate: metrics.nvidia.successRate,
        totalCalls: metrics.nvidia.requestsTotal,
      },
      fallback: {
        provider: '9router',
        name: '9Router Gateway (Fallback Contingency)',
        model: 'deepseek-ai/deepseek-r1',
        endpoint: 'https://api.9router.com/v1',
        status: 'healthy',
        avgLatencyMs: metrics.nineRouter.avgLatencyMs,
        successRate: metrics.nineRouter.successRate,
        totalCalls: metrics.nineRouter.requestsTotal,
      },
    },
    ragKnowledge: {
      totalTheses: 52,
      checklists: 6,
      autuadorBodies: 27,
      embeddingsModel: 'text-embedding-3-small',
      embeddingsDimension: 1536,
      ragSyncStatus: 'synced',
    },
    metrics: {
      totalAiRequests: metrics.totalAiRequests,
      fallbackRatePercent: metrics.fallbackRatePercent,
      errorRatePercent: metrics.errorRatePercent,
      p50LatencyMs: metrics.p50LatencyMs,
      p95LatencyMs: metrics.p95LatencyMs,
      p99LatencyMs: metrics.p99LatencyMs,
    },
    recentTraces: traces.slice(0, 10),
  });
});

router.get('/admin/integrations/overview', async (req, res) => {
  const metaStatus = metaIntegration.getConnectionState();
  const healthReport = await healthService.getHealth(false);

  res.json({
    meta: {
      name: 'Meta Graph API (Facebook & Instagram)',
      isConnected: metaStatus.isConnected,
      connectedUser: metaStatus.user?.name,
      pagesCount: metaStatus.pages?.length || 0,
      apiVersion: 'v20.0',
      status: metaStatus.isConnected ? 'HEALTHY' : 'CONFIGURED_SANDBOX',
    },
    pagbank: {
      name: 'PagBank (PagSeguro) Orders v2',
      apiVersion: 'v2.0',
      webhookUrl: 'https://app.defesai.com.br/api/webhooks/pagbank',
      idempotencyEnabled: true,
      status: 'HEALTHY',
    },
    supabase: {
      name: 'Supabase BaaS (Postgres & Auth)',
      dbStatus: 'HEALTHY',
      authStatus: 'HEALTHY',
      storageStatus: 'HEALTHY',
      edgeFunctionsCount: 4,
    },
    ocr: {
      name: 'Vision OCR & Document Parser',
      parserAccuracy: 98.2,
      status: 'HEALTHY',
    },
    whatsapp: {
      name: 'Evolution API (WhatsApp Gateway)',
      instanceStatus: 'READY',
      status: 'HEALTHY',
    },
  });
});

export default router;