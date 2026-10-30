'use client';

import React from 'react';

interface PageBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`clyro-dusk-bg min-h-screen relative flex flex-col ${className}`}>
      {/* CSS Starfield */}
      <div className="clyro-stars" aria-hidden="true" />

      {/* Horizon glow at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 h-96 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(201, 119, 127, 0.12) 0%, rgba(138, 99, 181, 0.08) 45%, transparent 80%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
};
