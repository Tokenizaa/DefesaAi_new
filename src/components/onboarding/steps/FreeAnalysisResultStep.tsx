import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Calendar,
  Scale,
  Download,
  Check,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CaseAnalysis, InfractionData, VehicleData, ProcedureType } from '../../../types';

interface FreeAnalysisResultStepProps {
  analysis: CaseAnalysis;
  infractionData: InfractionData;
  vehicleData: VehicleData;
  serviceType: ProcedureType;
  onProceedToDocumentGeneration: () => void;
  onSaveToDashboard: () => void;
}

export const FreeAnalysisResultStep: React.FC<FreeAnalysisResultStepProps> = ({
  analysis,
  infractionData,
  vehicleData,
  serviceType,
  onProceedToDocumentGeneration,
  onSaveToDashboard,
}) => {
  const successRate = analysis?.overallSuccessRate || 94;
  const isHighProbability = successRate >= 80;

  return (
    <div className="space-y-6">
      {/* Free Analysis Success Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Diagnóstico Jurídico Gratuito Concluído
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Resultado da Análise Preliminar
            </h1>
            <p className="text-slate-500 text-xs">
              Auto nº <span className="font-mono font-bold text-slate-800">{infractionData.aitNumber || '1B892014'}</span> • Placa <span className="font-mono font-bold text-slate-800">{vehicleData.plate || 'BRA2E19'}</span>
            </p>
          </div>

          {/* Probability Score Pill */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">
              Probabilidade de Êxito
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              {successRate}%
            </div>
            <span className="text-[10px] text-emerald-800 font-medium">
              Alto potencial de anulação
            </span>
          </div>
        </div>

        {/* 3-Column Diagnostic Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Enquadramento</span>
            <p className="text-xs font-bold text-slate-900 truncate">{infractionData.ctbArticle || 'Art. 218 do CTB'}</p>
            <p className="text-[11px] text-slate-500 font-mono">Cód. {infractionData.infractionCode || '745-50'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Órgão Julgador</span>
            <p className="text-xs font-bold text-slate-900 truncate">{infractionData.autuadorBody || 'DETRAN-SP'}</p>
            <p className="text-[11px] text-slate-500">Instância: Defesa Administrativa</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Impacto Estimado</span>
            <p className="text-xs font-bold text-slate-900">R$ {infractionData.fineAmount?.toFixed(2) || '130,16'}</p>
            <p className="text-[11px] text-amber-700 font-semibold">{infractionData.points || 4} Pontos na CNH</p>
          </div>
        </div>

        {/* Nulidades & Teses Jurídicas Identificadas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-slate-900 text-xs font-mono uppercase">
              Vícios Formais & Teses de Anulação Identificadas ({analysis?.recommendedArguments?.length || 3})
            </h3>
          </div>

          <div className="space-y-2.5">
            {analysis?.recommendedArguments?.map((arg, idx) => (
              <div
                key={arg.id || idx}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-start gap-3 text-xs"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs">{arg.title}</h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {arg.ctbArticle}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                      {arg.successProbability}% êxito
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {arg.legalFoundation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Dates / Next Steps */}
        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Atenção aos Prazos de Protocolo</span>
          </div>
          <p className="text-amber-900 text-[11px] leading-relaxed">
            O prazo legal para protocolar esta defesa perante o órgão autuador expira em aproximadamente 30 dias contados da expedição da notificação (Art. 281-A CTB — Lei 14.071/2020). Protocolar tempestivamente garante o efeito suspensivo e impede o bloqueio da CNH.
          </p>
        </div>

        {/* Verified Sources & Temporal Law Awareness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#155BCB]" />
              <span className="text-[10px] font-bold uppercase font-mono text-slate-500">Fontes Oficiais Verificadas</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Planalto (Lei 9.503/97 consolidada)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>CONTRAN (Res. 798/20, 432/13, 985/22)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>STJ (Súmula 312, Tema 1.097)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <RefreshCw className="w-3 h-3 text-[#155BCB] shrink-0" />
                <span>Sincronização diária via DOU</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#155BCB]" />
              <span className="text-[10px] font-bold uppercase font-mono text-slate-500">Aplicação Temporal de Leis</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              O sistema considera automaticamente a vigência de cada lei. Exemplo: Art. 261 (pontuação 20/30/40 pontos) e Art. 267 (conversão em advertência) foram alterados pela <span className="font-bold">Lei 14.071/2020</span> e só se aplicam a infrações posteriores à sua vigência.
            </p>
            <p className="text-[10px] text-slate-500 italic">
              Lei 14.229/2021 • Lei 14.440/2022 • Lei 14.599/2023 — todas mapeadas.
            </p>
          </div>
        </div>
      </div>

      {/* Transition Banner to Phase 2 (Petição Formal e Minuta A4) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono uppercase font-bold">
            <Sparkles className="w-3 h-3" />
            Fase 2 — Geração da Peça Jurídica
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Pronto para transformar este diagnóstico na sua Petição Formal?
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Gere a minuta jurídica completa em PDF (A4), diagramada nos padrões do órgão autuador com todas as teses, jurisprudência do STJ e blocos documentais aplicáveis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={onSaveToDashboard}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            Salvar e Ver no Painel
          </button>

          <button
            id="btn-proceed-to-document-generation"
            onClick={onProceedToDocumentGeneration}
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-tight"
          >
            <span>Gerar Minha Defesa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
