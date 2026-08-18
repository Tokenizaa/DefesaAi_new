import React from 'react';

interface AccountExistsPromptProps {
  email: string;
  onLogin: () => void;
  onContinue: () => void;
}

export const AccountExistsPrompt: React.FC<AccountExistsPromptProps> = ({ 
  email, 
  onLogin, 
  onContinue 
}) => {
  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center flex-col space-y-4">
        <div className="flex items-center space-x-3">
          {/* Using inline SVG for info icon */}
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 002 0zm-1 9a1 1 0 000-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          <span className="text-base font-semibold text-slate-900">
            Esta conta já existe
          </span>
        </div>
        
        <p className="text-center text-slate-600">
          Já existe uma conta com o e-mail <strong className="font-mono">{email}</strong>. 
          Deseja fazer login em vez de criar uma nova conta?
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onLogin}
            className={`
              w-full flex-1 px-4 py-2 bg-white border border-[#155BCB] rounded-lg
              text-sm font-medium text-[#155BCB] hover:bg-[#155BCB]/10
              transition-colors
            `}
          >
            Fazer Login
          </button>
          
          <button
            onClick={onContinue}
            className={`
              w-full flex-1 px-4 py-2 bg-[#155BCB] text-white rounded-lg
              text-sm font-medium hover:bg-[#0C326F]
              transition-colors
            `}
          >
            Continuar com Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};
