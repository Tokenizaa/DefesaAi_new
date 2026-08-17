import React, { useState } from 'react';
import { Shield, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../../core/router/RouterContext';
import { useAuth } from '../../core/auth/AuthContext';

export const RegisterPageView: React.FC = () => {
  const { navigate, queryParams } = useRouter();
  const { signUp, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectTarget = queryParams.redirect || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Você deve concordar com os Termos de Uso e Política de Privacidade (LGPD).');
      return;
    }

    const res = await signUp(name, email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao criar conta.');
    } else {
      navigate(redirectTarget);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white border border-[#CCCCCC] rounded-xl shadow-xs p-6 sm:p-8 space-y-6">
        {/* Header GOV.BR */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center font-extrabold text-3xl tracking-tighter text-[#071D41] font-sans">
            <span>gov</span>
            <span className="text-[#155BCB]">.</span>
            <span className="text-[#168821]">br</span>
          </div>
          <h1 className="text-lg font-bold text-[#071D41] tracking-tight">
            Cadastro de Condutor no DefesAi
          </h1>
          <p className="text-xs text-slate-600">
            Cadastre-se para acompanhar o andamento dos seus recursos de trânsito.
          </p>
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
              Nome Completo do Condutor *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-name-input"
                type="text"
                required
                placeholder="Ex: Carlos Eduardo Silveira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              E-mail Principal *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-email-input"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="register-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="register-confirm-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#155BCB] focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#155BCB] focus:ring-[#155BCB]"
              />
              <span>
                Concordo com os Termos de Uso e a Política de Privacidade em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            id="register-submit-button"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#155BCB] hover:bg-[#0C326F] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <span>Concluir Cadastro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Já possui cadastro?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-[#155BCB] hover:underline cursor-pointer"
          >
            Acessar com gov.br
          </button>
        </div>
      </div>
    </div>
  );
};
