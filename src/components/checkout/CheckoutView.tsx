import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Zap,
  Lock,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Clock,
  CreditCard,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { CaseDomain } from '../../types';
import { CreditCardForm } from './CreditCardForm';

interface CheckoutViewProps {
  currentCase: CaseDomain;
  onPaymentSuccess: (updatedCase: CaseDomain) => void;
  onBackToOnboarding: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  currentCase,
  onPaymentSuccess,
  onBackToOnboarding,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pixData, setPixData] = useState<{
    qrCodeDataUrl: string;
    pixCopyPasteString: string;
    txId: string;
    amount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [creditCardResult, setCreditCardResult] = useState<{
    orderId: string;
    threeDsUrl?: string;
    threeDsChallengeRequired?: boolean;
  } | null>(null);
  const [creditCardError, setCreditCardError] = useState<string | null>(null);

  // Load PIX when payment method is PIX
  useEffect(() => {
    if (paymentMethod !== 'pix') return;
    
    async function loadPix() {
      try {
        const res = await fetch('/api/payments/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: currentCase.id,
            amount: 97.0,
            customerCpf: currentCase.clientCpf,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPixData(data);
        }
      } catch (err) {
        console.error('Error fetching PIX:', err);
      }
    }
    loadPix();
  }, [currentCase.id, currentCase.clientCpf, paymentMethod]);

  const handleCopyPix = () => {
    if (pixData?.pixCopyPasteString) {
      navigator.clipboard.writeText(pixData.pixCopyPasteString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments/pix/simulate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: currentCase.id }),
      });
      const data = await res.json();
      if (data.success) {
        onPaymentSuccess(data.case);
      }
    } catch (err) {
      console.error('Error confirming simulated payment:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreditCardSuccess = (result: { orderId: string; status: string; threeDsUrl?: string; threeDsChallengeRequired?: boolean }) => {
    setCreditCardResult(result);
    setCreditCardError(null);
    
    if (result.threeDsChallengeRequired && result.threeDsUrl) {
      // Redirect to 3DS challenge
      window.location.href = result.threeDsUrl;
    } else if (result.status === 'AUTHORIZED' || result.status === 'PAID') {
      // Simulate payment confirmation for credit card
      setIsProcessing(true);
      fetch('/api/payments/pix/simulate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: currentCase.id }),
      }).then(res => res.json()).then(data => {
        if (data.success) {
          onPaymentSuccess(data.case);
        }
      }).finally(() => setIsProcessing(false));
    }
  };

  const handleCreditCardError = (error: string) => {
    setCreditCardError(error);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <button
        onClick={onBackToOnboarding}
        className="text-xs font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1.5 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à Análise do Caso
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Summary & Guarantee */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase font-mono">
                Resumo da Defesa
              </span>
              <span className="text-[11px] font-mono text-slate-500">Auto nº {currentCase.infraction.aitNumber}</span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Liberação da Petição & Checklist de Protocolo
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Gere sua minuta jurídica formal com 52 blocos do CTB/CONTRAN, pronta para impressão e envio aos órgãos autuadores.
            </p>

            <div className="mt-4 border-t border-slate-200 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Petição Técnica Completa (52 Blocos do CTB)</span>
                <span className="font-semibold text-emerald-700 font-mono">Incluso</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Teses de Anulação Metrológica & Decadência</span>
                <span className="font-semibold text-emerald-700 font-mono">Incluso</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Guia Passo a Passo de Protocolo no Órgão</span>
                <span className="font-semibold text-emerald-700 font-mono">Incluso</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Alertas de Prazo e Linha do Tempo via WhatsApp</span>
                <span className="font-semibold text-emerald-700 font-mono">Incluso</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Exportação Ilimitada em PDF Diagramado A4</span>
                <span className="font-semibold text-emerald-700 font-mono">Incluso</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono">Investimento Único</span>
                  <p className="text-[10px] text-slate-500 font-mono">Sem mensalidade ou cobranças adicionais</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through mr-2 font-mono">R$ 297,00</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">R$ 97,00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-xs shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs font-mono uppercase">
              Comparativo de Mercado
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-500 text-[11px]">Despachante / Advogado</p>
                <p className="text-xs font-bold font-mono text-rose-600 mt-0.5">R$ 800 a R$ 1.500</p>
                <p className="text-slate-500 mt-1 text-[10px] leading-tight">Demora 5 a 10 dias para redigir e exige visitas presenciais.</p>
              </div>
              <div className="p-3 bg-orange-50/20 rounded-lg border border-orange-500">
                <p className="font-bold text-orange-600 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3" /> Adeus Multa
                </p>
                <p className="text-xs font-bold font-mono text-emerald-700 mt-0.5">R$ 97,00</p>
                <p className="text-slate-600 mt-1 text-[10px] leading-tight">Petição técnica pronta em 30 segundos com rigor do CTB.</p>
              </div>
            </div>

            {/* 7 Days Guarantee */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-slate-600 text-[11px] leading-tight">
                <span className="font-bold text-slate-900">Garantia Incondicional de 7 Dias:</span> Se você não ficar satisfeito com a fundamentação técnica, devolvemos seu dinheiro integralmente.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Method Selector + Payment Component */}
        <div className="lg:col-span-5">
          {/* Payment Method Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-2xs">
            <div className="flex gap-2" role="tablist" aria-label="Método de pagamento">
              <button
                role="tab"
                aria-selected={paymentMethod === 'pix'}
                onClick={() => { setPaymentMethod('pix'); setCreditCardResult(null); setCreditCardError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <span>PIX</span>
              </button>
              <button
                role="tab"
                aria-selected={paymentMethod === 'credit_card'}
                onClick={() => { setPaymentMethod('credit_card'); setCreditCardResult(null); setCreditCardError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'credit_card'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span>Cartão</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
              {paymentMethod === 'pix' 
                ? 'Pagamento instantâneo via Banco Central / PagBank' 
                : 'Parcelamento em até 12x — Tokenização segura PagBank'}
            </p>
          </div>

          {/* PIX Payment Component */}
          {paymentMethod === 'pix' && (
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm sticky top-20 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                    PIX
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Pagamento Instantâneo</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Via PagBank / Banco Central</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Total</span>
                  <p className="font-extrabold text-sm text-slate-900 font-mono">R$ 97,00</p>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="my-4 text-center">
                {pixData?.qrCodeDataUrl ? (
                  <div className="inline-block p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <img
                      src={pixData.qrCodeDataUrl}
                      alt="QR Code PIX PagBank"
                      className="w-40 h-40 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </p>
              </div>

              {/* Copy and Paste PIX */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[10px] font-bold text-slate-700 uppercase block font-mono">
                  Ou Copie o Código PIX Copia e Cola:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={pixData?.pixCopyPasteString || 'Carregando código PIX...'}
                    className="w-full text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 truncate outline-none"
                  />
                  <button
                    type="button"
                    id="copy-pix-button"
                    onClick={handleCopyPix}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'OK' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Live Simulator */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  id="simulate-pix-success-button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs shadow-orange-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-tight"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirmando PagBank...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simular Pagamento PIX Aprovado</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-mono">
                  Liberação instantânea com idempotência segura.
                </p>
              </div>
            </div>
          )}

          {/* Credit Card Payment Component */}
          {paymentMethod === 'credit_card' && (
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm sticky top-20 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                    CC
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Cartão de Crédito</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Parcelado em até 12x — Tokenização PagBank</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Total</span>
                  <p className="font-extrabold text-sm text-slate-900 font-mono">R$ 97,00</p>
                </div>
              </div>

              <CreditCardForm
                caseId={currentCase.id}
                customerName={currentCase.clientName}
                customerEmail={currentCase.clientEmail}
                customerCpf={currentCase.clientCpf}
                amount={97.0}
                onSuccess={handleCreditCardSuccess}
                onError={handleCreditCardError}
              />

              {creditCardError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-center gap-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{creditCardError}</span>
                  </div>
                </div>
              )}

              {creditCardResult && creditCardResult.threeDsChallengeRequired && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 text-xs">
                    <RotateCcw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Redirecionando para autenticação 3D Secure...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
