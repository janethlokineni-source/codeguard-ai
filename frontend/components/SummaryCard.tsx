'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  id: string;
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  isSelected: boolean;
  onClick: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  badgeBg,
  isSelected,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${badgeBg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span
          className={`text-2xl font-bold tracking-tight ${
            count > 0 ? (title === 'Security' || title === 'Errors' ? 'text-rose-400' : 'text-slate-100') : 'text-slate-500'
          }`}
        >
          {count}
        </span>
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-medium text-slate-300">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          {count === 0 ? 'No issues flagged' : `${count} item${count > 1 ? 's' : ''} found`}
        </p>
      </div>

      {isSelected && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 rounded-full" />
      )}
    </motion.button>
  );
};

