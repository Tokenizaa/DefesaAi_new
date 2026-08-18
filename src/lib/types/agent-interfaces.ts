export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'executing' | 'waiting' | 'error';
  lastActive: string;
  currentTask?: string;
  metrics?: Record<string, any>;
}

export interface MarketingAgentMetric {
  name: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

// OCR Field Result
export interface OCRFieldResult {
  value: string;
  confidence: number;
}

// Validated Field
export interface ValidatedField {
  campo: string;
  valor: string;
  fonte_confianca: number;
  status: 'valid' | 'warning' | 'invalid';
}

// User Info
export interface UserInfo {
  nome: string;
  cpf: string;
  cnh: string;
  endereco: string;
  cidade: string;
  uf: string;
}

// Infraction Info
export interface InfractionInfo {
  placa: string;
  numeroAuto: string;
  orgaoAutuador: string;
  codigoInfracao: string;
  data: string;
  descricao?: string;
  fotos?: string[];
  velocidadeMedida?: number;
  velocidadeLimite?: number;
  // other fields as needed
}

// Service Info
export interface ServiceInfo {
  tipo: string;
  // other fields as needed
}

// OCR Result
export interface OCRResult {
  raw_text?: string;
  extracted_fields?: Record<string, OCRFieldResult>;
  document_type?: string;
  confidence?: number;
  method?: string;
}

// Classification Result (from OCR classifier)
export interface ClassificationResult {
  document_type: string;
  confidence: number;
  method: string;
}

// Legal Research (placeholder)
export interface LegalResearch {
  // define fields as needed
}

// Strategy (placeholder)
export interface Strategy {
  // define fields as needed
}

// Document Plan (placeholder)
export interface DocumentPlan {
  // define fields as needed
}

// Draft (could be string or object)
export type Draft = string | object;

// Reviewed Draft (could be string or object)
export type ReviewedDraft = string | object;

// Audit Result (placeholder)
export interface AuditResult {
  // define fields as needed
}

// Hallucination Check Result
export interface HallucinationCheckResult {
  suspicious: string[];
  // other fields as needed
}

// Contradictions Result (placeholder)
export interface ContradictionsResult {
  // define fields as needed
}

// Completeness Result
export interface CompletenessResult {
  complete: boolean;
  missing: string[];
}

// Citation Validation Result (placeholder)
export interface CitationValidationResult {
  // define fields as needed
}

// Metadata
export interface Metadata {
  documentId: string;
  version: string;
  hash: string;
  stepsCompleted: string[];
  validatedFields: ValidatedField[];
  fieldErrors?: Record<string, number> | number;
  stepTimings?: Record<string, number>;
  converted?: boolean;
  timeOnCurrentStep?: number;
  device?: string;
  analytics?: any;
  retention?: any;
  // other metadata fields as needed
}

// Main Case Context
export interface CaseContext {
  user?: UserInfo;
  infraction?: InfractionInfo;
  service?: ServiceInfo;
  ocr?: OCRResult;
  classification?: ClassificationResult;
  legalResearch?: LegalResearch;
  strategy?: Strategy;
  documentPlan?: DocumentPlan;
  draft?: Draft;
  reviewedDraft?: ReviewedDraft;
  audit?: AuditResult;
  hallucinationCheck?: HallucinationCheckResult;
  contradictions?: ContradictionsResult;
  completeness?: CompletenessResult;
  citationValidation?: CitationValidationResult;
  metadata?: Metadata;
}