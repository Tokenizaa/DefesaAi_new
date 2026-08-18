import React, { useState } from 'react';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { z } from 'zod';

interface IdentityVerificationStepProps {
  // Pre-filled data from onboarding
  prefilledName?: string;
  prefilledPhone?: string;
  prefilledEmail?: string;
  onIdentityVerified: (isAuthenticated: boolean, userData: { name: string; email: string; phone: string } | null) => void;
  onBack: () => void;
}

export const IdentityVerificationStep: React.FC<IdentityVerificationStepProps> = ({
  prefilledName,
  prefilledPhone,
  prefilledEmail,
  onIdentityVerified,
  onBack,
}) => {
  const { navigate } = useRouter();
  const { signUp, login, isLoading } = useAuth();
  
  const [step, setStep] = useState<'welcome' | 'login' | 'register' | 'account-exists'>('welcome');
  const [email, setEmail] = useState(prefilledEmail || '');
  const [phone, setPhone] = useState(prefilledPhone || '');
  const [name, setName] = useState(prefilledName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Phone normalization to E.164 (assuming Brazilian numbers for now)
  const normalizeToE164 = (phoneNumber: string): string => {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 55 and has enough digits, it's already in E.164 format without +
    if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 15) {
      return '+' + digits;
    }
    
    // If it doesn't start with 55 but looks like a Brazilian number, add 55
    if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
      return '+55' + digits;
    }
    
    // If it already has a +, return as is (basic validation)
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default: assume Brazilian and add +55
    return '+55' + digits;
  };
  
  // Validation schemas
  const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Telefone deve estar no formato E.164 (ex: +5511999999999)');
  const emailSchema = z.string().email('E-mail inválido');
  const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');
  const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

  const handleBackToWelcome = () => {
    setStep('welcome');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCheckExistingAccount = async () => {
    // In a real implementation, this would call an API to check if account exists
    // For now, we'll simulate by checking localStorage or Supabase
    // Since we don't have a direct API for this, we'll proceed to registration
    // and let the signUp function handle existing account errors
    setStep('register');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Normalize phone for storage (though login typically uses email/password)
      const normalizedPhone = phone ? normalizeToE164(phone) : '';
      
      const result = await login(email, password);
      if (result.success) {
        setSuccessMessage('Login realizado com sucesso!');
        // In a real implementation, we would associate the anonymous case here
        // using the claimToken from the case and the user_id from the login
        setTimeout(() => {
          onIdentityVerified(true, { name: '', email, phone: normalizedPhone });
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao fazer login.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }
    
    try {
      // Validate fields
      nameSchema.parse(name);
      emailSchema.parse(email);
      phoneSchema.parse(normalizeToE164(phone));
      passwordSchema.parse(password);
      
      const result = await signUp(name, email, password);
      if (result.success) {
        setSuccessMessage('Conta criada com sucesso!');
        // In a real implementation, we would associate the anonymous case here
        // using the claimToken from the case and the user_id from the signUp
        setTimeout(() => {
          onIdentityVerified(true, { name, email, phone: normalizeToE164(phone) });
        }, 1500);
      } else {
        // Check if it's an existing account error
        if (result.error && (result.error.includes('já está cadastrado') || result.error.includes('already exists'))) {
          setStep('account-exists');
          setErrorMessage(result.error);
        } else {
          setErrorMessage(result.error || 'Erro ao criar conta.');
        }
      }
    } catch (err) {
      const error = err as z.ZodError;
      if (error instanceof z.ZodError) {
        // Format Zod error messages
        const firstError = error.errors[0];
        setErrorMessage(`${firstError.path[0]}: ${firstError.message}`);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar cadastro.');
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-2xs">
      {/* Header */}
      <div className="mb-6">
        {step === 'welcome' && (
          <>
            <h2 className="text-xl font-bold text-slate-900 text-center">
              proteja sua análise gratuito
            </h2>
            <p className="mt-2 text-center text-slate-600">
              Para salvar seu caso e continuar com a geração da documentação,
              você pode fazer login ou criar uma conta gratuita.
            </p>
          </>
        )}
        
        {step === 'login' && (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              Acesso à Conta
            </h2>
            <p className="mt-2 text-slate-600">
              Faça login para acessar seu caso salvo
            </p>
          </>
        )}
        
        {step === 'register' && (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              Criar Conta Gratuita
            </h2>
            <p className="mt-2 text-slate-600">
              Use os dados coletados durante sua análise gratuita
            </p>
          </>
        )}
        
        {step === 'account-exists' && (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              Conta já existe
            </h2>
            <p className="mt-2 text-slate-600">
              Já existe uma conta com essas informações. Deseja fazer login?
            </p>
          </>
        )}
      </div>

      {/* Form Content */}
      {step === 'welcome' && (
        <div className="space-y-6 text-center">
          <p className="text-slate-600">
            Durante sua análise gratuita, coletamos algumas informações que podem
            ser usadas para criar sua conta rapidamente.
          </p>
          
          {(prefilledName || prefilledPhone || prefilledEmail) && (
            <div className="space-y-3">
              <p className="font-medium text-slate-700">Informações coletadas:</p>
              {prefilledName && (
                <p className="text-slate-600">
                  <span className="font-mono">Nome:</span> {prefilledName}
                </p>
              )}
              {prefilledPhone && (
                <p className="text-slate-600">
                  <span className="font-mono">WhatsApp:</span> {prefilledPhone}
                </p>
              )}
              {prefilledEmail && (
                <p className="text-slate-600">
                  <span className="font-mono">E-mail:</span> {prefilledEmail}
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setStep('login')}
              disabled={isLoading}
              className={`
                flex-1 px-4 py-3 bg-[#155BCB] text-white rounded-lg
                text-sm font-medium hover:bg-[#0C326F] transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Fazer Login
            </button>
            
            <button
              onClick={() => {
                // Pre-fill form with onboarding data
                setName(prefilledName || '');
                setPhone(prefilledPhone || '');
                setEmail(prefilledEmail || '');
                setStep('register');
              }}
              disabled={isLoading}
              className={`
                flex-1 px-4 py-3 bg-slate-100 border border-[#155BCB] rounded-lg
                text-sm font-medium text-[#155BCB] hover:bg-[#155BCB]/10
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Criar Conta
            </button>
          </div>
          
          <p className="mt-4 text-sm text-slate-500">
            <em>Você também pode prosseguir sem criar uma conta, mas seu caso
            não será salvo permanentemente.</em>
          </p>
          
          <button
            onClick={() => {
              // User chose to continue without account
              onIdentityVerified(false, null);
            }}
            className="mt-2 text-xs text-[#155BCB] hover:underline"
          >
            Continuar sem conta
          </button>
        </div>
      )}
      
      {step === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                id="identity-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`
                  w-full pl-3 pr-3 py-2 text-sm font-normal
                  bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                  focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                  transition-all text-slate-900
                  ${isLoading ? 'opacity-70' : ''}
                `}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Senha
              </label>
              <button
                type="button"
                className="text-[11px] font-semibold text-[#155BCB] hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                id="identity-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`
                  w-full pl-3 pr-3 py-2 text-sm font-normal
                  bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                  focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                  transition-all text-slate-900
                  ${isLoading ? 'opacity-70' : ''}
                `}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-[#155BCB] text-white rounded-lg
                       text-sm font-medium hover:bg-[#0C326F] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={handleBackToWelcome}
              className="text-xs font-medium text-slate-500 hover:underline"
            >
              Voltar
            </button>
          </div>
        </form>
      )}
      
      {step === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <input
                type="text"
                id="identity-name"
                value={name}
                onChange={(e) => setName(e.target.value.trim())}
                required
                className={`
                  w-full pl-3 pr-3 py-2 text-sm font-normal
                  bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                  focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                  transition-all text-slate-900
                  ${isLoading ? 'opacity-70' : ''}
                `}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail *
            </label>
            <div className="relative">
              <input
                type="email"
                id="identity-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`
                  w-full pl-3 pr-3 py-2 text-sm font-normal
                  bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                  focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                  transition-all text-slate-900
                  ${isLoading ? 'opacity-70' : ''}
                `}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              WhatsApp / Celular *
            </label>
            <div className="relative">
              <input
                type="tel"
                id="identity-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={`
                  w-full pl-3 pr-3 py-2 text-sm font-normal
                  bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                  focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                  transition-all text-slate-900
                  ${isLoading ? 'opacity-70' : ''}
                `}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="identity-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`
                    w-full pl-3 pr-3 py-2 text-sm font-normal
                    bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                    focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                    transition-all text-slate-900
                    ${isLoading ? 'opacity-70' : ''}
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
                  id="identity-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`
                    w-full pl-3 pr-3 py-2 text-sm font-normal
                    bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                    focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                    transition-all text-slate-900
                    ${isLoading ? 'opacity-70' : ''}
                  `}
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-[#155BCB] text-white rounded-lg
                       text-sm font-medium hover:bg-[#0C326F] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={handleBackToWelcome}
              className="text-xs font-medium text-slate-500 hover:underline"
            >
              Voltar
            </button>
          </div>
        </form>
      )}
      
      {step === 'account-exists' && (
        <div className="text-center space-y-4">
          {/* Using inline SVG for warning icon */}
          <div className="flex items-center justify-center">
            <svg className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.213 2.98-1.632 2.98H4.42c-1.419 0-2.382-1.65-1.632-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 01-1 1v3a1 1 0 01-2 0V6a1 1 0 011-1h2z" clipRule="evenodd" />
            </svg>
          </div>
          
          <p className="text-slate-600">
            Já existe uma conta com o e-mail <strong className="font-mono">{email}</strong>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setStep('login');
                setEmail(email);
              }}
              className={`
                flex-1 px-4 py-3 bg-[#155BCB] text-white rounded-lg
                text-sm font-medium hover:bg-[#0C326F] transition-colors
              `}
            >
              Fazer Login
            </button>
            
            <button
              onClick={handleBackToWelcome}
              className={`
                flex-1 px-4 py-3 bg-slate-100 border border-[#155BCB] rounded-lg
                text-sm font-medium text-[#155BCB] hover:bg-[#155BCB]/10
                transition-colors
              `}
            >
              Usar outro e-mail
            </button>
          </div>
        </div>
      )}
      
      {/* Messages */}
      {errorMessage && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          {/* Using inline SVG for error icon */}
          <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 0 8 8 0 0016 0zm1-12a1 1 0 10-2 0 2 2 0 002-2zM11 7h2v2h-2V7zm0 4h2v2h-2v-2z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          {/* Using inline SVG for success icon */}
          <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
