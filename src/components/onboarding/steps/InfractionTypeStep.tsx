import React from 'react';
import {
  Gauge,
  Beer,
  Smartphone,
  CircleSlash2,
  ParkingCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export type InfractionTypeOption = 'radar' | 'lei_seca' | 'celular' | 'vermelho' | 'estacionamento' | 'cnh_suspensao' | 'outro';

interface InfractionTypeStepProps {
  selectedType: InfractionTypeOption;
  onSelectType: (type: InfractionTypeOption) => void;
  onBack: () => void;
}

export const InfractionTypeStep: React.FC<InfractionTypeStepProps> = ({
  selectedType,
  onSelectType,
  onBack,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 font-mono">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Fase 1 — Tipo de Ocorrência
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Qual foi o motivo da autuação?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Isso nos ajuda a calibrar os requisitos técnicos de prova, como aferição de radar, resolução do CONTRAN e termos de constatação.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <button
          id="type-option-radar"
          onClick={() => onSelectType('radar')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'radar'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Excesso de Velocidade (Radar)</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Art. 218 do CTB. Radar fixo, estático ou portátil. Aferição INMETRO e sinalização R-19.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Res. 798 CONTRAN
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        <button
          id="type-option-lei-seca"
          onClick={() => onSelectType('lei_seca')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'lei_seca'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <Beer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Lei Seca / Bafômetro / Recusa</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Art. 165 e 165-A do CTB. Recusa ao teste, ausência de Termo de Sinais ou calibração do etilômetro.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Res. 432 CONTRAN
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        <button
          id="type-option-celular"
          onClick={() => onSelectType('celular')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'celular'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Celular ao Volante / GPS</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Art. 252 do CTB. Aparelho no suporte veicular, sem abordagem presencial ou detalhamento no AIT.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              Vício Formal AIT
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        <button
          id="type-option-vermelho"
          onClick={() => onSelectType('vermelho')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'vermelho'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <CircleSlash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Avanço de Sinal / Faixa Exclusiva</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Art. 208 e 184 do CTB. Tempo de amarelo insuficiente, travamento no cruzamento ou passagem de emergência.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
              Art. 29 CTB
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        <button
          id="type-option-estacionamento"
          onClick={() => onSelectType('estacionamento')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'estacionamento'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <ParkingCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Estacionamento / Parada</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Art. 181 do CTB. Falta de placa R-6a visível, vaga de carga e descarga ou pane mecânica justificada.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              Sinalização R-6
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        <button
          id="type-option-outro"
          onClick={() => onSelectType('outro')}
          className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs ${
            selectedType === 'outro'
              ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
              : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Outra Infração do CTB</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Cinto de segurança, ultrapassagem, licenciamento, película, farol ou autuações gerais.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Catálogo Completo
            </span>
            <span className="text-[10px] text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Avançar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </button>
      </div>

      <div className="pt-2 flex justify-start">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao serviço</span>
        </button>
      </div>
    </div>
  );
};
