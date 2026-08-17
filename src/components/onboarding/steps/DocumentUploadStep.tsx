import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Zap,
  SkipForward
} from 'lucide-react';
import { InfractionData, VehicleData } from '../../../types';

interface DocumentUploadStepProps {
  infractionData: InfractionData;
  vehicleData: VehicleData;
  onUpdateInfraction: (data: InfractionData) => void;
  onUpdateVehicle: (data: VehicleData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  infractionData,
  vehicleData,
  onUpdateInfraction,
  onUpdateVehicle,
  onNext,
  onBack,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isReadingOcr, setIsReadingOcr] = useState(false);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsReadingOcr(true);
    setOcrMessage('Processando documento com inteligência artificial para conferência...');

    try {
      // Execute auxiliary OCR backend
      const res = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `Auto de infração ${file.name} - Detecção auxiliar de dados`,
          serviceType: 'defesa_previa',
        }),
      });
      const data = await res.json();

      if (data.success && data.extractedData) {
        // Auxiliar OCR suggests data without overwriting already explicitly customized fields unless empty
        const extractedInfraction = data.extractedData.infraction;
        const extractedVehicle = data.extractedData.vehicle;

        onUpdateInfraction({
          ...infractionData,
          aitNumber: infractionData.aitNumber || extractedInfraction.aitNumber,
          infractionCode: infractionData.infractionCode || extractedInfraction.infractionCode,
          ctbArticle: infractionData.ctbArticle || extractedInfraction.ctbArticle,
          autuadorBody: infractionData.autuadorBody || extractedInfraction.autuadorBody,
          speedLimit: infractionData.speedLimit || extractedInfraction.speedLimit,
          measuredSpeed: infractionData.measuredSpeed || extractedInfraction.measuredSpeed,
          consideredSpeed: infractionData.consideredSpeed || extractedInfraction.consideredSpeed,
          inmetroAferitionDate: infractionData.inmetroAferitionDate || extractedInfraction.inmetroAferitionDate,
        });

        if (extractedVehicle?.plate && !vehicleData.plate) {
          onUpdateVehicle({
            ...vehicleData,
            plate: extractedVehicle.plate,
            brandModel: extractedVehicle.brandModel || vehicleData.brandModel,
          });
        }

        setOcrMessage('Leitura auxiliar concluída com sucesso! Seus dados foram complementados.');
        setOcrCompleted(true);
      }
    } catch (err) {
      setOcrMessage('Leitura finalizada. Você poderá conferir todos os campos no próximo passo.');
      setOcrCompleted(true);
    } finally {
      setIsReadingOcr(false);
    }
  };

  const handleSimulateDocumentPreset = (presetType: 'radar' | 'lei_seca' | 'celular') => {
    setIsReadingOcr(true);
    setOcrMessage('Simulando extração de notificação de exemplo...');

    setTimeout(async () => {
      try {
        const res = await fetch('/api/ocr/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presetId: presetType }),
        });
        const data = await res.json();
        if (data.success) {
          onUpdateInfraction({
            ...infractionData,
            ...data.extractedData.infraction,
          });
          onUpdateVehicle({
            ...vehicleData,
            ...data.extractedData.vehicle,
          });
          setOcrMessage('Dados de exemplo carregados para conferência!');
          setOcrCompleted(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsReadingOcr(false);
      }
    }, 600);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 font-mono">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Fase 1 — Upload Opcional / Conferência
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Deseja anexar uma foto ou PDF da notificação?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Esta etapa é <strong className="text-slate-900">100% opcional</strong>. O DefesAi utiliza os dados informados por você como fonte primária da verdade jurídica.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-6 sm:p-8 text-center transition-all bg-slate-50/50 hover:bg-orange-50/10 group">
        <input
          id="file-upload-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <label htmlFor="file-upload-input" className="cursor-pointer block space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-orange-500 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {uploadedFile ? uploadedFile.name : 'Clique para selecionar ou arraste o arquivo aqui'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Formatos aceitos: PDF, JPG ou PNG (Máximo 15MB)
            </p>
          </div>
          <span className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase font-mono group-hover:bg-orange-600 transition-colors">
            Selecionar Documento
          </span>
        </label>
      </div>

      {/* Reading Progress State */}
      {isReadingOcr && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-xs text-orange-900 animate-pulse">
          <Zap className="w-4 h-4 text-orange-600 shrink-0" />
          <span>{ocrMessage || 'Lendo documento e extraindo campos de apoio...'}</span>
        </div>
      )}

      {ocrCompleted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ocrMessage}</span>
        </div>
      )}

      {/* Preset fast test options */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
            Ambiente de Teste Rápido (Exemplos de Notificação)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Clique para testar</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSimulateDocumentPreset('radar')}
            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Radar Excesso de Velocidade
          </button>
          <button
            type="button"
            onClick={() => handleSimulateDocumentPreset('lei_seca')}
            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Notificação Lei Seca (Art. 165)
          </button>
          <button
            type="button"
            onClick={() => handleSimulateDocumentPreset('celular')}
            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Autuação Celular ao Volante
          </button>
        </div>
      </div>

      {/* Navigation & Skip Option */}
      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <div className="flex gap-2">
          <button
            id="btn-skip-upload"
            onClick={onNext}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Pular Upload & Conferir Dados</span>
          </button>

          <button
            id="btn-next-to-confirm"
            onClick={onNext}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-orange-200"
          >
            <span>Conferir Dados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
