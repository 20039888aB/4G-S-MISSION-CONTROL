import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/** Keeps `documentElement` in sync with theme + system preference. */
export function useTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.theme);
  const applyThemeClass = useSettingsStore((s) => s.applyThemeClass);

  useEffect(() => {
    applyThemeClass();

    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, applyThemeClass]);

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}
