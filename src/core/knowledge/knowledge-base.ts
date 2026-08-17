import { INFRACTION_CATALOG } from '../../data/knowledge-base';
import { CTB_ARTICLES_DB } from '../legal-base/ctb-articles';
import { RESOLUTIONS_DB } from '../legal-base/resolutions';
import { ORGANS_DB } from '../legal-base/organs';
import { ARGUMENTS_CATALOG } from '../arguments/arguments-catalog';
import { PROCEDURES_CATALOG } from '../procedures/procedures-catalog';
import { DOCUMENT_BLOCKS } from '../templates/document-blocks';
import { TEMPLATES_CATALOG } from '../templates/templates-catalog';

export const KNOWLEDGE_INFRACTIONS = INFRACTION_CATALOG.map((item) => ({
  id: item.code,
  codigo: item.code,
  nome: item.description,
  artigo: item.article,
  gravidade: item.severity.toUpperCase(),
  pontos: item.points,
  valor: item.fineAmount,
  tesesRecomendadas: item.recommendedArgumentCodes,
  viciosTipicos: item.typicalFlaws,
}));

export const KNOWLEDGE_TESES = ARGUMENTS_CATALOG.map((arg) => ({
  id: arg.id,
  titulo: arg.title,
  categoria: arg.category,
  baseLegal: arg.legalBase,
  resolucoes: arg.resolutions,
  descricao: arg.description,
  quandoUsar: arg.whenToUse,
  quandoNaoUsar: arg.whenNotToUse,
  scoreConfianca: arg.confidenceScore,
  requisitos: arg.requirements,
  documentosExigidos: arg.requiredDocuments,
  jurisprudencia: arg.relatedJurisprudence,
}));

export const KNOWLEDGE_ORGAOS = ORGANS_DB.map((org) => ({
  id: org.id,
  nome: org.name,
  sigla: org.abbreviation,
  esfera: org.sphere,
  uf: org.state || 'Nacional',
  portalUrl: org.onlinePortalUrl,
  enderecoFisico: org.physicalAddress,
  emailContato: org.email,
  prazoPadraoDias: org.standardDeadlineDays,
  estruturaJari: org.jariStructure,
}));

export const KNOWLEDGE_CATEGORIES = [
  { id: 'velocidade', nome: 'Radares & Velocidade (Art. 218 CTB)', count: 8 },
  { id: 'lei_seca', nome: 'Lei Seca & Alcoolemia (Art. 165/165-A CTB)', count: 4 },
  { id: 'semaforo', nome: 'Semáforos & Cruzamentos (Art. 208 CTB)', count: 3 },
  { id: 'celular', nome: 'Celular & Equipamentos (Art. 252 CTB)', count: 4 },
  { id: 'estacionamento', nome: 'Estacionamento & Parada (Art. 181 CTB)', count: 6 },
  { id: 'suspensao', nome: 'Processo de Suspensão & Cassação CNH', count: 5 },
  { id: 'documental', nome: 'Vícios Formais & Notificação (Art. 280/281 CTB)', count: 12 },
  { id: 'advertencia', nome: 'Conversão em Advertência (Art. 267 CTB)', count: 2 },
];

export const KNOWLEDGE_SERVICES = [
  {
    id: 'defesa_previa',
    nome: 'Defesa Prévia (Notificação de Autuação)',
    descricao: 'Impugnação inicial focada em nulidades do AIT, decadência de 30 dias e conversão em advertência.',
    prazoDias: 30,
    instancia: 'Autoridade de Trânsito do Órgão Autuador',
  },
  {
    id: 'recurso_jari',
    nome: 'Recurso Ordinário à JARI (1ª Instância)',
    descricao: 'Recurso colegiado contra Notificação de Penalidade com efeito suspensivo.',
    prazoDias: 30,
    instancia: 'Junta Administrativa de Recursos de Infrações',
  },
  {
    id: 'recurso_cetran',
    nome: 'Recurso ao CETRAN / CONTRANDIFE (2ª Instância)',
    descricao: 'Recurso final em instância superior para esgotar via administrativa.',
    prazoDias: 30,
    instancia: 'Conselho Estadual de Trânsito',
  },
  {
    id: 'conversao_advertencia',
    nome: 'Requerimento de Advertência por Escrito (Art. 267 CTB)',
    descricao: 'Aplicação vinculada da Lei 14.071/2020 para zerar pontos e taxa de multa leve/média.',
    prazoDias: 30,
    instancia: 'Autoridade de Trânsito',
  },
];

export const KNOWLEDGE_PROCEDURES = PROCEDURES_CATALOG;

export const KNOWLEDGE_DEFENSE_BLOCKS_52 = DOCUMENT_BLOCKS.map((blk) => ({
  id: blk.id,
  codigo: blk.code,
  categoria: blk.category,
  titulo: blk.title,
  conteudoTemplate: blk.contentTemplate,
  variaveisSuportadas: blk.supportedVariables,
  procedimentosRecomendados: blk.recommendedProcedures,
}));

export const TRANSIT_DATABASE_REGISTRY = {
  vehicles: [
    {
      placa: 'BRA2E19',
      chassi: '9BRBL48E8P0192841',
      renavam: '01294819284',
      marcaModelo: 'Toyota Corolla Cross XRE 2.0',
      anoFabricacao: 2024,
      anoModelo: 2025,
      cor: 'Cinza Granito',
      combustivel: 'Flex / Álcool e Gasolina',
      municipioUf: 'São Paulo/SP',
      situacao: 'EM_CIRCULACAO',
      restricoes: 'Nenhuma restrição financeira ou administrativa',
      ultimoLicenciamento: 2025,
    },
    {
      placa: 'ABC1D23',
      chassi: '9BD158914L0918231',
      renavam: '00987123456',
      marcaModelo: 'Honda Civic Touring 1.5 Turbo',
      anoFabricacao: 2023,
      anoModelo: 2024,
      cor: 'Preto Cristal',
      combustivel: 'Gasolina',
      municipioUf: 'Campinas/SP',
      situacao: 'EM_CIRCULACAO',
      restricoes: 'Alienação Fiduciária',
      ultimoLicenciamento: 2025,
    },
  ],
  radarCertificates: [
    {
      equipamentoId: 'INMETRO-RAD-883921',
      orgaoAutuador: 'DETRAN-SP',
      modeloRadar: 'FISCAL-RADAR FX-3000 Fixe Laser',
      localInstalacao: 'Av. das Nações Unidas, km 18.5 - Marginal Pinheiros',
      limiteVelocidade: 70,
      dataUltimaAfericao: '2025-04-10', // Mais de 12 meses atrás!
      validadeAfericao: '2026-04-10',
      statusLaudo: 'EXPIRADO_INVALIDO',
      numeroCertificadoInmetro: 'INMETRO/DIMEL-SP-2025-09182',
      motivoInvalidade: 'Vencido há mais de 60 dias da data do cometimento.',
    },
    {
      equipamentoId: 'INMETRO-RAD-119284',
      orgaoAutuador: 'PRF',
      modeloRadar: 'TRUCAM II Portátil Laser',
      localInstalacao: 'BR-116, km 220 - Dutra Sul',
      limiteVelocidade: 110,
      dataUltimaAfericao: '2026-02-15',
      validadeAfericao: '2027-02-15',
      statusLaudo: 'VIGENTE_REGULAR',
      numeroCertificadoInmetro: 'INMETRO/DIMEL-RJ-2026-44120',
      motivoInvalidade: null,
    },
  ],
};
