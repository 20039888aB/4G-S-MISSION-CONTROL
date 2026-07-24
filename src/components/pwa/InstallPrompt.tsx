import { Download, Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useUiStore } from '@/stores/uiStore';

export function InstallPrompt() {
  const {
    installed,
    showGuide,
    canNativeInstall,
    platform,
    promptInstall,
    dismiss,
    offlineReady,
  } = usePwaInstall();
  const addToast = useUiStore((s) => s.addToast);

  if (installed || !showGuide) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed inset-x-3 bottom-[5.5rem] z-40 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[22rem]"
      >
        <Card glass className="relative border-accent/30 p-4 shadow-xl">
          <button
            type="button"
            className="absolute top-2 right-2 rounded-md p-1.5 text-text-muted hover:bg-surface"
            onClick={dismiss}
            aria-label="Dismiss install tip"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Smartphone className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold">Install on your phone</p>
              <p className="mt-1 text-sm text-text-muted">
                Add G4 Mission Control to your home screen. It works offline — your data stays on
                this device.
                {offlineReady ? ' Offline ready ✓' : ''}
              </p>

              {platform === 'ios' ? (
                <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-text-muted">
                  <li>Tap the Share button in Safari</li>
                  <li>Choose “Add to Home Screen”</li>
                  <li>Tap Add — open it like a real app</li>
                </ol>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {canNativeInstall ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await promptInstall();
                      if (ok) addToast('success', 'App installed — find it on your home screen');
                    }}
                  >
                    <Download className="size-3.5" />
                    Install app
                  </Button>
                ) : platform === 'android' ? (
                  <p className="text-xs text-text-muted">
                    In Chrome: menu ⋮ → <strong>Install app</strong> or{' '}
                    <strong>Add to Home screen</strong>
                  </p>
                ) : null}
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
