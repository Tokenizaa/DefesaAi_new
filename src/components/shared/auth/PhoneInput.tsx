import React, { useState } from 'react';
import { z } from 'zod';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: bool;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  label = 'Telefone do WhatsApp',
  placeholder = '(xx) xxxxx-xxxx',
  error,
  disabled = false,
}) => {
  const [phoneValue, setPhoneValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // E.164 validation schema
  const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Telefone deve estar no formato E.164 (ex: +5511999999999)');

  // Handle input change - format as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Remove all non-digits
    const digitsOnly = rawValue.replace(/\D/g, '');
    
    // Limit to max 15 digits (for E.164: + + up to 15 digits)
    const limitedDigits = digitsOnly.slice(0, 15);
    
    // Format as user types: (xx) xxxxx-xxxx for Brazilian numbers
    let formattedValue = '';
    if (limitedDigits.length > 0) {
      formattedValue += '(' + limitedDigits.slice(0, 2);
    }
    if (limitedDigits.length > 2) {
      formattedValue += ') ' + limitedDigits.slice(2, 7);
    }
    if (limitedDigits.length > 7) {
      formattedValue += '-' + limitedDigits.slice(7, 11);
    }
    if (limitedDigits.length > 11) {
      formattedValue += limitedDigits.slice(11);
    }
    
    setPhoneValue(formattedValue);
    
    // Convert to E.164 for storage (assuming Brazil +55, but could be made configurable)
    // For now, we'll assume Brazilian numbers if they start with certain patterns
    let e164Value = '';
    if (digitsOnly.length >= 2 && digitsOnly.length <= 15) {
      // If it looks like a Brazilian number (starts with area code patterns)
      if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
        // Brazilian format: XX XXXXX-XXXX or XX XXXXXX-XXXX
        e164Value = '+55' + digitsOnly;
      } else if (digitsOnly.length >= 10) {
        // International format without +
        e164Value = '+' + digitsOnly;
      } else {
        // Just use what we have, assuming it will be completed
        e164Value = digitsOnly;
      }
    }
    
    // Validate and call onChange with E.164 format
    try {
      phoneSchema.parse(e164Value || '+55' + digitsOnly); // Basic validation
      onChange(e164Value || '+55' + digitsOnly);
    } catch (validationError) {
      // Still call onChange so the value is stored, but validation will show error
      onChange(e164Value || '+55' + digitsOnly);
    }
  };

  // Validate current value
  const validatePhone = (): boolean => {
    try {
      // Convert display value back to digits for validation
      const digitsOnly = phoneValue.replace(/\D/g, '');
      const e164Value = '+55' + digitsOnly; // Assume Brazilian
      phoneSchema.parse(e164Value);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="tel"
          id="phone-input"
          placeholder={placeholder}
          value={phoneValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full pl-3 pr-3 py-2 text-sm font-normal
            bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
            focus:ring-2 focus:ring-[#155BCB] focus:bg-white
            transition-all text-slate-900
            ${isFocused ? 'ring-2 ring-[#155BCB]' : ''}
            ${error || !validatePhone() && phoneValue ? 'border-red-300' : ''}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          `}
          aria-invalid={!!(error || !validatePhone() && phoneValue)}
          aria-describedby={error || !validatePhone() && phoneValue ? 'phone-error' : undefined}
        />
        {error || (!validatePhone() && phoneValue) && (
          <p id="phone-error" className="text-xs text-red-600 pt-1">
            {error || 'Telefone inválido. Use formato: (xx) xxxxx-xxxx'}
          </p>
        )}
      </div>
    </div>
  );
};
