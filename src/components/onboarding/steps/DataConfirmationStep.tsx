import React from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  Car,
  Building,
  Calendar,
  MapPin,
  Gauge,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { InfractionData, VehicleData, ProcedureType } from '../../../types';

interface DataConfirmationStepProps {
  infractionData: InfractionData;
  vehicleData: VehicleData;
  serviceType: ProcedureType;
  onEditField: () => void;
  onConfirmAndRunAnalysis: () => void;
  onBack: () => void;
}

export const DataConfirmationStep: React.FC<DataConfirmationStepProps> = ({
  infractionData,
  vehicleData,
  serviceType,
  onEditField,
  onConfirmAndRunAnalysis,
  onBack,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Fase 1 — Confirmação dos Dados
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Confira os dados da sua infração
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Esses dados serão utilizados para o cálculo determinístico de nulidades, decadência de prazo e teses do CTB.
        </p>
      </div>

      {/* Structured Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infraction Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-xs text-slate-900 font-mono uppercase">Dados da Autuação</span>
            </div>
            <button
              onClick={onEditField}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Auto de Infração (AIT):</span>
              <span className="font-mono font-bold text-slate-900">{infractionData.aitNumber || 'Não informado'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Código da Infração:</span>
              <span className="font-mono font-bold text-slate-900">{infractionData.infractionCode || '745-50'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Enquadramento CTB:</span>
              <span className="font-medium text-slate-900">{infractionData.ctbArticle || 'Art. 218, I'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Órgão Autuador:</span>
              <span className="font-medium text-slate-900">{infractionData.autuadorBody || 'DETRAN'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Data e Hora:</span>
              <span className="font-mono text-slate-900">{infractionData.dateTime || 'Recente'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Local da Ocorrência:</span>
              <span className="font-medium text-slate-900 text-right truncate max-w-[200px]">
                {infractionData.location || 'Via pública'}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle & Technical Parameters */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-xs text-slate-900 font-mono uppercase">Veículo & Parâmetros</span>
            </div>
            <button
              onClick={onEditField}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Placa do Veículo:</span>
              <span className="font-mono font-bold text-slate-900">{vehicleData.plate || 'BRA2E19'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Procedimento Selecionado:</span>
              <span className="font-mono font-bold text-slate-900 uppercase">{serviceType.replace('_', ' ')}</span>
            </div>
            {infractionData.speedLimit && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Velocidade Limite:</span>
                <span className="font-mono font-bold text-slate-900">{infractionData.speedLimit} km/h</span>
              </div>
            )}
            {infractionData.measuredSpeed && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Velocidade Medida / Considerada:</span>
                <span className="font-mono font-bold text-slate-900">
                  {infractionData.measuredSpeed} / {infractionData.consideredSpeed || infractionData.measuredSpeed} km/h
                </span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status da Análise:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Pronto para Análise 100% Gratuita
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation CTA */}
      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <button
          id="btn-confirm-and-run-analysis"
          onClick={onConfirmAndRunAnalysis}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-200"
        >
          <Sparkles className="w-4 h-4" />
          <span>Confirmar Dados e Executar Diagnóstico Gratuito</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
