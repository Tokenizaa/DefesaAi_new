import React from 'react';
import {
  FileText,
  Scale,
  Building,
  UserCheck,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { USER_PROCESS_STAGES, UserProcessStage } from '../../../core/onboarding/rules-matrix';

interface DefenseStageStepProps {
  selectedStage: UserProcessStage;
  onSelectStage: (stage: UserProcessStage) => void;
  onBack: () => void;
}

export const DefenseStageStep: React.FC<DefenseStageStepProps> = ({
  selectedStage,
  onSelectStage,
  onBack,
}) => {
  const getIcon = (id: UserProcessStage) => {
    switch (id) {
      case 'primeira_notificacao':
        return <FileText className="w-5 h-5" />;
      case 'notificacao_penalidade':
        return <Scale className="w-5 h-5" />;
      case 'defesa_negada':
        return <Scale className="w-5 h-5" />;
      case 'recurso_jari_negado':
        return <Building className="w-5 h-5" />;
      case 'conversao_advertencia':
        return <UserCheck className="w-5 h-5" />;
      case 'nao_tenho_certeza':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header com pergunta direta e acolhedora */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#155BCB] border border-blue-200 font-mono">
          <Sparkles className="w-3 h-3 text-[#155BCB]" />
          Passo 2 de 4 • Fase do Processo
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Em que situação está sua multa?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          A fase define se o recurso será direcionado à Autoridade de Trânsito, JARI ou CETRAN.
        </p>
      </div>

      {/* Grid de opções de fase em linguagem acessível */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {USER_PROCESS_STAGES.map((stg) => {
          const isSelected = selectedStage === stg.id;
          return (
            <button
              key={stg.id}
              id={`stage-option-${stg.id}`}
              onClick={() => onSelectStage(stg.id)}
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
                  {getIcon(stg.id)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{stg.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {stg.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {stg.badge}
                </span>
                <span className="text-xs text-[#155BCB] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Selecionar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="pt-2 flex justify-start">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à situação</span>
        </button>
      </div>
    </div>
  );
};
