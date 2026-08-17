import React, { useState } from 'react';
import {
  FileText,
  Car,
  Building,
  Calendar,
  MapPin,
  Clock,
  Gauge,
  Beer,
  Smartphone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { InfractionData, VehicleData } from '../../../types';
import { INFRACTION_CATALOG, AUTUADOR_BODIES } from '../../../data/knowledge-base';

interface InfractionDataStepProps {
  infractionData: InfractionData;
  vehicleData: VehicleData;
  infractionType: string;
  onUpdateInfraction: (data: InfractionData) => void;
  onUpdateVehicle: (data: VehicleData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const InfractionDataStep: React.FC<InfractionDataStepProps> = ({
  infractionData,
  vehicleData,
  infractionType,
  onUpdateInfraction,
  onUpdateVehicle,
  onNext,
  onBack,
}) => {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const handleSelectCatalogItem = (code: string) => {
    const matched = INFRACTION_CATALOG.find((item) => item.code === code);
    if (matched) {
      onUpdateInfraction({
        ...infractionData,
        infractionCode: matched.code,
        description: matched.description,
        ctbArticle: matched.article,
        severity: matched.severity,
        points: matched.points,
        fineAmount: matched.fineAmount,
        formalFlawsDetected: matched.typicalFlaws,
      });
    }
    setIsCatalogOpen(false);
  };

  const handleSelectBody = (bodyName: string) => {
    onUpdateInfraction({
      ...infractionData,
      autuadorBody: bodyName,
    });
  };

  const isRadar = infractionType === 'radar' || infractionData.infractionCode?.startsWith('74');
  const isLeiSeca = infractionType === 'lei_seca' || infractionData.infractionCode?.startsWith('516');
  const isCelular = infractionType === 'celular' || infractionData.infractionCode?.startsWith('736');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header with Source of Truth disclaimer */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 font-mono">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Fase 1 — Dados da Notificação (Fonte da Verdade)
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Informe os dados técnicos da sua autuação
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Esses dados alimentam diretamente as regras determinísticas do CTB e Resoluções do CONTRAN.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Privacidade Garantida & Análise Gratuita</p>
          <p className="text-[11px] text-blue-700 leading-snug">
            Nesta etapa não solicitamos CPF, RG, CNH ou seu endereço residencial. Apenas os dados técnicos da infração para diagnosticar possíveis nulidades e teses de defesa.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Código da Infração & Auto de Infração */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 relative">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Código da Infração *
            </label>
            <div className="flex gap-1.5">
              <input
                id="input-infraction-code"
                type="text"
                value={infractionData.infractionCode || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateInfraction({ ...infractionData, infractionCode: val });
                }}
                placeholder="Ex: 745-50"
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                className="px-2.5 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase font-mono hover:bg-slate-800 shrink-0 cursor-pointer"
                title="Buscar no catálogo CTB"
              >
                Catálogo
              </button>
            </div>

            {/* Catalog Dropdown Modal/List */}
            {isCatalogOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-xl p-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono px-2 py-1">
                  Infrações Comuns
                </p>
                {INFRACTION_CATALOG.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectCatalogItem(item.code)}
                    className="w-full text-left p-2 rounded-lg hover:bg-orange-50/50 text-xs flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{item.code}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.description}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.5 rounded">
                      {item.article}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Número do Auto (AIT) *
            </label>
            <input
              id="input-ait-number"
              type="text"
              value={infractionData.aitNumber || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, aitNumber: e.target.value })}
              placeholder="Ex: 1B892014"
              className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Enquadramento / Artigo CTB
            </label>
            <input
              id="input-ctb-article"
              type="text"
              value={infractionData.ctbArticle || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, ctbArticle: e.target.value })}
              placeholder="Ex: Art. 218, I do CTB"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Row 2: Órgão Autuador & Placa do Veículo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Órgão Autuador *
            </label>
            <input
              id="input-autuador-body"
              type="text"
              value={infractionData.autuadorBody || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, autuadorBody: e.target.value })}
              placeholder="Ex: DETRAN-SP, PRF, DNIT, CET-SP"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
            {/* Quick body chips */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['DETRAN-SP', 'DETRAN-RJ', 'PRF', 'DNIT', 'CET-SP'].map((body) => (
                <button
                  key={body}
                  type="button"
                  onClick={() => handleSelectBody(body)}
                  className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                >
                  {body}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Placa do Veículo *
            </label>
            <input
              id="input-vehicle-plate"
              type="text"
              value={vehicleData.plate || ''}
              onChange={(e) => onUpdateVehicle({ ...vehicleData, plate: e.target.value.toUpperCase() })}
              placeholder="Ex: BRA2E19"
              className="w-full text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Row 3: Data, Hora e Local da Ocorrência */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Data e Hora da Infração *
            </label>
            <input
              id="input-datetime"
              type="text"
              value={infractionData.dateTime || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, dateTime: e.target.value })}
              placeholder="AAAA-MM-DD HH:MM"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
              Local da Ocorrência (Endereço / Rodovia / KM) *
            </label>
            <input
              id="input-location"
              type="text"
              value={infractionData.location || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, location: e.target.value })}
              placeholder="Ex: Av. das Nações Unidas, alt. 14.401 — São Paulo/SP"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Conditional Radar Fields */}
        {isRadar && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-orange-500" />
              <h4 className="font-bold text-slate-900 text-xs font-mono uppercase">
                Dados Técnicos de Radar / Velocidade (Resolução 798 CONTRAN)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 font-mono block mb-1">
                  Velocidade Limite (km/h)
                </label>
                <input
                  id="input-speed-limit"
                  type="number"
                  value={infractionData.speedLimit || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, speedLimit: Number(e.target.value) })}
                  placeholder="60"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 font-mono block mb-1">
                  Velocidade Medida (km/h)
                </label>
                <input
                  id="input-speed-measured"
                  type="number"
                  value={infractionData.measuredSpeed || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, measuredSpeed: Number(e.target.value) })}
                  placeholder="71"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 font-mono block mb-1">
                  Velocidade Considerada
                </label>
                <input
                  id="input-speed-considered"
                  type="number"
                  value={infractionData.consideredSpeed || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, consideredSpeed: Number(e.target.value) })}
                  placeholder="64"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 font-mono block mb-1">
                  Última Aferição INMETRO
                </label>
                <input
                  id="input-inmetro-date"
                  type="date"
                  value={infractionData.inmetroAferitionDate || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, inmetroAferitionDate: e.target.value })}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Row 4: Descrição do Fato */}
        <div>
          <label className="text-[10px] font-bold text-slate-700 uppercase font-mono mb-1 block">
            Descrição do Fato / Observações da Autuação
          </label>
          <textarea
            id="input-description"
            rows={2}
            value={infractionData.description || ''}
            onChange={(e) => onUpdateInfraction({ ...infractionData, description: e.target.value })}
            placeholder="Descreva brevemente o enquadramento ou observações presentes no auto de infração..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <button
          id="btn-next-to-upload"
          onClick={onNext}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-orange-200"
        >
          <span>Avançar para Upload Opcional</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
