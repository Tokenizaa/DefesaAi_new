import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ShieldAlert, User, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../../core/router/RouterContext';
import { useAuth } from '../../core/auth/AuthContext';

export const LoginPageView: React.FC = () => {
  const { navigate, queryParams } = useRouter();
  const { login, loginAsDemoUser, loginAsDemoAdmin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const redirectTarget = queryParams.redirect || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe suas credenciais de acesso.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciais inválidas.');
    } else {
      navigate(redirectTarget);
    }
  };

  const handleGovBrDirectLogin = async () => {
    await loginAsDemoUser();
    navigate(redirectTarget);
  };

  const handleDemoAdmin = async () => {
    await loginAsDemoAdmin();
    navigate('/admin');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white border border-[#CCCCCC] rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Header Oficial GOV.BR */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center font-extrabold text-3xl tracking-tighter text-[#071D41] font-sans">
            <span>gov</span>
            <span className="text-[#155BCB]">.</span>
            <span className="text-[#168821]">br</span>
          </div>
          <h1 className="text-lg font-bold text-[#071D41] tracking-tight">
            Identificação do Cidadão no DefesAi
          </h1>
          <p className="text-xs text-slate-600">
            Acesse seus diagnósticos de autuação, defesas protocoladas e prazos.
          </p>
        </div>

        {/* Botão Oficial SSO "Entrar com GOV.BR" */}
        <div className="space-y-3">
          <button
            type="button"
            id="btn-login-sso-govbr"
            onClick={handleGovBrDirectLogin}
            disabled={isLoading}
            className="w-full py-3 bg-[#071D41] hover:bg-[#0C326F] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-[#0C326F]"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#071D41] font-extrabold text-[11px]">
              g
            </div>
            <span>Entrar com gov.br</span>
          </button>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-[#071D41] space-y-1">
            <span className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#168821]" />
              Níveis de Conta Aceitos:
            </span>
            <p className="text-slate-600">
              Bronze (básico), Prata (bancos credenciados / CNH) e Ouro (biometria / certificado ICP-Brasil).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
            Ou acesse com e-mail cadastrado
          </span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              E-mail do Condutor
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="text-[11px] font-semibold text-[#155BCB] hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#155BCB] hover:bg-[#0C326F] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <span>Acessar Painel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Access */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-[11px]">
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold text-center">
            Acesso Rápido de Homologação
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGovBrDirectLogin}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#071D41] rounded-lg font-semibold cursor-pointer text-center"
            >
              👤 Condutor Demo
            </button>
            <button
              onClick={handleDemoAdmin}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#071D41] rounded-lg font-semibold cursor-pointer text-center"
            >
              🏛️ Gestor Público
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Novo condutor?{' '}
          <button
            onClick={() => navigate('/novo-caso')}
            className="font-bold text-[#155BCB] hover:underline cursor-pointer"
          >
            Fazer análise preliminar gratuita
          </button>
        </div>
      </div>
    </div>
  );
};
