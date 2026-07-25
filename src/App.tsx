import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { SplashScreen } from '@/components/brand/SplashScreen';
import { ToastContainer } from '@/components/ui';
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

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
