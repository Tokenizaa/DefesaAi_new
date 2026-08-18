import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Scale,
  Car,
  Printer,
  X,
  Shield,
  Error,
  Loading,
  Text,
  Divider,
} from 'lucide-react';
import { useRouter } from '../../core/router/RouterContext';
import { CaseDomain, LegalArgumentDomain } from '../../types';

// Mock types for AI analysis results
interface AIAnalysisResult {
  confidenceScore: number;
  inconsistencies: string[];
  recommendedArguments: LegalArgumentDomain[];
  analysisStage: 'initial' | 'detailed' | 'completed';
}

interface AIAnalysisViewProps {
  analysis: AIAnalysisResult | null;
  caseId: string;
  onClose: () => void;
  isLoading: boolean;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  analysis,
  caseId,
  onClose,
  isLoading,
}) => {
  const { navigate } = useRouter();
  
  const [expandedInconsistencies, setExpandedInconsistencies] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  useEffect(() => {
    // In a real implementation, this would fetch AI analysis data
    // For now, we'll simulate with mock data
    const mockAnalysis: AIAnalysisResult = {
      confidenceScore: 87,
      inconsistencies: [
        'Inconsistência entre depoimento do testemunho e documento oficial',
        'Contradição entre valores declarados e registros de rastreamento',
        'Desconexão entre alegações de infração e evidências fotográficas'
      ],
      recommendedArguments: [
        {
          id: 'ARG-001',
          title: 'Inadimplência técnica na notificação de autuação",
          category: 'Técnica',
          summary: 'A notificação contém informações incompletas sobre a data e horário da suposta infração',
          legalBase: 'Art. 226 do CTB'
        },
        {
          id: 'ARG-003',
          title: 'Procedimento administrativo irregular",
          category: 'Procedural',
          summary: "A notificação não observou o prazo de 15 dias para contestação estabelecido no art. 228 do CTB",
          legalBase: 'Art. 228 do CTB'
        },
        {
          id: 'ARG-007',
          title: 'Evidência insuficiente de velocidade",
          category: 'Technical",
          summary: "As medições de velocidade não foram validadas por perícia técnica reconhecida",
          legalBase: 'Art. 254 do CTB'
        }
      ],
      analysisStage: 'completed'
    };
    
    setAnalysis(mockAnalysis);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono gap-3">
        <Loading className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">Analisando dados do caso {caseId}...</p>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Análise de Defesa com IA</h3>
            <p className="text-sm text-slate-500">
              Processo de análise automática que identifica inconsistências e sugere argumentos jurídicos com base em padrões jurisprudenciais.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/cases/${caseId}`)}
          className="px-4 py-2 mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Shield className="w-4 h-4 mr-1" />
          Voltar à Página do Caso
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 max-w-4xl mx-auto min-h-[800px] text-slate-900 font-serif leading-relaxed text-xs sm:text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <FileText className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-bold text-slate-900">Resultado da Análise com IA</h2>
          <p className="text-[10px] text-slate-500">
            Avaliação automatizada que identifica oportunidades de defesa, inconsistências e argumentos recomendados com base em precedentes jurídicos.
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Fechar</span>
        </button>
      </div>
      
      <Divider className="my-5" />
      
      <div className="flex items-center justify-between">
        <div className="w-1/3">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Confiança da Análise</h3>
            <div className="flex items-center justify-center mt-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div className="ml-2">
                <p className="text-[11px] font-bold">{analysis.confidenceScore}%</p>
                <p className="text-[10px] text-slate-600">
                  Confiança na qualidade da análise e nas recomendações apresentadas
              </div>
              <div className="flex items-center justify-center mt-2">
                <div className="w-4 h-4 rounded-full bg-gray-200">
                  <div className="w-1 h-1/2 bg-gray-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-2/3">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Inconsistências Detectadas</h3>
            {analysis.inconsistencies.length > 0 ? (
              <div className="space-y-2">
                {analysis.inconsistencies.map((inconsistency, index) => (
                  <div key={index} className="p-3 border-l-4 border-orange-500 bg-orange-50/10">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{index + 1}.</p>
                        <span className="text-slate-700">{inconsistency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <Text className="text-slate-400">
                  Nenhuma inconsistência detectada nesta análise.
                </Text>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => setExpandedInconsistencies([...expandedInconsistencies])}
                className="w-full text-left text-xs text-slate-700 hover:text-slate-900 font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="ml-2">Ver todas as inconsistências ({analysis.inconsistencies.length})</span>
              </button>
            </div>
          </div>
        </div>
        
        <Divider className="my-6" />
        
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Argumentos Recomendados</h3>
              <div className="mt-3">
                {analysis.recommendedArguments.map((arg, index) => (
                  <div key={arg.id} className="p-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{arg.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {arg.summary}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Base legal: {arg.legalBase}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          
          <div className="w-2/3">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Integração com Estratégia de Defesa</h3>
              <p className="text-sm text-slate-500 mt-2">
                Os argumentos recomendados podem ser selecionados diretamente para inclusão na minuta defensiva (Etapa 2).
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="w-full text-left text-slate-700 hover:text-slate-900 font-medium py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {showRecommendations ? (
                    <Text className="text-slate-500">Ocultar argumentos</Text>
                  ) : (
                    <Text className="text-slate-700">Mostrar argumentos (3)</Text>
                  )}
                </button>
                
                {showRecommendations && (
                  <div className="mt-3 space-y-2">
                    {analysis.recommendedArguments.map((arg, index) => (
                      <div key={arg.id} className="p-3 border-l-4 border-emerald-500 bg-emerald-50/10">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{arg.title}</p>
                            <span className="text-sm text-slate-500 mt-1 block">
                              {arg.category} • {arg.confidenceScore}% probabilidade
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};