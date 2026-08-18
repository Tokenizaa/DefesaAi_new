import { Router } from 'express';
import { eventBus, EventTopics } from '../../core/events/topics';
import { runPipeline } from '../../../agents/pipeline/runner';
import { INITIAL_MARKETING_AGENTS, INITIAL_EDITORIAL_CONTENTS, BRAND_IDENTITY } from '../../data/marketing-agents-data';
import { AiAnalysisAgent } from '../../../../agents/ai-analysis-agent';
import { DocumentAgent } from '../../../../agents/document-agent';
import { CommunicationAgent } from '../../../../agents/communication-agent';
import { CaseContext } from '../../../../src/lib/types/agent-interfaces';

const router = Router();

// Autonomous Agents Ecosystem & Pipeline
router.get('/agents/registry', (req, res) => {
  res.json({
    totalAgents: 18,
    domains: [
      {
        name: 'Experiência & Onboarding (Layer 1)',
        agents: [
          { id: 'onboarding-ux', name: 'Onboarding UX Flow Agent', role: 'Define fluxos progressivos e reduz atrito' },
          { id: 'onboarding-copywriter', name: 'Microcopy & Trust Agent', role: 'Comunicação empática e sem juridiquês' },
          { id: 'legal-ux-reviewer', name: 'Legal Clarity Reviewer', role: 'Equilibra rigor técnico e clareza para o motorista' },
        ],
      },
      {
        name: 'OCR & Percepção Documental (Layer 2)',
        agents: [
          { id: 'ocr-classifier', name: 'OCR Document Classifier', role: 'Identifica NIP, AIT, CNH, CRLV ou autuação' },
          { id: 'ocr-extractor', name: 'OCR Field Extractor', role: 'Extrai placa, auto, código de enquadramento, velocidades' },
          { id: 'ocr-validator', name: 'OCR Data Validator', role: 'Cruza dados com o CTB e valida formato de placas/autos' },
        ],
      },
      {
        name: 'Conhecimento Jurídico & Legislação (Layer 3)',
        agents: [
          { id: 'legal-classifier', name: 'Legal Case Classifier', role: 'Enquadramento no CTB, cálculo de pontos e prazos' },
          { id: 'legal-researcher', name: 'Legal Researcher Agent', role: 'Consulta jurisprudência pacificada e resoluções CONTRAN' },
          { id: 'legal-strategist', name: 'Legal Defense Strategist', role: 'Seleciona e ranqueia teses preliminares e de mérito' },
        ],
      },
      {
        name: 'Documentos & Petições (Layer 4)',
        agents: [
          { id: 'document-planner', name: 'Document Planner Agent', role: 'Estrutura seções de petição administrativa formal' },
          { id: 'document-drafter', name: 'Document Drafter Agent', role: 'Redige a fundamentação fática e jurídica completa' },
          { id: 'legal-style-reviewer', name: 'Legal Style Reviewer', role: 'Harmoniza estilo, coesão e precisão terminológica' },
          { id: 'citation-validator', name: 'Citation Validator Agent', role: 'Verifica artigos do CTB e súmulas citadas' },
          { id: 'document-layout', name: 'Document Layout Engine', role: 'Gera layout ABNT pronto para impressão ou PDF' },
        ],
      },
      {
        name: 'Qualidade & Auditoria (Layer 5)',
        agents: [
          { id: 'legal-auditor', name: 'Legal Compliance Auditor', role: 'Auditoria de 6 etapas e conformidade com prazos' },
          { id: 'hallucination-checker', name: 'Hallucination Checker Agent', role: 'Previne citações forjadas ou dados inexistentes' },
          { id: 'contradiction-checker', name: 'Contradiction Checker Agent', role: 'Valida coerência fática em todas as seções' },
          { id: 'completeness-reviewer', name: 'Completeness Reviewer Agent', role: 'Verifica qualificação completa e anexos' },
        ],
      },
      {
        name: 'Produto & Conversão (Layer 6)',
        agents: [
          { id: 'pricing-agent', name: 'Dynamic Pricing Agent', role: 'Ofertas personalizadas baseadas no risco da CNH' },
          { id: 'retention-agent', name: 'User Retention Agent', role: 'Mitiga abandono e auxilia condutores indecisos' },
          { id: 'analytics-agent', name: 'Funnel Analytics Agent', role: 'Monitoramento contínuo de métricas e conversão' },
        ],
      },
    ],
  });
});

router.post('/pipeline/run', async (req, res) => {
  try {
    const initialContext = req.body || {};
    const result = await runPipeline(initialContext);
    res.json(result);
  } catch (error: any) {
    console.error('[Pipeline Runner] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro na execução do pipeline' });
  }
});

// AI Analysis Agent Endpoint
router.post('/agents/ai-analysis/run', async (req, res) => {
  try {
    const caseData = req.body;
    
    // Create CaseContext from provided data
    const context: CaseContext = {
      user: caseData.user,
      infraction: caseData.infraction,
      service: caseData.service,
      ocr: caseData.ocr,
      classification: caseData.classification,
      metadata: caseData.metadata || {
        documentId: '',
        version: '',
        hash: '',
        stepsCompleted: [],
        validatedFields: [],
        fieldErrors: {}
      }
    };

    // Instantiate and run the agent
    const agent = new AiAnalysisAgent();
    const result = await agent.process(context);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Analysis Agent] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro na execução do agente de análise de IA' });
  }
});

// Document Agent Endpoint
router.post('/agents/document/run', async (req, res) => {
  try {
    const caseData = req.body;
    
    // Create CaseContext from provided data
    const context: CaseContext = {
      user: caseData.user,
      infraction: caseData.infraction,
      service: caseData.service,
      ocr: caseData.ocr,
      classification: caseData.classification,
      metadata: caseData.metadata || {
        documentId: '',
        version: '',
        hash: '',
        stepsCompleted: [],
        validatedFields: [],
        fieldErrors: {}
      }
    };

    // Instantiate and run the agent
    const agent = new DocumentAgent();
    const result = await agent.process(context);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Document Agent] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro na execução do agente de documento' });
  }
});

// Communication Agent Endpoint
router.post('/agents/communication/run', async (req, res) => {
  try {
    const caseData = req.body;
    
    // Create CaseContext from provided data
    const context: CaseContext = {
      user: caseData.user,
      infraction: caseData.infraction,
      service: caseData.service,
      ocr: caseData.ocr,
      classification: caseData.classification,
      metadata: caseData.metadata || {
        documentId: '',
        version: '',
        hash: '',
        stepsCompleted: [],
        validatedFields: [],
        fieldErrors: {}
      }
    };

    // Instantiate and run the agent
    const agent = new CommunicationAgent();
    const result = await agent.process(context);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Communication Agent] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro na execução do agente de comunicação' });
  }
});

export default router;