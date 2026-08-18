import React, { useState } from 'react';
import { z } from 'zod';

interface PasswordInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showToggle?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value = '',
  onChange,
  label = 'Senha',
  placeholder = '••••••••',
  error,
  disabled = false,
  required = true,
  showToggle = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const validatePassword = (): boolean => {
    try {
      passwordSchema.parse(value || '');
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          id="password-input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full pl-3 pr-3 py-2 text-sm font-normal
            bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
            focus:ring-2 focus:ring-[#155BCB] focus:bg-white
            transition-all text-slate-900
            ${error || !validatePassword() && value ? 'border-red-300' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          `}
          aria-invalid={!!(error || !validatePassword() && value)}
          aria-describedby={error || !validatePassword() && value ? 'password-error' : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              text-slate-400 hover:text-slate-600
              px-1 py-1 rounded
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {isVisible ? (
              <span className="block h-[px] w-4 bg-slate-400" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.026 10.026 0 0112.19 9c1.121-1.66 2.5-2.86 4.24-3.152a10.026 10.026 0 015.536 7.52" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 13l-3.5-3.5" />
              </svg>
            )}
          </button>
        )}
        {error || (!validatePassword() && value) && (
          <p id="password-error" className="text-xs text-red-600 pt-1">
            {error || 'Senha deve ter pelo menos 6 caracteres'}
          </p>
        )}
      </div>
    </div>
  );
};
