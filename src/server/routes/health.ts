import { Router } from 'express';
import { databaseRows } from '../app';
import { INFRACTION_CATALOG, LEGAL_ARGUMENTS, AUTUADOR_BODIES } from '../../data/knowledge-base';
import { CanonicalMapper } from '../../core/mappers/canonical-mapper';

const router = Router();

// Healthcheck & Knowledge Endpoints
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    casesCount: databaseRows.size,
    aiModel: 'gemini-3.7-flash',
    knowledge: {
      infractionsCount: INFRACTION_CATALOG.length,
      argumentsCount: LEGAL_ARGUMENTS.length,
      bodiesCount: AUTUADOR_BODIES.length,
    },
  });
});

router.get('/knowledge/infractions', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  if (!query) {
    return res.json(INFRACTION_CATALOG);
  }
  const filtered = INFRACTION_CATALOG.filter(
    (item) =>
      item.code.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.article.toLowerCase().includes(query)
  );
  res.json(filtered);
});

router.get('/knowledge/arguments', (req, res) => {
  res.json(LEGAL_ARGUMENTS);
});

router.get('/knowledge/bodies', (req, res) => {
  res.json(AUTUADOR_BODIES);
});

export default router;