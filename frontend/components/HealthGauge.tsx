'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HealthGaugeProps {
  score: number;
  size?: number;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ score, size = 160 }) => {
  const isCompact = size < 80;
  const strokeWidth = isCompact ? 5 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'; // Green
    if (s >= 55) return '#f59e0b'; // Amber
    return '#f43f5e'; // Red
  };

  const getLabel = (s: number) => {
    if (s >= 85) return 'Healthy Project';
    if (s >= 65) return 'Moderate Risks';
    return 'Action Required';
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#232f48"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`font-extrabold tracking-tight ${isCompact ? 'text-xs' : 'text-3xl'}`}
            style={{ color }}
          >
            {score}
          </motion.span>
          {!isCompact && (
            <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400 mt-0.5">
              / 100
            </span>
          )}
        </div>
      </div>

      {!isCompact && (
        <span className="mt-2 text-xs font-semibold tracking-wide" style={{ color }}>
          {getLabel(score)}
        </span>
      )}
    </div>
  );
};
