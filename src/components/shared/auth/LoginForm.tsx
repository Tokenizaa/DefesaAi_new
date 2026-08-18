import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { NameInput } from './NameInput';
import { PasswordInput } from './PasswordInput';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { z } from 'zod';
import { toast } from 'sonner';
import { getSuccessMessageVariant, trackABTestEvent } from '@/lib/abTesting';

interface LoginFormProps {
  onSuccess?: (redirectTo: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { navigate, queryParams } = useRouter();
  const { login, isLoading } = useAuth();
  const redirectTarget = queryParams.redirect || '/dashboard';
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);

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
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(redirectTarget);
        onSuccess?.(redirectTarget);
        
        // A/B Testing for login success message
        const baseMessage = 'Login realizado com sucesso!';
        const variantMessage = getSuccessMessageVariant(baseMessage);
        toast.success(variantMessage, {
          description: 'Bem-vindo de volta ao DefesAi',
        });
        
        // Track the login success event for A/B testing
        const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
        trackABTestEvent(variant, 'login_success', {
          email: formData.email,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(result.error || 'Credenciais inválidas.');
      }
    } catch (error) {
      toast.error('Erro no login', {
        description: error.message || 'Ocorreu um erro inesperado.',
      });
      
      // Track login failure
      const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
      trackABTestEvent(variant, 'login_failure', {
        email: formData.email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleForgotPasswordSuccess = (message: string) => {
    // A/B Testing for forgot password success message
    const variantMessage = getSuccessMessageVariant(message);
    toast.success(variantMessage, {
      description: 'Verifique sua caixa de entrada. O link expira em 1 hora.',
    });
    setShowForgotPassword(false);
    
    // Track the forgot password success event for A/B testing
    const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
    trackABTestEvent(variant, 'forgot_password_success', {
      // We don't have the email here, but in a real implementation we would
      timestamp: new Date().toISOString()
    });
  };

  const handleForgotPasswordError = (message: string) => {
    toast.error('Erro ao enviar link', {
      description: message || 'Ocorreu um erro ao processar sua solicitação.',
    });
    
    // Track the forgot password failure event for A/B testing
    const variant = localStorage.getItem('defesai_ab_test_variant') as 'A' | 'B' || 'A';
    trackABTestEvent(variant, 'forgot_password_failure', {
      // We don't have the email here, but in a real implementation we would
      timestamp: new Date().toISOString()
    });
  };

return (
     <>
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
           
           <div className="pt-4">
             <button type="submit" className={
               `w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
                bg-[#155BCB] text-white rounded-lg hover:bg-[#155BCB]/90
                transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${isLoading ? 'opacity-70' : ''}`
             }>
               {isLoading ? 'Entrando...' : 'Entrar'}
             </button>
           </div>
         </>
       )}
     </>
   );
};