'use client';

import React from 'react';

interface DividerProps {
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => {
  if (!label) {
    return <hr className={`border-t border-[rgba(201,119,127,0.18)] my-4 ${className}`} />;
  }

  return (
    <div className={`relative flex items-center justify-center my-5 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[rgba(201,119,127,0.18)]" />
      </div>
      <span className="relative px-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7e6980] bg-[#1a1125]">
        {label}
      </span>
    </div>
  );
};

