import React from 'react';
import { z } from 'zod';

interface NameInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const NameInput: React.FC<NameInputProps> = ({
  value = '',
  onChange,
  label = 'Nome Completo',
  placeholder = 'Ex: Carlos Eduardo Silveira',
  error,
  disabled = false,
  required = true,
}) => {
  const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    onChange(value);
  };

  const validateName = (): boolean => {
    try {
      nameSchema.parse(value || '');
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
          type="text"
          id="name-input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full pl-3 pr-3 py-2 text-sm font-normal
            bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
            focus:ring-2 focus:ring-[#155BCB] focus:bg-white
            transition-all text-slate-900
            ${error || !validateName() && value ? 'border-red-300' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          `}
          aria-invalid={!!(error || !validateName() && value)}
          aria-describedby={error || !validateName() && value ? 'name-error' : undefined}
        />
        {error || (!validateName() && value) && (
          <p id="name-error" className="text-xs text-red-600 pt-1">
            {error || 'Nome deve ter pelo menos 2 caracteres'}
          </p>
        )}
      </div>
    </div>
  );
};
