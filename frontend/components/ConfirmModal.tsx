'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Leave this scan?',
  message = 'Unsaved changes will be lost.',
  confirmLabel = 'Leave',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120b1a]/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-[24px] border border-[rgba(201,119,127,0.3)] bg-[#1d132b]/95 p-6 shadow-2xl text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-[rgba(201,119,127,0.18)] text-[#f0c98a] border border-[rgba(201,119,127,0.3)]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-serif-heading text-base font-bold text-[#f6e7dc]">{title}</h3>
            </div>

            <p className="text-xs text-[#b8a5b8] mb-6 leading-relaxed font-sans">{message}</p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#b8a5b8] hover:text-[#f6e7dc] bg-[#0f0816] hover:bg-[#190f24] border border-[rgba(201,119,127,0.22)] transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="clyro-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
