import React, { useEffect } from 'react';
import {
  Gauge,
  Wine,
  Smartphone,
  CircleDot,
  ParkingSquare,
  ShieldQuestion,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { InfractionData } from '../../../types';
import { InfractionCategory, calculateConsideredSpeed } from '../../../core/onboarding/rules-matrix';
import { INFRACTION_CATALOG } from '../../../data/knowledge-base';

interface SpecificInfractionDataStepProps {
  category: InfractionCategory;
  infractionData: InfractionData;
  onSelectCategory: (cat: InfractionCategory) => void;
  onUpdateInfraction: (data: InfractionData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SpecificInfractionDataStep: React.FC<SpecificInfractionDataStepProps> = ({
  category,
  infractionData,
  onSelectCategory,
  onUpdateInfraction,
  onNext,
  onBack,
}) => {
  // Update consideredSpeed automatically when measuredSpeed is provided
  useEffect(() => {
    if (category === 'excesso_velocidade' && infractionData.measuredSpeed) {
      const computed = calculateConsideredSpeed(Number(infractionData.measuredSpeed));
      if (computed && computed !== infractionData.consideredSpeed) {
        onUpdateInfraction({
          ...infractionData,
          consideredSpeed: computed,
        });
      }
    }
  }, [category, infractionData.measuredSpeed]);

  const categoriesList: { id: InfractionCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'excesso_velocidade', label: 'Velocidade / Radar', icon: <Gauge className="w-4 h-4" /> },
    { id: 'lei_seca', label: 'Lei Seca / Bafômetro', icon: <Wine className="w-4 h-4" /> },
    { id: 'celular', label: 'Celular ao Volante', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'vermelho', label: 'Sinal Vermelho', icon: <CircleDot className="w-4 h-4" /> },
    { id: 'estacionamento', label: 'Estacionamento', icon: <ParkingSquare className="w-4 h-4" /> },
    { id: 'conversao_advertencia', label: 'Advertência (Art. 267)', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'outro', label: 'Outra Infração', icon: <ShieldQuestion className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#155BCB] border border-blue-200 font-mono">
          <Sparkles className="w-3 h-3 text-[#155BCB]" />
          Passo 4 de 4 • Perguntas Específicas do Seu Caso
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Sobre o tipo da infração
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Responda apenas às perguntas relevantes para localizarmos as teses de anulação aplicáveis ao seu caso.
        </p>
      </div>

      {/* Category Switcher Tabs */}
      <div className="flex flex-wrap gap-2 justify-center p-1.5 bg-slate-100/80 rounded-xl">
        {categoriesList.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#155BCB] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Form Content by Category */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
        {/* Category: Radar / Excesso de Velocidade */}
        {category === 'excesso_velocidade' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Gauge className="w-4 h-4 text-[#155BCB]" />
              <span>Dados Técnicos do Medidor de Velocidade (Resolução CONTRAN 798/20)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Limite da Via (km/h) *
                </label>
                <input
                  id="input-speed-limit"
                  type="number"
                  value={infractionData.speedLimit || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, speedLimit: Number(e.target.value) })}
                  placeholder="Ex: 60"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Velocidade Medida (km/h) *
                </label>
                <input
                  id="input-measured-speed"
                  type="number"
                  value={infractionData.measuredSpeed || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, measuredSpeed: Number(e.target.value) })}
                  placeholder="Ex: 73"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Considerada (com tolerância)
                </label>
                <input
                  id="input-considered-speed"
                  type="number"
                  value={infractionData.consideredSpeed || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, consideredSpeed: Number(e.target.value) })}
                  placeholder="Ex: 66"
                  className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Data da Aferição INMETRO (se constar no auto)
                </label>
                <input
                  id="input-inmetro-date"
                  type="date"
                  value={infractionData.inmetroAferitionDate || ''}
                  onChange={(e) => onUpdateInfraction({ ...infractionData, inmetroAferitionDate: e.target.value })}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Aferição superior a 12 meses gera anulação imediata.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Havia placa de velocidade R-19 visível?
                </label>
                <select
                  id="select-speed-sign"
                  value={infractionData.notes?.includes('sem_placa') ? 'sem_placa' : 'visivel'}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateInfraction({
                      ...infractionData,
                      notes: val === 'sem_placa' ? 'sem_placa_visivel_art90' : 'placa_ok',
                    });
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                >
                  <option value="visivel">Sim, havia placa no trecho</option>
                  <option value="sem_placa">Não havia placa ou estava encoberta/apagada (Art. 90 CTB)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Category: Lei Seca */}
        {category === 'lei_seca' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Wine className="w-4 h-4 text-rose-600" />
              <span>Procedimento de Fiscalização de Alcoolemia (Resolução CONTRAN 432/13)</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                  Qual foi a situação no momento da abordagem? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateInfraction({
                        ...infractionData,
                        ctbArticle: 'Art. 165-A do CTB',
                        infractionCode: '516-91',
                        notes: 'recusa_bafometro',
                      });
                    }}
                    className={`p-3 text-left border rounded-lg text-xs transition-all cursor-pointer ${
                      infractionData.infractionCode === '516-91' || infractionData.notes?.includes('recusa')
                        ? 'border-[#155BCB] bg-blue-50/50 font-bold text-slate-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold">Recusa ao teste do bafômetro (Art. 165-A)</p>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Condutor optou por não soprar o aparelho.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateInfraction({
                        ...infractionData,
                        ctbArticle: 'Art. 165 do CTB',
                        infractionCode: '516-92',
                        notes: 'teste_positivo',
                      });
                    }}
                    className={`p-3 text-left border rounded-lg text-xs transition-all cursor-pointer ${
                      infractionData.infractionCode === '516-92' || infractionData.notes?.includes('positivo')
                        ? 'border-[#155BCB] bg-blue-50/50 font-bold text-slate-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold">Realizou o teste do bafômetro (Art. 165)</p>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Medição apontou alteração miligráfica.
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                    Houve entrega de Termo de Constatação de Sinais?
                  </label>
                  <select
                    id="select-termo-sinais"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                    onChange={(e) => {
                      onUpdateInfraction({
                        ...infractionData,
                        notes: `${infractionData.notes || ''} | termo_${e.target.value}`,
                      });
                    }}
                  >
                    <option value="nao_entregue">Não me entregaram nenhum termo anexo</option>
                    <option value="sem_sinais">Termo não descreve sinais psicomotores visíveis</option>
                    <option value="entregue">Sim, termo preenchido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                    Foi oferecida contraprova ou reteste de 15 min?
                  </label>
                  <select
                    id="select-reteste"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                    onChange={(e) => {
                      onUpdateInfraction({
                        ...infractionData,
                        notes: `${infractionData.notes || ''} | reteste_${e.target.value}`,
                      });
                    }}
                  >
                    <option value="nao_oferecido">Não foi oferecido reteste ou contraprova</option>
                    <option value="oferecido">Sim, foi oferecido</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category: Celular */}
        {category === 'celular' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-[#155BCB]" />
              <span>Circunstâncias da Autuação por Celular (Art. 252 CTB / MBFT)</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                Qual era a situação do aparelho e do veículo?
              </label>
              <select
                id="select-celular-circunstancia"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                onChange={(e) => {
                  onUpdateInfraction({
                    ...infractionData,
                    ctbArticle: 'Art. 252, Parágrafo Único do CTB',
                    infractionCode: '736-62',
                    notes: `celular_${e.target.value}`,
                  });
                }}
              >
                <option value="suporte_gps">Aparelho fixado no suporte veicular (Navegação GPS / Waze)</option>
                <option value="veiculo_parado_semaforo">Veículo imobilizado no semáforo / congestionamento</option>
                <option value="sem_abordagem">Agente não parou o veículo (sem abordagem presencial)</option>
                <option value="viva_voz">Uso de sistema viva-voz / Bluetooth integrado</option>
              </select>
            </div>
          </div>
        )}

        {/* Category: Sinal Vermelho */}
        {category === 'vermelho' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CircleDot className="w-4 h-4 text-amber-600" />
              <span>Circunstâncias da Infração Semafórica (Art. 208 do CTB)</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                Qual foi o motivo da passagem no cruzamento?
              </label>
              <select
                id="select-vermelho-motivo"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                onChange={(e) => {
                  onUpdateInfraction({
                    ...infractionData,
                    ctbArticle: 'Art. 208 do CTB',
                    infractionCode: '605-01',
                    notes: `vermelho_${e.target.value}`,
                  });
                }}
              >
                <option value="amarelo_rapido">Tempo da luz amarela excessivamente curto (frenagem perigosa)</option>
                <option value="emergencia">Ceder passagem para ambulância / viatura policial (Art. 29, VII)</option>
                <option value="noturno_seguranca">Madrugada / horário noturno por motivo de segurança pública</option>
                <option value="cruzamento_travado">Veículo já havia iniciado a travessia antes do sinal vermelho</option>
              </select>
            </div>
          </div>
        )}

        {/* Category: Estacionamento */}
        {category === 'estacionamento' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ParkingSquare className="w-4 h-4 text-[#155BCB]" />
              <span>Circunstâncias da Parada / Estacionamento (Art. 181 do CTB)</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                Qual era a situação fática da parada?
              </label>
              <select
                id="select-estacionamento-tipo"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
                onChange={(e) => {
                  onUpdateInfraction({
                    ...infractionData,
                    ctbArticle: 'Art. 181 do CTB',
                    infractionCode: '545-21',
                    notes: `estacionamento_${e.target.value}`,
                  });
                }}
              >
                <option value="embarque_rapido">Parada rápida de embarque/desembarque de passageiros (Art. 47 CTB)</option>
                <option value="sinalizacao_apagada">Sem placa R-6a regulamentar visível no trecho</option>
                <option value="pane_mecanica">Veículo apresentou pane mecânica / emergência com pisca-alerta</option>
                <option value="zona_azul_app">Falha de aplicativo de estacionamento rotativo (Zona Azul)</option>
              </select>
            </div>
          </div>
        )}

        {/* Category: Conversão em Advertência (Art. 267 CTB) */}
        {category === 'conversao_advertencia' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Requisitos Legais para 100% de Isenção (Art. 267 do CTB)</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2">
              <p className="font-semibold">
                Pela Lei 14.071/2020, se você não cometeu nenhuma outra infração nos últimos 12 meses, a autoridade de trânsito é OBRIGADA a converter sua multa em advertência por escrito (0 reais de valor e 0 pontos na CNH).
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pt-1">
                <input
                  type="checkbox"
                  id="chk-no-reoffense"
                  defaultChecked
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="chk-no-reoffense" className="cursor-pointer">
                  Confirmo que não cometi nenhuma infração nos últimos 12 meses.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Category: Outro / Geral */}
        {category === 'outro' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldQuestion className="w-4 h-4 text-[#155BCB]" />
              <span>Outras Infrações do Código de Trânsito Brasileiro</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                Selecione a infração no Catálogo Oficial ou descreva abaixo:
              </label>
              <select
                id="select-catalog-infraction"
                value={infractionData.infractionCode || ''}
                onChange={(e) => {
                  const item = INFRACTION_CATALOG.find((x) => x.code === e.target.value);
                  if (item) {
                    onUpdateInfraction({
                      ...infractionData,
                      infractionCode: item.code,
                      ctbArticle: item.article,
                      fineAmount: item.fineAmount,
                      points: item.points,
                      severity: item.severity,
                    });
                  }
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-[#155BCB] outline-none"
              >
                <option value="">Selecione a infração...</option>
                {INFRACTION_CATALOG.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} — {item.article} — {item.description.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase font-mono block mb-1">
                Breve relato do que ocorreu (Opcional):
              </label>
              <textarea
                id="textarea-relato"
                rows={2}
                value={infractionData.notes || ''}
                onChange={(e) => onUpdateInfraction({ ...infractionData, notes: e.target.value })}
                placeholder="Ex: Não recebi a notificação a tempo, ou havia erro na cor do veículo..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#155BCB]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos dados</span>
        </button>

        <button
          id="btn-run-analysis"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#155BCB] hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-all flex items-center gap-2"
        >
          <span>Executar Análise Gratuita</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
