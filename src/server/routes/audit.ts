import { Router } from 'express';
import { auditLogs } from '../app';

const router = Router();

// Audit Logs & Compliance Endpoints
router.get('/audit-logs', (req, res) => {
  res.json(auditLogs);
});

export default router;