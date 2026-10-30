'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
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
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className={`flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
      {/* Circular crescent-star icon */}
      <div
        className={`${iconSizes[size]} rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #c9777f 0%, #a26db0 55%, #8a63b5 100%)',
          boxShadow: '0 2px 14px rgba(201, 119, 127, 0.4), 0 0 10px rgba(138, 99, 181, 0.25)',
        }}
      >
        <svg
          className="w-4 h-4 text-[#f6e7dc]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crescent Moon + Star */}
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M19 3v4" strokeWidth="1.5" />
          <path d="M21 5h-4" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col">
        <span
          className={`font-serif-heading font-bold tracking-wider text-[#f6e7dc] ${titleSizes[size]} leading-none`}
        >
          CLYRO
        </span>
        {showTagline && (
          <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-[#b8a5b8] mt-0.5">
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
