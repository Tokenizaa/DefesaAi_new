import React from 'react';
import {
  Car,
  UserCheck,
  ShieldAlert,
  Ban,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Database,
  FileText
} from 'lucide-react';
import { USER_SITUATIONS, UserSituation } from '../../../core/onboarding/rules-matrix';

interface ServiceStepProps {
  selectedSituation: UserSituation;
  onSelectSituation: (situation: UserSituation) => void;
}

export const ServiceStep: React.FC<ServiceStepProps> = ({
  selectedSituation,
  onSelectSituation,
}) => {
  const getIcon = (id: UserSituation) => {
    switch (id) {
      case 'multa_transito':
        return <Car className="w-5 h-5" />;
      case 'conversao_advertencia':
        return <UserCheck className="w-5 h-5" />;
      case 'indicacao_condutor':
        return <FileText className="w-5 h-5" />;
      case 'suspensao_cnh':
        return <ShieldAlert className="w-5 h-5" />;
      case 'cassacao_cnh':
        return <Ban className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header com chamada humana */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#155BCB] border border-blue-200 font-mono">
          <Sparkles className="w-3 h-3 text-[#155BCB]" />
          Passo 1 de 4 • Diagnóstico Preliminar Gratuito
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Qual situação você quer resolver?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Selecione o objetivo da sua defesa para aplicarmos as teses exatas do Código de Trânsito Brasileiro.
        </p>
      </div>

      {/* Grid de opções simplificadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {USER_SITUATIONS.map((sit) => {
          const isSelected = selectedSituation === sit.id;
          return (
            <button
              key={sit.id}
              id={`service-option-${sit.id}`}
              onClick={() => onSelectSituation(sit.id)}
              className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
                isSelected
                  ? 'border-[#155BCB] bg-blue-50/40 ring-2 ring-[#155BCB]/20'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#155BCB] text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-[#155BCB] group-hover:text-white'
                  }`}
                >
                  {getIcon(sit.id)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{sit.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {sit.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {sit.badge}
                </span>
                <span className="text-xs text-[#155BCB] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Continuar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trust Micro-Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sem necessidade de cadastro prévio
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cálculo determinístico de prazos
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-blue-600" /> Base jurídica atualizada com a Lei 14.071/20
        </span>
      </div>
    </div>
  );
};
