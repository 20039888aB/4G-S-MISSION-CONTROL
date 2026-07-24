import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  useUiStore,
  type ToastItem,
  type ToastType,
} from '@/stores/uiStore';

const iconMap: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const toneMap: Record<ToastType, string> = {
  info: 'border-god/30 bg-bg-elevated text-text',
  success: 'border-success/30 bg-bg-elevated text-text',
  warning: 'border-warning/30 bg-bg-elevated text-text',
  danger: 'border-danger/30 bg-bg-elevated text-text',
};

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  durationMs?: number;
}

export function Toast({ toast, onDismiss, durationMs = 4200 }: ToastProps) {
  const Icon = iconMap[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss, durationMs]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border p-3 shadow-[var(--shadow-soft)]',
        toneMap[toast.type],
      )}
      role="status"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="rounded p-1 text-text-muted hover:bg-surface hover:text-text"
        onClick={() => onDismiss(toast.id)}
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
