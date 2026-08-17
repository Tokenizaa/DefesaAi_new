import { Router } from 'express';
import { metricsService } from '../observability/metrics-service';
import { healthService } from '../observability/health-service';
import { aiProviderManager } from '../observability/ai-provider-manager';
import { alertsService } from '../observability/alerts-service';

const router = Router();

// Platform Observability, Health & Monitoring Endpoints
router.get('/monitoring/health', async (req, res) => {
  try {
    const forceFresh = req.query.fresh === 'true';
    const report = await healthService.getHealth(forceFresh);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao verificar saúde da plataforma' });
  }
});

router.get('/monitoring/metrics', (req, res) => {
  const metrics = metricsService.getOverview();
  res.json(metrics);
});

router.get('/monitoring/ai-pipeline', (req, res) => {
  const traces = aiProviderManager.getRecentTraces();
  const overview = metricsService.getOverview();
  res.json({
    traces,
    nvidia: overview.nvidia,
    nineRouter: overview.nineRouter,
    fallbackRatePercent: overview.fallbackRatePercent,
    totalAiRequests: overview.totalAiRequests,
  });
});

router.get('/monitoring/alerts', (req, res) => {
  const alertsData = alertsService.getAlerts();
  res.json(alertsData);
});

router.post('/monitoring/alerts/ack', (req, res) => {
  const { alertId, user } = req.body;
  if (!alertId) {
    return res.status(400).json({ error: 'alertId é obrigatório' });
  }
  const acked = alertsService.acknowledge(alertId, user || 'admin');
  res.json({ success: acked });
});

export default router;