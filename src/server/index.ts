import { app, databaseRows, auditLogs, startServer } from './app';
import { marketingOrchestrator } from './workers/marketing-orchestrator.worker';
import { marketingMetricsCollector } from './workers/marketing-metrics.worker';

// Import route modules
import healthRoutes from './routes/health';
import agentsRoutes from './routes/agents';
import ocrRoutes from './routes/ocr';
import casesRoutes from './routes/cases';
import defenseRoutes from './routes/defense';
import paymentsRoutes from './routes/payments';
import metaRoutes from './routes/meta';
import marketingRoutes from './routes/marketing';
import whatsappRoutes from './routes/whatsapp';
import auditRoutes from './routes/audit';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';
import monitoringRoutes from './routes/monitoring';
import logsRoutes from './routes/logs';
import commercialRoutes from './routes/commercial';
import knowledgeRoutes from './routes/knowledge';

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/cases', defenseRoutes); // defense endpoints are under /api/cases/:id/generate-defense etc.
app.use('/api/payments', paymentsRoutes);
app.use('/api/integrations', metaRoutes); // meta endpoints under /api/integrations/*
app.use('/api/marketing', marketingRoutes);
app.use('/api/knowledge', knowledgeRoutes); // knowledge base endpoints (Fase 5)
app.use('/api/communication', whatsappRoutes); // whatsapp under /api/communication/whatsapp/send
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/admin/commercial', commercialRoutes); // commercial under /api/admin/commercial/*

// Ponto único de listen: startServer() em app.ts (Vite/static + listen).
// Workers autônomos (FASE 4) sobem após o servidor estar de pé.
const server = startServer(() => {
  marketingOrchestrator.start();
  marketingMetricsCollector.collect().catch(() => {});
});

export default server;