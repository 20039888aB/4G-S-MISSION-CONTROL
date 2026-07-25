import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { SplashScreen } from '@/components/brand/SplashScreen';
import { Button, Card, CardTitle, ToastContainer } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { AppRoutes } from '@/routes';
import {
  startLocalReminderScheduler,
  stopLocalReminderScheduler,
} from '@/services/notifications/local';
import { maybeNotifyWeeklyReview } from '@/services/rewards/weekly';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function App() {
  useTheme();
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const wakeTime = useSettingsStore((s) => s.wakeTime);
  const sleepTarget = useSettingsStore((s) => s.sleepTarget);
  const [splashGone, setSplashGone] = useState(false);
  const [bootStuck, setBootStuck] = useState(false);

  useEffect(() => {
    void initialize().catch(() => {
      // Auth store still marks initialized; splash can dismiss.
    });
    // Clear one-shot lazy-chunk retry flag after a successful boot.
    sessionStorage.removeItem('g4-chunk-retry');
  }, [initialize]);

  // Failsafe: never leave users on a forever-black splash.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        setBootStuck(true);
      }
    }, 8000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      stopLocalReminderScheduler();
      return;
    }
    void maybeNotifyWeeklyReview();
    void startLocalReminderScheduler();
    return () => stopLocalReminderScheduler();
  }, [isAuthenticated, notificationsEnabled, wakeTime, sleepTarget]);

  const appReady = isInitialized && splashGone;

  if (bootStuck && !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
        <Card glass className="max-w-md space-y-3">
          <CardTitle>App is taking too long to open</CardTitle>
          <p className="text-sm text-text-muted">
            This is usually a phone cache / database version glitch after an update. Your data is
            still on this device.
          </p>
          <Button
            onClick={() => {
              void (async () => {
                try {
                  const regs = await navigator.serviceWorker?.getRegistrations();
                  await Promise.all((regs ?? []).map((r) => r.unregister()));
                  const keys = await caches?.keys();
                  await Promise.all((keys ?? []).map((k) => caches.delete(k)));
                } catch {
                  /* ignore */
                }
                window.location.reload();
              })();
            }}
          >
            Reload app files (keep data)
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      {!splashGone ? (
        <SplashScreen
          minDurationMs={1400}
          readyToDismiss={isInitialized}
          onFinish={() => setSplashGone(true)}
        />
      ) : null}

      {isInitialized ? (
        <div className={appReady ? 'contents' : 'invisible pointer-events-none absolute inset-0'}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
          <ToastContainer />
        </div>
      ) : null}
    </>
  );
}
