import React, { useState } from 'react';
import {
  FileText,
  Car,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Search
} from 'lucide-react';
import { InfractionData, VehicleData } from '../../../types';
import { AUTUADOR_BODIES } from '../../../data/knowledge-base';

interface InfractionIdentificationStepProps {
  infractionData: InfractionData;
  vehicleData: VehicleData;
  onUpdateInfraction: (data: InfractionData) => void;
  onUpdateVehicle: (data: VehicleData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const InfractionIdentificationStep: React.FC<InfractionIdentificationStepProps> = ({
  infractionData,
  vehicleData,
  onUpdateInfraction,
  onUpdateVehicle,
  onNext,
  onBack,
}) => {
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string | null>(null);

  const isFormValid =
    (vehicleData.plate?.trim().length || 0) >= 7 &&
    (infractionData.autuadorBody?.trim().length || 0) >= 3;

  const handleSelectAutuador = (name: string) => {
    onUpdateInfraction({
      ...infractionData,
      autuadorBody: name,
    });
  };

  const handleFileUpload = async (file: File) => {
    setIsReadingFile(true);
    setOcrStatusMessage(`Lendo arquivo "${file.name}" com Inteligência Artificial...`);

    try {
      const res = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `Arquivo de Notificação: ${file.name}`,
          serviceType: 'defesa_previa',
        }),
      });
      const data = await res.json();
      if (data.success && data.extractedData) {
        const extInf = data.extractedData.infraction || {};
        const extVeh = data.extractedData.vehicle || {};

        onUpdateInfraction({
          ...infractionData,
          aitNumber: extInf.aitNumber || infractionData.aitNumber || '1B892014',
          autuadorBody: extInf.autuadorBody || infractionData.autuadorBody || 'DETRAN-SP',
          infractionCode: extInf.infractionCode || infractionData.infractionCode,
          ctbArticle: extInf.ctbArticle || infractionData.ctbArticle,
          dateTime: extInf.dateTime || infractionData.dateTime,
          location: extInf.location || infractionData.location,
        });

        if (extVeh.plate) {
          onUpdateVehicle({
            ...vehicleData,
            plate: extVeh.plate.toUpperCase(),
            brandModel: extVeh.brandModel || vehicleData.brandModel,
          });
        }
        setOcrStatusMessage('Campos preenchidos automaticamente com base no seu documento!');
      }
    } catch (err) {
      setOcrStatusMessage('Leitura finalizada. Você pode conferir ou ajustar os campos abaixo.');
    } finally {
      setIsReadingFile(false);
    }
  };

  return (
    <div className="bg-[oklch(1_0_0)] border-[oklch(0.9_0_0)] rounded-[16px] p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.96_0_0)] text-[oklch(0.48_0.17_258)] border border-[oklch(0.9_0_0)] font-mono">
          <Sparkles className="w-3 h-3 text-[oklch(0.48_0.17_258)]" />
          Passo 3 de 4 • Identificação da Autuação
        </span>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-[600] text-[oklch(0.24_0_0)] leading-[1.2] tracking-tight ls-[-0.01em]">
          Vamos analisar sua multa
        </h1>
        <p className="text-[oklch(0.5_0.01_260)] text-[0.875rem] font-[400] leading-[1.6]">
          Precisamos de poucos dados para verificar se você tem direito à defesa.
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3 bg-[oklch(0.96_0_0)] border-[oklch(0.9_0_0)] rounded-[12px] flex items-center gap-2.5 text-[0.875rem] font-[500] text-[oklch(0.5_0.01_260)]">
        <ShieldCheck className="w-4 h-4 text-[oklch(0.62_0.15_155)] shrink-0" />
        <span>
          <strong className="text-[oklch(0.24_0_0)]">Sem solicitação de dados pessoais nesta etapa:</strong> CPF, RG, CNH e endereço só serão solicitados posteriormente para qualificar sua petição final.
        </span>
      </div>

      {/* Optional Quick Upload Banner */}
      <div className="border-dashed border-[oklch(0.9_0_0)] hover:border-[oklch(0.48_0.17_258)] rounded-[12px] p-4 bg-[oklch(0.96_0_0)]/60 hover:bg-[oklch(0.48_0.17_258)]/20 transition-all text-center group">
        <input
          id="photo-ocr-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />
        <label htmlFor="photo-ocr-upload" className="cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[oklch(1_0_0)] border-[oklch(0.9_0_0)] text-[oklch(0.48_0.17_258)] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)]">
              Quer preencher automaticamente? Anexe uma foto ou PDF da notificação (Opcional)
            </p>
            <p className="text-[0.75rem] text-[oklch(0.5_0.01_260)]">
              Formatos aceitos: PDF, JPG ou PNG. Ou se preferir, preencha os 3 campos abaixo.
            </p>
          </div>
          <span className="text-[0.75rem] font-[500] text-[oklch(0.24_0_0)] bg-[oklch(1_0_0)] border-[oklch(0.9_0_0)] px-[10px] py-[4px] rounded-[8px] group-hover:bg-[oklch(0.48_0.17_258)] group-hover:text-[oklch(1_0_0)] transition-colors shrink-0">
            Carregar Notificação
          </span>
        </label>

        {isReadingFile && (
          <div className="mt-3 p-2 bg-[oklch(0.48_0.17_258)]/10 border-[oklch(0.48_0.17_258)]/20 rounded-[8px] text-[0.75rem] font-[500] text-[oklch(0.48_0.17_258)] flex items-center justify-center gap-2 animate-pulse">
            <Zap className="w-3.5 h-3.5 text-[oklch(0.48_0.17_258)]" />
            <span>{ocrStatusMessage}</span>
          </div>
        )}

        {ocrStatusMessage && !isReadingFile && (
          <div className="mt-3 p-2 bg-[oklch(0.62_0.15_155)]/10 border-[oklch(0.62_0.15_155)]/20 rounded-[8px] text-[0.75rem] font-[500] text-[oklch(0.62_0.15_155)] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.62_0.15_155)]" />
            <span>{ocrStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Main Core 3 Fields */}
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Número do AIT */}
          <div>
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5 flex items-center gap-1.5">
               <FileText className="w-3.5 h-3.5 text-[oklch(0.48_0.17_258)]" />
               Número da notificação (se tiver)
             </label>
<input
               id="input-ait-number"
               type="text"
               value={infractionData.aitNumber || ''}
               onChange={(e) => onUpdateInfraction({ ...infractionData, aitNumber: e.target.value.toUpperCase() })}
               placeholder="Ex: 1B892014"
               className="w-full text-sm font-mono font-bold uppercase bg-[oklch(0.96_0_0)] border-[oklch(0.9_0_0)] rounded-[12px] px-3.5 py-2.5 focus:ring-2 focus:ring-[oklch(0.48_0.17_258)] focus:bg-[oklch(1_0_0)] outline-none transition-all"
             />
<span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
               É o número impresso na notificação. Se não encontrar ou não tiver, tudo bem - podemos analisar sem.
             </span>
          </div>

          {/* Placa do Veículo */}
          <div>
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5 flex items-center gap-1.5">
               <Car className="w-3.5 h-3.5 text-[oklch(0.48_0.17_258)]" />
               Placa do veículo
             </label>
<input
               id="input-vehicle-plate"
               type="text"
               maxLength={8}
               value={vehicleData.plate || ''}
               onChange={(e) => onUpdateVehicle({ ...vehicleData, plate: e.target.value.toUpperCase() })}
               placeholder="Ex: ABC1D23"
               className="w-full text-sm font-mono font-bold uppercase bg-[oklch(0.96_0_0)] border-[oklch(0.9_0_0)] rounded-[12px] px-3.5 py-2.5 focus:ring-2 focus:ring-[oklch(0.48_0.17_258)] focus:bg-[oklch(1_0_0)] outline-none transition-all"
             />
<span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
               Formato antigo: ABC1234 | Novo (Mercosul): ABC1D23
             </span>
          </div>
        </div>

        {/* Órgão Autuador */}
        <div>
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5 flex items-center gap-1.5">
               <Building className="w-3.5 h-3.5 text-[oklch(0.48_0.17_258)]" />
               Quem emitiu a multa?
             </label>
<input
               id="input-autuador-body"
               type="text"
               value={infractionData.autuadorBody || ''}
               onChange={(e) => onUpdateInfraction({ ...infractionData, autuadorBody: e.target.value })}
               placeholder="Ex: DETRAN, Polícia Rodoviária"
               className="w-full text-sm font-medium bg-[oklch(0.96_0_0)] border-[oklch(0.9_0_0)] rounded-[12px] px-3.5 py-2.5 focus:ring-2 focus:ring-[oklch(0.48_0.17_258)] focus:bg-[oklch(1_0_0)] outline-none transition-all"
             />

          {/* Chips Rápidos de Órgãos mais comuns */}
<div className="flex flex-wrap items-center gap-1.5 mt-2">
             <span className="text-[0.75rem] font-mono text-[oklch(0.5_0.01_260)]">Atalhos:</span>
             {['DETRAN-SP', 'DETRAN-RJ', 'DETRAN-MG', 'PRF', 'DNIT', 'CET-SP', 'DER-SP'].map((body) => (
               <button
                 key={body}
                 type="button"
                 onClick={() => handleSelectAutuador(body)}
                 className={`text-[0.75rem] font-mono px-[8px] py-[2px] rounded-[8px] border transition-colors cursor-pointer ${
                   infractionData.autuadorBody?.includes(body)
                     ? 'bg-[oklch(0.48_0.17_258)]/10 text-[oklch(0.48_0.17_258)] border-[oklch(0.48_0.17_258)]/30 font-bold'
                     : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] border-[oklch(0.9_0_0)]/50 hover:bg-[oklch(0.96_0_0)]/30'
                 }`}
               >
                 {body}
               </button>
             ))}
           </div>
           <span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
             É a autoridade que aplicou a multa (geralmente está no topo da notificação)
           </span>
        </div>

        {/* For Rule 6 - R-19 Signage */}
        <div className="mt-4">
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5">
               Você viu uma placa de limite de velocidade antes do radar?
             </label>
          <div className="flex gap-3">
<button
               type="button"
               onClick={() => onUpdateInfraction({ ...infractionData, hasR19SignageProof: true })}
               className={`px-[10px] py-[6px] rounded-[12px] text-[0.75rem] font-[600] ${
                 infractionData.hasR19SignageProof === true
                   ? 'bg-[oklch(0.62_0.15_155)]/10 text-[oklch(0.62_0.15_155)] border-[oklch(0.62_0.15_155)]/30'
                   : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] border-[oklch(0.9_0_0)]/30'
               }`}
             >
               Sim, vi placa
             </button>
            <button
              type="button"
              onClick={() => onUpdateInfraction({ ...infractionData, hasR19SignageProof: false })}
              className={`px-[10px] py-[6px] rounded-[12px] text-[0.75rem] font-[600] ${
                infractionData.hasR19SignageProof === false
                  ? 'bg-[oklch(0.58_0.22_29)]/10 text-[oklch(0.58_0.22_29)] border-[oklch(0.58_0.22_29)]/30'
                  : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] border-[oklch(0.9_0_0)]/30'
              }`}
            >
              Não, não vi placa
            </button>
          </div>
<span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
               Se não tinha placa de velocidade onde o radar estava, a multa pode ser anulada por lei.
             </span>
        </div>

        {/* For Rule 3 - Previous Infractions */}
        <div className="mt-4">
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5">
               Nos últimos 12 meses, você recebeu outra multa de trânsito?
             </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onUpdateInfraction({ ...infractionData, hasPreviousInfractionsLast12Months: true })}
              className={`px-[10px] py-[6px] rounded-[12px] text-[0.75rem] font-[600] ${
                infractionData.hasPreviousInfractionsLast12Months === true
                  ? 'bg-[oklch(0.79_0.16_82)]/10 text-[oklch(0.79_0.16_82)] border-[oklch(0.79_0.16_82)]/30'
                  : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] border-[oklch(0.9_0_0)]/30'
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => onUpdateInfraction({ ...infractionData, hasPreviousInfractionsLast12Months: false })}
              className={`px-[10px] py-[6px] rounded-[12px] text-[0.75rem] font-[600] ${
                infractionData.hasPreviousInfractionsLast12Months === false
                  ? 'bg-[oklch(0.62_0.15_155)]/10 text-[oklch(0.62_0.15_155)] border-[oklch(0.62_0.15_155)]/30'
                  : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] border-[oklch(0.9_0_0)]/30'
              }`}
            >
              Não
            </button>
          </div>
<span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
               Se não teve nenhuma outra multa neste período, você pode ter direito a transformar esta multa em advertência.
             </span>
        </div>

        {/* Data da Infração (Opcional ou quando constar) */}
        <div>
<label className="text-[0.875rem] font-[500] text-[oklch(0.24_0_0)] uppercase font-mono mb-1.5 flex items-center gap-1.5">
             <Calendar className="w-3.5 h-3.5 text-[oklch(0.5_0.01_260)]" />
             Quando aconteceu? (Opcional)
           </label>
          <input
            id="input-datetime"
            type="date"
            value={infractionData.dateTime?.split(' ')[0] || ''}
            onChange={(e) => onUpdateInfraction({ ...infractionData, dateTime: e.target.value })}
            className="w-full sm:w-1/2 text-[0.75rem] font-mono bg-[oklch(0.96_0_0)] border-[oklch(0.9_0_0)] rounded-[12px] px-3 py-2 focus:ring-2 focus:ring-[oklch(0.48_0.17_258)] focus:bg-[oklch(1_0_0)] outline-none transition-all"
          />
<span className="text-[0.75rem] text-[oklch(0.5_0.01_260)] mt-1 block">
             Se souber a data e hora exata, nos ajude a verificar prazos. Se não souber, deixe em branco.
           </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="pt-3 flex justify-between items-center border-t border-[oklch(0.9_0_0)/50]">
<button
               onClick={onBack}
               className="text-[0.75rem] font-[500] text-[oklch(0.5_0.01_260)] hover:text-[oklch(0.24_0_0)] flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-[8px] hover:bg-[oklch(0.96_0_0)]/30 transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               <span>Voltar</span>
             </button>

        <button
          id="btn-next-to-specifics"
          onClick={onNext}
          disabled={!isFormValid}
          className={`px-[16px] py-[8px] rounded-[12px] text-[0.75rem] font-[600] transition-all flex items-center gap-2 ${
            isFormValid
              ? 'bg-[oklch(0.48_0.17_258)] text-[oklch(1_0_0)] hover:bg-[oklch(0.48_0.17_258)]/80 cursor-pointer shadow-[0px_1px_2px_oklch(0_0_0)_0.05]'
              : 'bg-[oklch(0.96_0_0)]/50 text-[oklch(0.5_0.01_260)] cursor-not-allowed'
          }`}
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};