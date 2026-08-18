import React, { useState } from 'react';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { getSuccessMessageVariant, trackABTestEvent } from '@/lib/abTesting';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// List of common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'throwawaymail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.address',
  'yopmail.com',
  'mail.tm',
  'dispostable.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'temp-mail.org',
  'fakeinbox.com',
  'throwam.net',
  'spam4.me',
  'binkmail.com',
  'mailnesia.com',
  'zoomitt.com',
]);

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess, onError }) => {
  const { navigate } = useRouter();
  const { resetPassword, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3); // 3 attempts before cooldown

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Por favor, insira um e-mail válido');
      return false;
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      setEmailError('Este domínio de e-mail não é permitido. Por favor, use um e-mail pessoal ou corporativo.');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (submitCooldown) return;

    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Create FormData from form elements
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Validate email before proceeding
    if (!validateEmail(data.email)) {
      return;
    }

    // Set cooldown to prevent rapid submissions
    setSubmitCooldown(true);
    setAttemptsLeft(prev => Math.max(0, prev - 1));
    
    // If no attempts left, set longer cooldown
    if (attemptsLeft <= 1) {
      setTimeout(() => {
        setSubmitCooldown(false);
        setAttemptsLeft(3); // Reset attempts after cooldown period
      }, 30000); // 30 second cooldown when out of attempts
    } else {
      setTimeout(() => setSubmitCooldown(false), 2000); // 2 second cooldown
    }

    try {
      const result = await resetPassword(data.email);
      if (result.success) {
        // Get time-based message
        const hour = new Date().getHours();
        let timeMessage = '';
        if (hour >= 5 && hour < 12) {
          timeMessage = 'Bom dia! ';
        } else if (hour >= 12 && hour < 18) {
          timeMessage = 'Boa tarde! ';
        } else if (hour >= 18 && hour < 22) {
          timeMessage = 'Boa noite! ';
        } else {
          timeMessage = 'Boa madrugada! ';
        }
        
        const baseMessage = `${timeMessage}Link de recuperação enviado! Verifique sua caixa de entrada. O link expira em 1 hora.`;
        const variantMessage = getSuccessMessageVariant(baseMessage);
        setFormSuccess(variantMessage);
        onSuccess?.(variantMessage);
        toast.success('Link enviado!', {
          description: 'Verifique sua caixa de entrada. O link expira em 1 hora.',
        });
        
        // Track the forgot password success event for A/B testing
        const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
        trackABTestEvent(variant, 'forgot_password_success', {
          email: data.email,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMessage = result.error || 'Ocorreu um erro inesperado.';
        setFormError(errorMessage);
        onError?.(errorMessage);
        toast.error('Erro ao enviar link', {
          description: errorMessage,
        });
        
        // Track the forgot password failure event for A/B testing
        const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
        trackABTestEvent(variant, 'forgot_password_failure', {
          email: data.email,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      setFormError(errorMessage);
      onError?.(errorMessage);
      toast.error('Erro ao enviar link', {
        description: errorMessage,
      });
      
      // Track the forgot password failure event for A/B testing
      const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
      trackABTestEvent(variant, 'forgot_password_failure', {
        email: data.email,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
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
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.213 2.98-1.632 2.98H4.42c-1.419 0-2.382-1.65-1.632-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 11-2 0V6a1 1 0 011-1h2z" clipRule="evenodd" />
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
      
      {emailError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
          <span className="flex-shrink-0">
            {/* Using inline SVG for alert icon */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.213 2.98-1.632 2.98H4.42c-1.419 0-2.382-1.65-1.632-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 01-1 1v3a1 1 0 01-2 0V6a1 1 0 011-1h2z" clipRule="evenodd" />
            </svg>
          </span>
          <span>{emailError}</span>
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
              onChange={handleEmailChange}
              className={`
                w-full pl-3 pr-3 py-2 text-sm font-normal
                bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                transition-all text-slate-900
                ${emailError ? 'border-red-500' : ''}
              `}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {attemptsLeft > 0 ? 
            `Tentativas restantes: ${attemptsLeft}` : 
            `Aguardando ${attemptsLeft === 0 ? '30 segundos' : '2 segundos'} para nova tentativa`}
        </div>
        <button
          type="submit"
          disabled={submitCooldown || isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#155BCB] hover:bg-[#0C326F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#155BCB]
            ${submitCooldown || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {submitCooldown ? 'Aguarde...' : isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </div>
      
      <div className="text-xs text-gray-400 text-center">
        * Para proteger nosso sistema, limitamos tentativas de recuperação de senha.
        <br/>
        * Domínios de e-mail descartáveis não são permitidos.
      </div>
    </form>
  );
};