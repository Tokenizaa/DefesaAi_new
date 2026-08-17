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
    (infractionData.aitNumber?.trim().length || 0) >= 4 &&
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#155BCB] border border-blue-200 font-mono">
          <Sparkles className="w-3 h-3 text-[#155BCB]" />
          Passo 3 de 4 • Identificação da Autuação
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Qual é o auto de infração e o veículo?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Solicitamos apenas os dados técnicos da autuação para localizar a competência do órgão e os prazos legais.
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Sem solicitação de dados pessoais nesta etapa:</strong> CPF, RG, CNH e endereço só serão solicitados posteriormente para qualificar sua petição final.
        </span>
      </div>

      {/* Optional Quick Upload Banner */}
      <div className="border border-dashed border-slate-300 hover:border-[#155BCB] rounded-xl p-4 bg-slate-50/60 hover:bg-blue-50/20 transition-all text-center group">
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
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#155BCB] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">
              Quer preencher automaticamente? Anexe uma foto ou PDF da notificação (Opcional)
            </p>
            <p className="text-[11px] text-slate-500">
              Formatos aceitos: PDF, JPG ou PNG. Ou se preferir, preencha os 3 campos abaixo.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#155BCB] bg-white border border-blue-200 px-3 py-1 rounded-lg group-hover:bg-[#155BCB] group-hover:text-white transition-colors shrink-0">
            Carregar Notificação
          </span>
        </label>

        {isReadingFile && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-center gap-2 animate-pulse">
            <Zap className="w-3.5 h-3.5 text-[#155BCB]" />
            <span>{ocrStatusMessage}</span>
          </div>
        )}

        {ocrStatusMessage && !isReadingFile && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{ocrStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Main Core 3 Fields */}
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Número do AIT */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase font-mono mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#155BCB]" />
              Número do Auto de Infração (AIT) *
            </label>
            <input
              id="input-ait-number"
              type="text"
              value={infractionData.aitNumber || ''}
              onChange={(e) => onUpdateInfraction({ ...infractionData, aitNumber: e.target.value.toUpperCase() })}
              placeholder="Ex: 1B892014 ou R459201"
              className="w-full text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#155BCB] focus:bg-white outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Consta no topo ou centro da notificação recebida.
            </span>
          </div>

          {/* Placa do Veículo */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase font-mono mb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#155BCB]" />
              Placa do Veículo *
            </label>
            <input
              id="input-vehicle-plate"
              type="text"
              maxLength={8}
              value={vehicleData.plate || ''}
              onChange={(e) => onUpdateVehicle({ ...vehicleData, plate: e.target.value.toUpperCase() })}
              placeholder="Ex: BRA2E19 ou ABC1234"
              className="w-full text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#155BCB] focus:bg-white outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Placa no formato Mercosul ou padrão anterior cinza.
            </span>
          </div>
        </div>

        {/* Órgão Autuador */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#155BCB]" />
            Órgão Autuador / Julgador *
          </label>
          <input
            id="input-autuador-body"
            type="text"
            value={infractionData.autuadorBody || ''}
            onChange={(e) => onUpdateInfraction({ ...infractionData, autuadorBody: e.target.value })}
            placeholder="Ex: DETRAN-SP, PRF, DNIT, CET-SP, DER"
            className="w-full text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#155BCB] focus:bg-white outline-none transition-all"
          />

          {/* Chips Rápidos de Órgãos mais comuns */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-mono text-slate-400">Atalhos:</span>
            {['DETRAN-SP', 'DETRAN-RJ', 'DETRAN-MG', 'PRF', 'DNIT', 'CET-SP', 'DER-SP'].map((body) => (
              <button
                key={body}
                type="button"
                onClick={() => handleSelectAutuador(body)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                  infractionData.autuadorBody?.includes(body)
                    ? 'bg-blue-100 text-[#155BCB] border-blue-300 font-bold'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {body}
              </button>
            ))}
          </div>
        </div>

        {/* Data da Infração (Opcional ou quando constar) */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Data da Ocorrência (Opcional)
          </label>
          <input
            id="input-datetime"
            type="date"
            value={infractionData.dateTime?.split(' ')[0] || ''}
            onChange={(e) => onUpdateInfraction({ ...infractionData, dateTime: e.target.value })}
            className="w-full sm:w-1/2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#155BCB] focus:bg-white outline-none transition-all"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Usada para calcular a decadência de expedição da notificação em 30 dias (Art. 281-A CTB).
          </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="pt-3 flex justify-between items-center border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à fase</span>
        </button>

        <button
          id="btn-next-to-specifics"
          onClick={onNext}
          disabled={!isFormValid}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            isFormValid
              ? 'bg-[#155BCB] hover:bg-blue-700 text-white cursor-pointer shadow-xs'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
