/** Clears service worker + Cache Storage only. IndexedDB / local data stay. */
export async function hardRefreshApp(options?: {
  hash?: string;
}): Promise<void> {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    const keys = await caches?.keys();
    await Promise.all((keys ?? []).map((k) => caches.delete(k)));
  } catch {
    /* ignore */
  }
  if (options?.hash) {
    window.location.hash = options.hash;
  }
  window.location.reload();
}
