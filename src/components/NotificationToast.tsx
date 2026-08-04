import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationToastProps {
  notifications: SystemNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
      {notifications.slice(0, 3).map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex items-start justify-between gap-3 animate-slideIn"
        >
          <div className="flex items-start gap-2.5">
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {n.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}

            <div>
              <p className="text-xs font-bold text-white leading-none">{n.title}</p>
              <p className="text-[11px] text-zinc-400 mt-1">{n.message}</p>
            </div>
          </div>

          <button
            onClick={() => onDismiss(n.id)}
            className="text-zinc-500 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
