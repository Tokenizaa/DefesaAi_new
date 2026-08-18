import React from 'react';
import { AuthForm } from './AuthForm';
import { NameInput } from './NameInput';
import { PasswordInput } from './PasswordInput';
import { PhoneInput } from './PhoneInput';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { z } from 'zod';

interface RegisterFormProps {
  // Pre-filled data from onboarding
  prefilledName?: string;
  prefilledPhone?: string;
  onSuccess?: (redirectTo: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  prefilledName, 
  prefilledPhone,
  onSuccess 
}) => {
  const { navigate, queryParams } = useRouter();
  const { signUp, isLoading } = useAuth();
  const redirectTarget = queryParams.redirect || '/dashboard';

  const handleRegister = async (formData: Record<string, any>) => {
    // Use pre-filled data if available, otherwise use form data
    const name = prefilledName || formData.name;
    const email = formData.email;
    const password = formData.password;
    const phone = prefilledPhone || formData.phone;
    
    const result = await signUp(name, email, password);
    if (result.success) {
      navigate(redirectTarget);
      onSuccess?.(redirectTarget);
    } else {
      throw new Error(result.error || 'Erro ao criar conta.');
    }
  };

  return (
    <AuthForm showBackLink={false}
      onSubmit={handleRegister}
      loading={isLoading}
      title="Cadastro de Condutor no DefesAi"
      subtitle="Cadastre-se para acompanhar o andamento dos seus recursos de trânsito."
    >
      <div className="space-y-4">
        {!prefilledName && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome Completo do Condutor *
            </label>
            <div className="relative">
              <input
                type="text"
                id="register-name"
                placeholder="Ex: Carlos Eduardo Silveira"
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
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail Principal *
          </label>
          <div className="relative">
            <input
              type="email"
              id="register-email"
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

        {!prefilledPhone && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Telefone do WhatsApp *
            </label>
            <div className="relative">
              <input
                type="tel"
                id="register-phone"
                placeholder="(xx) xxxxx-xxxx"
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
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha *
            </label>
            <div className="relative">
              <input
                type="password"
                id="register-password"
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type="password"
                id="register-confirm-password"
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
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700">
            <input
              type="checkbox"
              id="register-terms"
              required
              className="mt-0.5 rounded border-slate-300 text-[#155BCB] focus:ring-[#155BCB]"
            />
            <span>
              Concordo com os Termos de Uso e a Política de Privacidade em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.
            </span>
          </label>
        </div>
      </div>
    </AuthForm>
  );
};
