import { Router } from 'express';
import { databaseRows, auditLogs } from '../app';
import { CanonicalMapper } from '../../core/mappers/canonical-mapper';
import { RagPipeline } from '../../core/rag/rag-pipeline';
import { LEGAL_ARGUMENTS, AUTUADOR_BODIES, PROCEDURE_TITLES } from '../../data/knowledge-base';
import { eventBus, EventTopics } from '../../core/events/topics';
import { CaseDomain } from '../../types';
import { enrichDefenseWithGemini } from '../gemini';

const router = Router();

// Cases CRUD & Lifecycle Endpoints
router.get('/cases', (req, res) => {
  const domains: CaseDomain[] = [];
  for (const row of databaseRows.values()) {
    domains.push(CanonicalMapper.rowToDomain(row));
  }
  // Sort newest first
  domains.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(domains);
});

router.get('/cases/:id', (req, res) => {
  const row = databaseRows.get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Caso não encontrado' });
  }
  res.json(CanonicalMapper.rowToDomain(row));
});

router.post('/cases', (req, res) => {
  try {
    const domainData: CaseDomain = req.body;
    if (!domainData.id) {
      domainData.id = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!domainData.createdAt) {
      domainData.createdAt = new Date().toISOString();
    }
    domainData.updatedAt = new Date().toISOString();

    // Run legal RAG analysis
    if (!domainData.analysis && domainData.infraction) {
      domainData.analysis = RagPipeline.analyzeInfraction(domainData.id, domainData.infraction);
    }

    // Generate initial defense draft
    if (!domainData.defenseDraft && domainData.infraction) {
      domainData.defenseDraft = RagPipeline.generateDefenseDraft(
        domainData.id,
        domainData.infraction,
        domainData.vehicle?.plate || 'SEM PLACA',
        domainData.vehicle?.brandModel || 'Veículo',
        {
          name: domainData.clientName || 'Requerente',
          cpf: domainData.clientCpf || '000.000.000-00',
          cnh: '00000000000',
          address: 'Endereço residencial',
          cityState: 'São Paulo/SP',
        },
        domainData.analysis?.recommendedArguments || [],
        domainData.serviceType || 'defesa_previa'
      );
    }

    const row = CanonicalMapper.domainToRow(domainData);
    databaseRows.set(row.id, row);

    eventBus.publish(EventTopics.CASE_CREATED, { caseId: domainData.id, isAnonymous: domainData.isAnonymous }, 'case_engine');

    auditLogs.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: domainData.clientName || 'Anônimo',
      role: domainData.isAnonymous ? 'citizen' : 'citizen',
      action: 'CASE_CREATED',
      targetResource: domainData.id,
      ipHash: '9f83c68a765b1c41',
      details: `Caso ${domainData.title} criado no estágio ${domainData.currentStage}.`,
      gdprCompliant: true,
    });

    res.status(201).json(CanonicalMapper.rowToDomain(row));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/cases/:id', (req, res) => {
  const existingRow = databaseRows.get(req.params.id);
  if (!existingRow) {
    return res.status(404).json({ error: 'Caso não encontrado' });
  }

  const updatedDomain: CaseDomain = req.body;
  updatedDomain.id = req.params.id;
  updatedDomain.updatedAt = new Date().toISOString();

  const newRow = CanonicalMapper.domainToRow(updatedDomain);
  databaseRows.set(req.params.id, newRow);

  eventBus.publish(EventTopics.CASE_UPDATED, { caseId: req.params.id }, 'case_engine');

  res.json(CanonicalMapper.rowToDomain(newRow));
});

// Claim Anonymous Case (Modal Cadastro -> Link account)
router.post('/cases/:id/claim', (req, res) => {
  const row = databaseRows.get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Caso anônimo não encontrado' });
  }

  const { name, email, phone, cpf } = req.body;
  const domain = CanonicalMapper.rowToDomain(row);
  domain.clientName = name || domain.clientName;
  domain.clientEmail = email || domain.clientEmail;
  domain.clientPhone = phone || domain.clientPhone;
  domain.clientCpf = cpf || domain.clientCpf;
  domain.isAnonymous = false;
  domain.updatedAt = new Date().toISOString();

  domain.timeline.push({
    id: `tl_${Date.now()}`,
    title: 'Cadastro Concluído',
    description: `Caso vinculado ao motorista ${domain.clientName}.`,
    timestamp: new Date().toISOString(),
    type: 'system',
  });

  const updatedRow = CanonicalMapper.domainToRow(domain);
  databaseRows.set(domain.id, updatedRow);

  eventBus.publish(EventTopics.CASE_CLAIMED, { caseId: domain.id, email }, 'auth_engine');

  res.json(domain);
});

// Defense Generation & AI Enrichment
router.post('/cases/:id/generate-defense', async (req, res) => {
  const row = databaseRows.get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Caso não encontrado' });
  }

  const domain = CanonicalMapper.rowToDomain(row);
  const { procedureType, selectedArgumentIds, applicantData, customFacts } = req.body;

  const selectedArgs = LEGAL_ARGUMENTS.filter((a) =>
    selectedArgumentIds?.includes(a.id)
  );

  let defense = RagPipeline.generateDefenseDraft(
    domain.id,
    domain.infraction,
    domain.vehicle.plate,
    domain.vehicle.brandModel,
    applicantData || {
      name: domain.clientName,
      cpf: domain.clientCpf || '000.000.000-00',
      cnh: '05492817492',
      address: 'Rua das Flores, 450, Apto 82',
      cityState: 'São Paulo/SP',
    },
    selectedArgs.length > 0 ? selectedArgs : domain.analysis?.recommendedArguments || [],
    procedureType || domain.serviceType
  );

  if (customFacts) {
    defense.factsNarrative = customFacts;
  }

  // Optionally enrich with Gemini AI for superior legal polish
  const enrichedGemini = await enrichDefenseWithGemini({
    infraction: domain.infraction,
    applicant: applicantData,
    arguments: selectedArgs,
    procedure: procedureType,
  });

  if (enrichedGemini) {
    defense.fullDraftText = enrichedGemini;
  }

  domain.defenseDraft = defense;
  domain.currentStage = 3;
  domain.status = 'defesa_pronta';
  domain.updatedAt = new Date().toISOString();

  domain.timeline.push({
    id: `tl_def_${Date.now()}`,
    title: 'Petição Administrativa Atualizada',
    description: `Minuta da ${procedureType || 'defesa'} estruturada com ${selectedArgs.length} teses jurídicas.`,
    timestamp: new Date().toISOString(),
    type: 'defense',
  });

  const updatedRow = CanonicalMapper.domainToRow(domain);
  databaseRows.set(domain.id, updatedRow);

  eventBus.publish(EventTopics.DEFENSE_DRAFT_FINALIZED, { caseId: domain.id }, 'defense_engine');

  res.json({
    success: true,
    defenseDraft: defense,
    case: domain,
  });
});

export default router;