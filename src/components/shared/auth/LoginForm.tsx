import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { NameInput } from './NameInput';
import { PasswordInput } from './PasswordInput';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { z } from 'zod';

interface LoginFormProps {
  onSuccess?: (redirectTo: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { navigate, queryParams } = useRouter();
  const { login, isLoading } = useAuth();
  const redirectTarget = queryParams.redirect || '/dashboard';
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => prev && prev.id === id ? null : prev);
    }, 5000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) {
      setLoginEmailError('Por favor, insira um e-mail válido');
    } else {
      setLoginEmailError(null);
    }
  };

  const handleLogin = async (formData: Record<string, any>) => {
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(redirectTarget);
      onSuccess?.(redirectTarget);
    } else {
      throw new Error(result.error || 'Credenciais inválidas.');
    }
  };

  const handleForgotPasswordSuccess = (message: string) => {
    showToast('Link de recuperação enviado! Verifique sua caixa de entrada. O link expira em 1 hora.', 'success');
    setShowForgotPassword(false);
  };

  const handleForgotPasswordError = (message: string) => {
    showToast(message || 'Ocorreu um erro ao processar sua solicitação. Verifique seu e-mail e tente novamente.', 'error');
  };

  return (
    <>
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg flex items-center space-x-3 
            ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {toast.type === 'success' ? (
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.213 2.98-1.632 2.98H4.42c-1.419 0-2.382-1.65-1.632-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 01-1 1v3a1 1 0 01-2 0V6a1 1 0 011-1h2z" clipRule="evenodd" />
              </svg>
            )}
            <div>
              <p className="font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
      <AuthForm
        showBackLink={false}
        onSubmit={handleLogin}
        loading={isLoading}
        title="Identificação do Cidadão no DefesAi"
        subtitle="Acesse seus diagnósticos de autuação, defesas protocoladas e prazos."
      >
        {showForgotPassword ? (
          <>
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-sm font-medium text-[#155BCB] hover:underline"
              >
                Voltar
              </button>
            </div>
            <ForgotPasswordForm 
              onSuccess={handleForgotPasswordSuccess}
              onError={handleForgotPasswordError}
            />
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-mail do Condutor
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="login-email"
                    placeholder="seu.email@exemplo.com"
                    required
                    onChange={handleLoginEmailChange}
                    className={`
                      w-full pl-3 pr-3 py-2 text-sm font-normal
                      bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                      focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                      transition-all text-slate-900
                      ${loginEmailError ? 'border-red-500' : ''}
                    `}
                  />
                  {loginEmailError && (
                    <div className="p-2 mb-2 text-red-500 text-sm">
                      {loginEmailError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[11px] font-semibold text-[#155BCB] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  id="login-password"
                  placeholder="••••••••"
                  required
                  className={`
                    w-full pl-3 pr-3 py-2 text-sm font-normal
                    bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                    focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                    transition-all text-slate-900
                  `}
                />
              </div>
            </div>
          </>
        )}
      </AuthForm>
    </>
  );
};