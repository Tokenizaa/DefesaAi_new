import React, { useState } from 'react';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';

interface ForgotPasswordFormProps {
  onSuccess?: (message: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const { navigate } = useRouter();
  const { resetPassword, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Create FormData from form elements
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      const result = await resetPassword(data.email);
      if (result.success) {
        setFormSuccess(result.message || 'Email de recuperação enviado!');
        onSuccess?.(result.message);
      } else {
        setFormError(result.error || 'Ocorreu um erro inesperado.');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Recuperação de Senha
        </h1>
        <p className="text-sm text-slate-600">
          Informe seu e-mail para receber instruções de redefinição de senha.
        </p>
      </div>
      
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <span className="flex-shrink-0">
            {/* Using inline SVG for alert icon */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.213 2.98-1.632 2.98H4.42c-1.419 0-2.382-1.65-1.632-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 01-1 1v3a1 1 0 01-2 0V6a1 1 0 011-1h2z" clipRule="evenodd" />
            </svg>
          </span>
          <span>{formError}</span>
        </div>
      )}
      
      {formSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <span className="flex-shrink-0">
            {/* Using inline SVG for check icon */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
          <span>{formSuccess}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#155BCB]"></div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail Principal
          </label>
          <div className="relative">
            <input
              type="email"
              id="forgot-email"
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
    </form>
  );
};