import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#161820] border border-neutral-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isDanger ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close confirmation modal"
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                : 'bg-amber-500 hover:bg-amber-400 text-black font-bold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

