'use client';

import React from 'react';
import { Shield, Sparkles, Database } from 'lucide-react';

interface StatusChipProps {
  label?: string;
  variant?: 'session' | 'ai' | 'warning' | 'clean' | 'db';
  className?: string;
  title?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label = 'PRIVATE SESSION',
  variant = 'session',
  className = '',
  title = '',
}) => {
  if (variant === 'db') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md border ${className}`}
        style={{
          background: 'rgba(20, 12, 28, 0.88)',
          borderColor: 'rgba(134, 239, 172, 0.4)',
          color: '#86efac',
        }}
        title={title || 'PostgreSQL Database Integration Layer Active & Connected'}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: '#86efac',
            boxShadow: '0 0 8px #86efac',
          }}
        />
        <Database className="w-3 h-3 text-[#86efac]" />
        <span>{label}</span>
      </div>
    );
  }

  if (variant === 'ai') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md border ${className}`}
        style={{
          background: 'rgba(26, 17, 37, 0.75)',
          borderColor: 'rgba(201, 119, 127, 0.25)',
          color: '#f0c98a',
        }}
        title={title}
      >
        <Sparkles className="w-3 h-3 text-[#f0c98a]" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase backdrop-blur-md border ${className}`}
      style={{
        background: 'rgba(26, 17, 37, 0.75)',
        borderColor: 'rgba(201, 119, 127, 0.25)',
        color: '#f6e7dc',
      }}
      title={title}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: '#f0c98a',
          boxShadow: '0 0 8px #f0c98a',
        }}
      />
      <span>{label}</span>
    </div>
  );
};
