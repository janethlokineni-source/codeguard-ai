'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HealthGaugeProps {
  score: number;
  size?: number;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ score, size = 160 }) => {
  const isCompact = size < 80;
  const strokeWidth = isCompact ? 5 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const gradId = `clyro-gauge-grad-${size}`;

  const getLabel = (s: number) => {
    if (s >= 85) return 'Protected & Healthy';
    if (s >= 60) return 'Moderate Vulnerabilities';
    return 'Action Recommended';
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9777f" />
              <stop offset="50%" stopColor="#a26db0" />
              <stop offset="100%" stopColor="#8a63b5" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(201, 119, 127, 0.15)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Gradient Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`font-serif-heading font-bold text-[#f6e7dc] ${
              isCompact ? 'text-xs' : 'text-3xl'
            }`}
          >
            {score}
          </motion.span>
          {!isCompact && (
            <span className="text-[10px] uppercase font-semibold tracking-widest text-[#b8a5b8] mt-0.5">
              / 100
            </span>
          )}
        </div>
      </div>

      {!isCompact && (
        <span className="mt-2 text-xs font-serif-heading text-[#f6e7dc] tracking-wide">
          {getLabel(score)}
        </span>
      )}
    </div>
  );
};
