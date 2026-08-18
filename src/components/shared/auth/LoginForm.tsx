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
    alert(message); // Or we could use a toast notification
    setShowForgotPassword(false);
  };

  return (
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
                  className={`
                    w-full pl-3 pr-3 py-2 text-sm font-normal
                    bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                    focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                    transition-all text-slate-900
                  `}
                />
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
  );
};