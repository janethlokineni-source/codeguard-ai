'use client';

import React from 'react';
import { SeverityLevel } from '@/types/scanner';

interface BadgeProps {
  severity?: SeverityLevel | 'Safe' | 'Default';
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  Critical: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/35',
  },
  High: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/35',
  },
  Medium: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/35',
  },
  Low: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/35',
  },
  Safe: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/35',
  },
  Default: {
    bg: 'bg-[rgba(35,23,48,0.7)]',
    text: 'text-[#b8a5b8]',
    border: 'border-[rgba(201,119,127,0.22)]',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  severity = 'Default',
  children,
  className = '',
}) => {
  const style = badgeStyles[severity] || badgeStyles.Default;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {children}
    </span>
  );
};

