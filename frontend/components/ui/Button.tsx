'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-2xl gap-2',
    lg: 'px-6 py-3 text-sm font-semibold rounded-2xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'clyro-btn-primary cursor-pointer',
    secondary:
      'bg-[rgba(35,23,48,0.7)] hover:bg-[rgba(50,32,68,0.85)] text-[#f6e7dc] border border-[rgba(201,119,127,0.25)] hover:border-[rgba(201,119,127,0.45)] backdrop-blur-md cursor-pointer transition-all duration-200',
    ghost:
      'bg-transparent hover:bg-[rgba(201,119,127,0.1)] text-[#b8a5b8] hover:text-[#f6e7dc] border border-transparent cursor-pointer transition-colors',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

