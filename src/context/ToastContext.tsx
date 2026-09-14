import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface IToast {
  id: string;
  message: string;
  type: ToastType;
}

interface IToastContext {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-2xl backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-[#161B22]/95 border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-[#1D161A]/95 border-rose-500/40 text-rose-300'
                : 'bg-[#161820]/95 border-sky-500/40 text-sky-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span className="font-medium text-white text-[12px]">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white p-1 rounded transition ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): IToastContext {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
