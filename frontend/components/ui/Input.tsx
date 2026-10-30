'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  showPasswordToggle = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium tracking-wide text-[#b8a5b8]">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type={inputType}
          className={`w-full bg-[#0f0816] text-[#f6e7dc] placeholder-[rgba(246,231,220,0.35)] text-sm px-4 py-2.5 rounded-xl border border-[rgba(201,119,127,0.22)] focus:outline-none focus:border-[#c9777f] focus:ring-1 focus:ring-[#c9777f]/40 transition-colors ${
            showPasswordToggle ? 'pr-11' : ''
          } ${className}`}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[#b8a5b8] hover:text-[#f6e7dc] transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <span className="text-[11px] text-rose-400 mt-0.5">{error}</span>}
    </div>
  );
};

