import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Scale,
  Car,
} from 'lucide-react';
import { useRouter } from '../../core/router/RouterContext';
import { CaseDocumentData } from '../../types';

interface CaseDocumentViewProps {
  documentData: CaseDocumentData;
  onClose: () => void;
  isLoading: boolean;
}

export const CaseDocumentView: React.FC<CaseDocumentViewProps> = ({
  documentData,
  onClose,
  isLoading,
}) => {
  const { navigate } = useRouter();
  
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, isDownloadInProgress] = useState(false);
  
  // Load document preview text
  useEffect(() => {
    if (documentData.content) {
      setPreviewText(documentData.content);
    }
  }, [documentData.content]);
  
  const handleDownload = async () => {
    if (isDownloadInProgress) return;
    
    setIsDownloadInProgress(true);
    try {
      // In a real implementation, this would call an API to download the file
      // For now, we'll simulate the download
      const blob = new Blob([documentData.content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentData.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setIsDownloadInProgress(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono gap-3">
        <Clock className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">Carregando documento: {documentData.title}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 max-w-4xl mx-auto min-h-[800px] text-slate-900 font-serif leading-relaxed text-xs sm:text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {documentData.title}
            </h2>
            <p className="text-[10px] text-slate-500">
              {documentData.applicantName} • AIT: {documentData.aitNumber}
            </p>
          </div>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloadInProgress}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isDownloadInProgress ? 'bg-slate-400 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isDownloadInProgress ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className={`ml-1 ${isDownloadInProgress ? 'text-gray-400' : 'text-orange-500'}`}>
              {isDownloadInProgress ? 'Baixando...' : 'Baixar'}
            </span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="ml-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onClose}
            className="ml-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>
      </div>
      
      {isPreviewOpen && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4">
            <div>
              <FileText className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-white">{documentData.title}</h3>
              <p className="text-[10px] text-slate-400">
                Cliente: {documentData.applicantName} • AIT: {documentData.aitNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto bg-slate-950 flex-1 text-slate-200 text-xs leading-relaxed space-y-4 whitespace-pre-wrap selection:bg-orange-500 selection:text-white">
            {previewText}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500">
              Motor: {documentData.engine} • Versão {documentData.version}
            </span>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Concluir Leitura
            </button>
          </div>
        </div>
      )}
    </div>
  );
};