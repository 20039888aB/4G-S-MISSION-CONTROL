import { useEffect, useMemo, useState } from 'react';

const DISMISS_KEY = 'g4_install_dismissed_at';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [offlineReady, setOfflineReady] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(DISMISS_KEY));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    function onBip(e: BeforeInstallPromptEvent) {
      e.preventDefault();
      setDeferred(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    function onOffline() {
      setOfflineReady(true);
    }

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('g4-offline-ready', onOffline);

    setInstalled(isStandalone());

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('g4-offline-ready', onOffline);
    };
  }, []);

  const platform = useMemo(() => {
    if (isIos()) return 'ios' as const;
    if (isAndroid()) return 'android' as const;
    return 'desktop' as const;
  }, []);

  async function promptInstall(): Promise<boolean> {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      return true;
    }
    return false;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setDismissed(true);
  }

  const canNativeInstall = Boolean(deferred) && !installed;
  const showGuide = !installed && !dismissed && (canNativeInstall || platform === 'ios');

  return {
    installed,
    offlineReady,
    platform,
    canNativeInstall,
    showGuide,
    promptInstall,
    dismiss,
  };
}
