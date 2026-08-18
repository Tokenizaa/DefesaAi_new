import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { AccountExistsPrompt } from './AccountExistsPrompt';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Initial form type: 'login' | 'register' | 'forgot-password' | 'reset-password'
  defaultView?: 'login' | 'register' | 'forgot-password' | 'reset-password';
  // For reset password, we need the token
  resetToken?: string;
  // For account exists prompt
  existingEmail?: string;
  onLogin?: (email: string, password: string) => void;
  onRegister?: (name: string, email: string, phone: string, password: string) => void;
  onForgotPasswordSubmit?: (email: string) => Promise<{ success: boolean; message: string }>;
  onResetPasswordSubmit?: (token: string, password: string) => Promise<{ success: boolean }>;
  onAccountExistsLogin?: (email: string) => void;
  onAccountExistsContinue?: (name: string, email: string, phone: string, password: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  defaultView = 'login',
  resetToken,
  existingEmail,
  onLogin,
  onRegister,
  onForgotPasswordSubmit,
  onResetPasswordSubmit,
  onAccountExistsLogin,
  onAccountExistsContinue
}) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'account-exists'>(defaultView || 'login');

  const handleLogin = async (formData: Record<string, any>) => {
    if (onLogin) {
      try {
        await onLogin(formData.email, formData.password);
        onClose();
      } catch (error) {
        // Error will be handled by the LoginForm component
        throw error;
      }
    }
  };

  const handleRegister = async (formData: Record<string, any>) => {
    if (onRegister) {
      try {
        await onRegister(
          formData.name, 
          formData.email, 
          formData.phone || '', 
          formData.password
        );
        onClose();
      } catch (error) {
        // Error will be handled by the RegisterForm component
        throw error;
      }
    }
  };

  const handleForgotPassword = async (formData: Record<string, any>) => {
    if (onForgotPasswordSubmit) {
      try {
        const result = await onForgotPasswordSubmit(formData.email);
        if (!result.success) {
          throw new Error(result.message || 'Erro ao processar solicitação');
        }
        // Show success message - in a real implementation, we might change the view
        alert(result.message); // Temporary
        onClose();
      } catch (error) {
        throw error;
      }
    }
  };

  const handleResetPassword = async (formData: Record<string, any>) => {
    if (onResetPasswordSubmit && resetToken) {
      try {
        const result = await onResetPasswordSubmit(resetToken, formData.password);
        if (!result.success) {
          throw new Error('Erro ao redefinir senha');
        }
        onClose();
      } catch (error) {
        throw error;
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-white border border-[#CCCCCC] rounded-xl shadow-xl p-6 sm:p-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {view === 'login' && 'Acesso à Conta'}
              {view === 'register' && 'Criar Conta'}
              {view === 'forgot-password' && 'Recuperar Senha'}
              {view === 'reset-password' && 'Redefinir Senha'}
              {view === 'account-exists' && 'Conta Existente'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg hover:bg-[#F0F0F0] p-1.5"
              aria-label="Fechar"
            >
              {/* Using inline SVG for close icon */}
              <svg className="h-4 w-4 text-slate-500 hover:text-slate-900" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {view === 'login' && (
            <LoginForm 
              onSuccess={(redirectTo) => {
                onClose();
                // In a real app, we'd navigate here
              }}
            />
          )}
          
          {view === 'register' && (
            <RegisterForm 
              onSuccess={(redirectTo) => {
                onClose();
                // In a real app, we'd navigate here
              }}
            />
          )}
          
          {view === 'forgot-password' && (
            <ForgotPasswordForm 
              onSuccess={(message) => {
                alert(message); // Temporary
                onClose();
              }}
            />
          )}
          
          {view === 'reset-password' && (
            <ResetPasswordForm 
              token={resetToken || ''}
              onSuccess={onClose}
            />
          )}
          
          {view === 'account-exists' && (
            <AccountExistsPrompt 
              email={existingEmail || ''}
              onLogin={onAccountExistsLogin}
              onContinue={onAccountExistsContinue}
            />
          )}
        </div>
      </div>
    </div>
  );
};
