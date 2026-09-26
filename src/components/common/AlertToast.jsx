import React from 'react';
import { useGame } from '../../context/GameContext';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export default function AlertToast() {
  const { toast } = useGame();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200',
    error: 'border-rose-500/40 bg-rose-950/80 text-rose-200',
    warning: 'border-amber-500/40 bg-amber-950/80 text-amber-200',
    info: 'border-indigo-500/40 bg-indigo-950/80 text-indigo-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-subtle">
      <div className={`flex items-start space-x-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${borders[toast.type] || borders.info}`}>
        {icons[toast.type] || icons.info}
        <div className="text-sm font-medium leading-snug">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
