import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';

type UpdateHandler = ((reloadPage?: boolean) => Promise<void>) | null;

let pendingUpdate: UpdateHandler = null;
const listeners = new Set<(ready: boolean) => void>();

/** Called from main.tsx when a new service worker is waiting. */
export function notifyAppUpdateAvailable(updateSW: UpdateHandler): void {
  pendingUpdate = updateSW;
  listeners.forEach((l) => l(true));
}

/** Optional: clear banner state after dismiss without updating. */
export function clearAppUpdateAvailable(): void {
  listeners.forEach((l) => l(false));
}

/**
 * Asks the user to apply a new app version.
 * Updates only refresh cached code/assets — IndexedDB / local data is never wiped.
 */
export function UpdatePrompt() {
  const [visible, setVisible] = useState(Boolean(pendingUpdate));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onReady = (ready: boolean) => setVisible(ready);
    listeners.add(onReady);
    const onEvent = () => setVisible(Boolean(pendingUpdate));
    window.addEventListener('g4-need-refresh', onEvent);
    return () => {
      listeners.delete(onReady);
      window.removeEventListener('g4-need-refresh', onEvent);
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="fixed inset-x-3 top-3 z-50 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[24rem]"
      >
        <Card glass className="relative border-accent/40 p-4 shadow-xl">
          <button
            type="button"
            className="absolute top-2 right-2 rounded-md p-1.5 text-text-muted hover:bg-surface"
            onClick={() => {
              setVisible(false);
              clearAppUpdateAvailable();
            }}
            aria-label="Dismiss update"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <RefreshCw className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold">Update available</p>
              <p className="mt-1 text-sm text-text-muted">
                A newer Mission Control build is ready. Your habits, health logs, and login stay on
                this device — nothing is wiped.
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success">
                <ShieldCheck className="size-3.5" />
                Local data preserved through updates
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        if (pendingUpdate) await pendingUpdate(true);
                        else window.location.reload();
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  Update now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVisible(false);
                    clearAppUpdateAvailable();
                  }}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
