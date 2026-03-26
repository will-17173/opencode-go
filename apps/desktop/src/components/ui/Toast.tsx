import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warn';
}

type Listener = (msg: ToastMsg) => void;
let _listener: Listener | null = null;
let _id = 0;

export function toast(message: string, type: 'success' | 'error' | 'warn' = 'error') {
  _listener?.({ id: ++_id, message, type });
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    _listener = (msg) => {
      setToasts((prev) => [...prev.slice(-2), msg]); // 最多同时显示 3 条
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };
    return () => {
      _listener = null;
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm pointer-events-auto animate-in slide-in-from-top-2',
            t.type === 'success'
              ? 'bg-green-600 text-white'
              : t.type === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-amber-500 text-white',
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="break-words">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
