'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  href = '/',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-sm tracking-[0.16em]',
    md: 'text-base tracking-[0.2em]',
    lg: 'text-xl tracking-[0.22em]',
    xl: 'text-3xl tracking-[0.25em]',
  };

  const taglineSizes = {
    sm: 'text-[8px] tracking-[0.22em]',
    md: 'text-[9px] tracking-[0.25em]',
    lg: 'text-[11px] tracking-[0.28em]',
    xl: 'text-[13px] tracking-[0.3em]',
  };

  const content = (
    <div className={`flex items-center gap-3 group cursor-pointer select-none ${className}`}>
      {/* 3D Iridescent Chrome Crescent & Star Emblem */}
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105 border border-[rgba(201,119,127,0.35)] shadow-[0_2px_16px_rgba(138,99,181,0.35)] bg-[#0f0816] shrink-0`}
      >
        <img
          src="/clyro-icon.png"
          alt="CLYRO Emblem"
          className="w-full h-full object-cover scale-110 drop-shadow-[0_0_8px_rgba(201,119,127,0.5)]"
        />
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-sans font-extrabold uppercase text-[#f6e7dc] ${titleSizes[size]} leading-none bg-gradient-to-r from-[#f6e7dc] via-[#e5d4e8] to-[#c9777f] bg-clip-text text-transparent drop-shadow-sm`}
        >
          CLYRO
        </span>
        {showTagline && (
          <span className={`${taglineSizes[size]} uppercase font-semibold text-[#b8a5b8] mt-1`}>
            PRIVATE CODE REVIEW
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
