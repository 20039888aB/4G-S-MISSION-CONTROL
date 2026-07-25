import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Card, CardTitle } from '@/components/ui';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches lazy-route / render crashes (common on phones after a PWA update)
 * and offers a safe reload without wiping IndexedDB data.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[G4] Route crash', error, info.componentStack);
  }

  private async hardRefresh(): Promise<void> {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs ?? []).map((r) => r.unregister()));
      const keys = await caches?.keys();
      await Promise.all((keys ?? []).map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
    // Keep localStorage / IndexedDB — only refresh app shell caches.
    window.location.hash = '#/';
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-text">
        <Card glass>
          <CardTitle>{this.props.label ?? 'This screen hit a snag'}</CardTitle>
          <p className="mt-2 text-sm text-text-muted">
            Usually this is a stale phone cache after an update. Your habits and login stay on the
            device — tap reload to fetch the latest app files.
          </p>
          <p className="mt-2 break-all rounded-md border border-border bg-bg/50 p-2 text-[11px] text-text-muted">
            {this.state.error.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void this.hardRefresh()}>Reload app files</Button>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ error: null });
                window.location.hash = '#/';
              }}
            >
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
