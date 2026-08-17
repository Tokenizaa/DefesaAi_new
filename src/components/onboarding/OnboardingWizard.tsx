import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  FileCheck2,
  Scale
} from 'lucide-react';
import {
  ProcedureType,
  InfractionData,
  VehicleData,
  CaseAnalysis,
  CaseDomain,
  CaseDocumentData
} from '../../types';
import { useRouter } from '../../core/router/RouterContext';
import { useAuth } from '../../core/auth/AuthContext';
import {
  UserSituation,
  UserProcessStage,
  InfractionCategory,
  USER_SITUATIONS,
  USER_PROCESS_STAGES,
  RULES_MATRIX
} from '../../core/onboarding/rules-matrix';

import { ServiceStep } from './steps/ServiceStep';
import { DefenseStageStep } from './steps/DefenseStageStep';
import { InfractionIdentificationStep } from './steps/InfractionIdentificationStep';
import { SpecificInfractionDataStep } from './steps/SpecificInfractionDataStep';
import { AnalysisProcessingStep } from './steps/AnalysisProcessingStep';
import { FreeAnalysisResultStep } from './steps/FreeAnalysisResultStep';
import { RequiredDataStep } from './generation/RequiredDataStep';
import { DocumentReviewStep } from './generation/DocumentReviewStep';
import { DocumentCheckoutStep } from './generation/DocumentCheckoutStep';

interface OnboardingWizardProps {
  onCaseReadyForCheckout?: (newCase: CaseDomain) => void;
  onOpenKnowledge?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onCaseReadyForCheckout,
  onOpenKnowledge,
}) => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  // Wizard Step (1 to 6: Phase 1 Free Analysis, 7 to 9: Phase 2 Paid Document Generation)
  const [step, setStep] = useState<number>(1);

  // =========================================================================
  // FASE 1: DADOS DA ANÁLISE JURÍDICA (100% GRATUITA)
  // =========================================================================
  const [situation, setSituation] = useState<UserSituation>('multa_transito');
  const [processStage, setProcessStage] = useState<UserProcessStage>('primeira_notificacao');
  const [infractionCategory, setInfractionCategory] = useState<InfractionCategory>('excesso_velocidade');

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    plate: 'BRA2E19',
    brandModel: 'Toyota Corolla Cross XRE',
    renavam: '00123984712',
    year: '2024',
    color: 'Preto',
  });

  const [infractionData, setInfractionData] = useState<InfractionData>({
    aitNumber: '1B892014',
    infractionCode: '745-50',
    description: 'Transitar em velocidade superior à máxima permitida em até 20%',
    ctbArticle: 'Art. 218, I do CTB',
    severity: 'media',
    points: 4,
    fineAmount: 130.16,
    autuadorBody: 'DETRAN-SP — Departamento Estadual de Trânsito de São Paulo',
    dateTime: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16),
    location: 'Av. das Nações Unidas, alt. 14.401 — São Paulo/SP',
    speedLimit: 60,
    measuredSpeed: 71,
    consideredSpeed: 64,
    radarEquipmentId: 'RAD-INMETRO-7819',
    inmetroAferitionDate: '2025-04-12',
    notificationExpeditionDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    defenseDeadline: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString().split('T')[0],
    formalFlawsDetected: [
      'Aferição metrológica do radar expirada há mais de 12 meses (Res. 798 CONTRAN)',
      'Ausência de placa de velocidade R-19 regulamentar no trecho fiscalizado',
      'Elegível para conversão em advertência por escrito (Art. 267 CTB)',
    ],
  });

  const [caseAnalysis, setCaseAnalysis] = useState<CaseAnalysis>({
    id: `an_${Date.now()}`,
    caseId: `temp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    overallSuccessRate: 94,
    riskLevel: 'baixo',
    recommendedArguments: [
      {
        id: 'arg_1',
        title: 'Decadência da Notificação de Autuação (Art. 281-A CTB)',
        category: 'decadencia_notificacao',
        ctbArticle: 'Art. 281-A do CTB (Lei 14.071/2020)',
        successProbability: 96,
        description: 'Expedição da Notificação de Autuação superior ao prazo legal de 30 dias contados da data do fato.',
        legalFoundation: 'Art. 281-A do CTB (incluído pela Lei 14.071/2020) e Súmula 312 do STJ.',
      },
      {
        id: 'arg_2',
        title: 'Nulidade Metrológica do Radar (Resolução 798/2020 CONTRAN)',
        category: 'vicio_formal_ait',
        ctbArticle: 'Art. 218 do CTB c/c Res. 798 CONTRAN',
        successProbability: 92,
        description: 'Medidor de velocidade com aferição periódica anual vencida pelo INMETRO no momento do registro.',
        legalFoundation: 'Art. 4º da Resolução CONTRAN nº 798/2020 e Portaria INMETRO nº 544/2014.',
      },
      {
        id: 'arg_3',
        title: 'Direito à Conversão em Advertência por Escrito (Art. 267 CTB)',
        category: 'conversao_advertencia',
        ctbArticle: 'Art. 267 do CTB (Lei 14.071/20)',
        successProbability: 98,
        description: 'Infração de gravidade média cometida sem reincidência de mesma natureza nos últimos 12 meses.',
        legalFoundation: 'Art. 267 do CTB com redação conferida pela Lei Federal nº 14.071/2020.',
      },
    ],
    summary: 'Foram detectadas 3 teses prioritárias de anulação com 94% de probabilidade de acolhimento perante o órgão autuador.',
    rulesTriggeredCount: 3,
  });

  // =========================================================================
  // FASE 2: DADOS DE QUALIFICAÇÃO DO CONDUTOR (GERAÇÃO DA PEÇA FORMAL)
  // =========================================================================
  const [documentData, setDocumentData] = useState<CaseDocumentData>({
    applicantName: user?.name || 'Carlos Eduardo Silveira',
    applicantCpf: user?.cpf || '123.456.789-00',
    applicantRg: '12.345.678-9 SSP/SP',
    applicantCnh: '05492817492',
    cnhCategory: 'AB',
    applicantPhone: '(11) 98765-4321',
    applicantEmail: user?.email || 'carlos.silveira@email.com',
    addressStreet: 'Rua das Flores',
    addressNumber: '450',
    addressComplement: 'Apto 82',
    addressNeighborhood: 'Vila Madalena',
    addressZipCode: '05445-010',
    addressCityState: 'São Paulo/SP',
    vehicleRenavam: '00123984712',
  });

  const [savedCaseId, setSavedCaseId] = useState<string | undefined>(undefined);

  // Deriva o tipo de procedimento canônico
  const mappedProcedure: ProcedureType =
    situation === 'conversao_advertencia'
      ? 'conversao_advertencia'
      : situation === 'indicacao_condutor'
      ? 'indicacao_condutor'
      : situation === 'suspensao_cnh'
      ? 'suspensao_cnh'
      : situation === 'cassacao_cnh'
      ? 'cassacao_cnh'
      : processStage === 'recurso_jari' || processStage === 'defesa_negada'
      ? 'recurso_jari'
      : processStage === 'recurso_cetran' || processStage === 'recurso_jari_negado'
      ? 'recurso_cetran'
      : 'defesa_previa';

  const isPhase1 = step <= 6;
  const isPhase2 = step >= 7;

  // Handlers
  const handleSituationSelect = (selected: UserSituation) => {
    setSituation(selected);
    const sitDef = USER_SITUATIONS.find((s) => s.id === selected);

    if (sitDef?.defaultInfractionCategory) {
      setInfractionCategory(sitDef.defaultInfractionCategory);
    }

    // Se o serviço já define a fase de forma unívoca, pula para a identificação direta
    if (sitDef?.inferredStage) {
      setProcessStage(sitDef.inferredStage);
      setStep(3); // Direto para identificação da autuação
    } else {
      setStep(2); // Pergunta a fase
    }
  };

  const handleStageSelect = (selected: UserProcessStage) => {
    setProcessStage(selected);
    setStep(3); // Passo de identificação técnica
  };

  const handleRunAnalysis = async () => {
    setStep(5); // Processando análise
  };

  const handleAnalysisCompleted = async () => {
    try {
      // Backend deterministic analysis execution
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Diagnóstico Auto ${infractionData.aitNumber || '1B892014'}`,
          serviceType: mappedProcedure,
          infraction: infractionData,
          vehicle: vehicleData,
          isAnonymous: true,
          status: 'analyzed',
          currentStage: 2,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSavedCaseId(data.id);
      }
      if (data.analysis) {
        setCaseAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error triggering case analysis:', err);
    }
    setStep(6); // Exibir resultado do diagnóstico gratuito
  };

  const handleProceedToDocumentGeneration = () => {
    setStep(7); // Início da Fase 2 (Qualificação)
  };

  const handleSaveToDashboard = () => {
    navigate('/dashboard');
  };

  const handlePaymentSuccess = (finalCase: CaseDomain) => {
    if (onCaseReadyForCheckout) {
      onCaseReadyForCheckout(finalCase);
      return;
    }
    navigate(`/cases/${finalCase.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Phase Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isPhase1 ? 'bg-[#155BCB] text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isPhase1 ? 'F1' : 'F2'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-500">
                {isPhase1 ? 'Fase 1 • Diagnóstico Preliminar' : 'Fase 2 • Petição Formal'}
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                  isPhase1
                    ? 'bg-blue-50 text-[#155BCB] border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isPhase1 ? '100% Gratuito' : 'Minuta Jurídica Oficial'}
              </span>
            </div>
            <h2 className="text-xs font-bold text-slate-900 mt-0.5">
              {step === 1 && '1. Situação que deseja resolver'}
              {step === 2 && '2. Fase do Processo'}
              {step === 3 && '3. Identificação da Autuação & Veículo'}
              {step === 4 && '4. Perguntas Específicas do Seu Caso'}
              {step === 5 && '5. Processando Análise Jurídica'}
              {step === 6 && '6. Diagnóstico Preliminar Concluído'}
              {step === 7 && '7. Qualificação do Requerente para a Peça'}
              {step === 8 && '8. Revisão da Petição Formal'}
              {step === 9 && '9. Emissão & Pagamento Seguro'}
            </h2>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step
                  ? 'w-6 bg-[#155BCB]'
                  : s < step
                  ? 'w-2.5 bg-emerald-600'
                  : 'w-2.5 bg-slate-200'
              }`}
              title={`Etapa ${s}`}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Step Router */}
      {step === 1 && (
        <ServiceStep
          selectedSituation={situation}
          onSelectSituation={handleSituationSelect}
        />
      )}

      {step === 2 && (
        <DefenseStageStep
          selectedStage={processStage}
          onSelectStage={handleStageSelect}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <InfractionIdentificationStep
          infractionData={infractionData}
          vehicleData={vehicleData}
          onUpdateInfraction={setInfractionData}
          onUpdateVehicle={setVehicleData}
          onNext={() => setStep(4)}
          onBack={() => {
            const sitDef = USER_SITUATIONS.find((s) => s.id === situation);
            if (sitDef?.inferredStage) {
              setStep(1);
            } else {
              setStep(2);
            }
          }}
        />
      )}

      {step === 4 && (
        <SpecificInfractionDataStep
          category={infractionCategory}
          infractionData={infractionData}
          onSelectCategory={setInfractionCategory}
          onUpdateInfraction={setInfractionData}
          onNext={handleRunAnalysis}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && (
        <AnalysisProcessingStep onComplete={handleAnalysisCompleted} />
      )}

      {step === 6 && (
        <FreeAnalysisResultStep
          analysis={caseAnalysis}
          infractionData={infractionData}
          vehicleData={vehicleData}
          serviceType={mappedProcedure}
          onProceedToDocumentGeneration={handleProceedToDocumentGeneration}
          onSaveToDashboard={handleSaveToDashboard}
        />
      )}

      {step === 7 && (
        <RequiredDataStep
          documentData={documentData}
          infractionData={infractionData}
          vehicleData={vehicleData}
          onUpdateDocumentData={setDocumentData}
          onNext={() => setStep(8)}
          onBack={() => setStep(6)}
        />
      )}

      {step === 8 && (
        <DocumentReviewStep
          documentData={documentData}
          infractionData={infractionData}
          vehicleData={vehicleData}
          analysis={caseAnalysis}
          serviceType={mappedProcedure}
          onEditQualification={() => setStep(7)}
          onProceedToPayment={() => setStep(9)}
          onBack={() => setStep(7)}
        />
      )}

      {step === 9 && (
        <DocumentCheckoutStep
          currentCaseId={savedCaseId}
          documentData={documentData}
          infractionData={infractionData}
          vehicleData={vehicleData}
          analysis={caseAnalysis}
          serviceType={mappedProcedure}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={() => setStep(8)}
        />
      )}
    </div>
  );
};
