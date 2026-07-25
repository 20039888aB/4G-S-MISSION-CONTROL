import { type ComponentType, lazy, type LazyExoticComponent } from 'react';

/** Lazy-load a page and auto-retry once after a failed chunk fetch (phone PWA updates). */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (first) {
      // One reload attempt for stale chunk hashes after deploy.
      const key = 'g4-chunk-retry';
      const retried = sessionStorage.getItem(key);
      if (!retried) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        // Keep suspense pending until reload.
        return new Promise(() => undefined);
      }
      sessionStorage.removeItem(key);
      throw first;
    }
  });
}
