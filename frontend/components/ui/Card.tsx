'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${interactive ? 'clyro-glass-interactive' : 'clyro-glass'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

