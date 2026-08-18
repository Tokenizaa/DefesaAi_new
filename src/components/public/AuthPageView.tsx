import React, { useState } from 'react';
import { LoginForm } from '../../components/shared/auth/LoginForm';
import { RegisterForm } from '../../components/shared/auth/RegisterForm';
import { useRouter } from '../../core/router/RouterContext';

interface AuthPageViewProps {
  mode?: 'login' | 'register';
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({ mode }) => {
  const { navigate, queryParams } = useRouter();
  // Determine mode from URL path if not provided as prop
  const initialMode = mode || (queryParams.mode === 'register' ? 'register' : 'login');
  const redirectTarget = queryParams.redirect || '/dashboard';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Logo and Branding */}
        <div className="text-center space-y-3">
          {/* Logo/Brand Name */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-[var(--blue-warm-vivid-60)] rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">D</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                DefesAi
              </h1>
              <p className="text-sm text-gray-500">
                Proteção Jurídica Inteligente
              </p>
            </div>
          </div>
          
          {/* Tagline */}
          <p className="text-base text-gray-600 max-w-xl">
            Seu defensor digital para recursos de multas e autuações de trânsito
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex w-full border-b border-gray-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 px-4 py-3 text-center font-medium 
              ${activeTab === 'login' 
                ? 'text-[var(--blue-warm-vivid-60)] border-b-2 border-[var(--blue-warm-vivid-60)]' 
                : 'text-gray-500 hover:text-gray-700'}
              transition-colors`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 px-4 py-3 text-center font-medium
              ${activeTab === 'register'
                ? 'text-[var(--blue-warm-vivid-60)] border-b-2 border-[var(--blue-warm-vivid-60)]'
                : 'text-gray-500 hover:text-gray-700'}
              transition-colors`}
          >
            Cadastre-se
          </button>
        </div>

        {/* Form Container */}
        <div className="space-y-6">
          {activeTab === 'login' ? (
            <LoginForm 
              onSuccess={(redirectTo) => {
                navigate(redirectTarget);
              }}
            />
          ) : (
            <RegisterForm 
              onSuccess={(redirectTo) => {
                navigate(redirectTarget);
              }}
            />
          )}
        </div>

        {/* Social Proof / Trust Signals */}
        <div className="text-center text-sm text-gray-500 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-[var(--blue-warm-vivid-60)]">
            <span className="w-3 h-3 bg-[var(--blue-warm-vivid-60)] rounded-full"></span>
            <span>Já ajudamos mais de 10.000 condutores</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-[var(--blue-warm-vivid-60)]">
            <span className="w-3 h-3 bg-[var(--blue-warm-vivid-60)] rounded-full"></span>
            <span>97% de sucesso em recursos</span>
          </div>
        </div>
      </div>
    </div>
  );
};