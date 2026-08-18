import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Scale,
  Zap,
  FileSearch
} from 'lucide-react';

interface AnalysisProcessingStepProps {
  onComplete: () => void;
  infractionData: any;
  vehicleData?: any;
  // Add other data as needed, for example:
  // driverData?: any;
  // evidenceData?: any;
}

export const AnalysisProcessingStep: React.FC<AnalysisProcessingStepProps> = ({ 
  onComplete, 
  infractionData, 
  vehicleData 
}) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/agents/ai-analysis/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            infractionData,
            vehicleData,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setResults(result);
        
        // Call onComplete after a short delay to allow user to see results
        setTimeout(() => {
          onComplete();
        }, 3000);
      } catch (err) {
        setError(err.message);
        // Call onComplete after a short delay to allow user to see error
        setTimeout(() => {
          onComplete();
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [infractionData, vehicleData, onComplete]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-2xs animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 font-mono">
            Processamento em Tempo Real
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Analisando sua autuação com Inteligência Jurídica
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            Aguarde enquanto nossos agentes de IA processam sua autuação...
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="w-12 h-12 border-2 border-orange-200 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-2xs">
          <FileSearch className="w-8 h-8" /> {/* Using FileSearch as error icon, you might want to change */}
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 font-mono">
            Erro no Processamento
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ocorreu um erro durante a análise
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (results) {
    // Assuming results structure: { overallSuccessRate, detectedInconsistencies, recommendedArguments, ... }
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 font-mono">
            Análise Concluída
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Diagnóstico Jurídico Completo
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            Nossa IA analisou sua autuação e identificou pontos-chave para sua defesa.
          </p>
        </div>

        {/* Results Display */}
        <div className="space-y-4 max-w-md mx-auto text-left">
          {/* Overall Success Rate */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-medium text-slate-900 mb-2">Probabilidade de Deferimento</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                {Math.round(results.overallSuccessRate * 100)}%
              </div>
              <span className="text-slate-700 font-medium">
                {results.overallSuccessRate >= 0.7 ? 'Alta' : results.overallSuccessRate >= 0.4 ? 'Média' : 'Baixa'}
              </span>
            </div>
          </div>

          {/* Detected Inconsistencies */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-medium text-slate-900 mb-2">Inconsistências Detectadas</h3>
            {results.detectedInconsistencies.length > 0 ? (
              <ul className="space-y-2 text-slate-600 text-sm">
                {results.detectedInconsistencies.map((inconsistency: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{inconsistency}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">Nenhuma inconsistência relevante identificada.</p>
            )}
          </div>

          {/* Recommended Arguments */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-medium text-slate-900 mb-2">Argumentos Recomendados para Defesa</h3>
            {results.recommendedArguments.length > 0 ? (
              <ol className="space-y-2 text-slate-600 text-sm list-decimal pl-5">
                {results.recommendedArguments.map((arg: string, index: number) => (
                  <li key={index}>{arg}</li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum argumento específico recomendado nesta análise.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback state (should not happen with loading state)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
      <p>Preparando análise...</p>
    </div>
  );
};
