'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Toast } from '@/hooks/useToast';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />,
  error: <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />,
  info: <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />,
};

const BG = {
  success: 'bg-white border-emerald-200',
  error: 'bg-white border-red-200',
  info: 'bg-white border-blue-200',
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${BG[toast.type]} animate-in slide-in-from-bottom-2`}
        >
          {ICONS[toast.type]}
          <p className="text-sm text-slate-700 flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
