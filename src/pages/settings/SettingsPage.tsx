import { Download, RotateCcw, Smartphone, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Select,
  Toggle,
} from '@/components/ui';
import { downloadBackup, importAllData } from '@/db/backup';
import { db } from '@/db/database';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import type { SidebarAccordionMode, ThemeMode } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

const WIDGET_OPTIONS = [
  { id: 'mission-scores', label: 'Mission scores' },
  { id: 'habits-today', label: "Today's habits" },
  { id: 'goals-progress', label: 'Goals progress' },
  { id: 'finance-snapshot', label: 'Finance snapshot' },
  { id: 'ai-coach', label: 'AI coach teaser' },
  { id: 'quote', label: 'Quote of the day' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'upcoming', label: 'Upcoming' },
] as const;

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const addToast = useUiStore((s) => s.addToast);
  const [resetArmed, setResetArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pwa = usePwaInstall();

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const accordionMode = useSettingsStore((s) => s.sidebarAccordionMode);
  const setAccordionMode = useSettingsStore((s) => s.setSidebarAccordionMode);
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const wakeTime = useSettingsStore((s) => s.wakeTime);
  const setWakeTime = useSettingsStore((s) => s.setWakeTime);
  const sleepTarget = useSettingsStore((s) => s.sleepTarget);
  const setSleepTarget = useSettingsStore((s) => s.setSleepTarget);
  const widgets = useSettingsStore((s) => s.dashboardWidgets);
  const toggleWidget = useSettingsStore((s) => s.toggleDashboardWidget);
  const coachVoiceEnabled = useSettingsStore((s) => s.coachVoiceEnabled);
  const setCoachVoiceEnabled = useSettingsStore((s) => s.setCoachVoiceEnabled);

  async function onExport() {
    try {
      await downloadBackup();
      addToast('success', 'Backup downloaded.');
    } catch {
      addToast('danger', 'Backup export failed.');
    }
  }

  async function onImportFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      await importAllData(data);
      addToast('success', 'Backup imported. Reloading…');
      window.setTimeout(() => window.location.reload(), 600);
    } catch {
      addToast('danger', 'Import failed. Check the backup file.');
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!resetArmed) {
      setResetArmed(true);
      addToast('warning', 'Click reset again to confirm wiping local data.');
      return;
    }
    setBusy(true);
    try {
      await db.delete();
      localStorage.removeItem('g4-settings');
      sessionStorage.removeItem('g4_session');
      addToast('success', 'Local data cleared. Reloading…');
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      addToast('danger', 'Reset failed.');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tune Mission Control to your rhythm. Everything stays local."
        eyebrow="System"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance & navigation</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Select
              label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <Select
              label="Sidebar accordion"
              value={accordionMode}
              onChange={(e) =>
                setAccordionMode(e.target.value as SidebarAccordionMode)
              }
              options={[
                { value: 'single', label: 'Single section open' },
                { value: 'multiple', label: 'Multiple sections open' },
              ]}
            />
            <Toggle
              label="AI Coach voice (speak replies)"
              checked={coachVoiceEnabled}
              onChange={setCoachVoiceEnabled}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifestyle defaults</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'KES', label: 'KES — Kenyan Shilling' },
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'EUR', label: 'EUR — Euro' },
                { value: 'GBP', label: 'GBP — British Pound' },
              ]}
            />
            <Input
              label="Wake time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
            <Input
              label="Sleep target"
              type="time"
              value={sleepTarget}
              onChange={(e) => setSleepTarget(e.target.value)}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dashboard widgets</CardTitle>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WIDGET_OPTIONS.map((widget) => (
              <Toggle
                key={widget.id}
                label={widget.label}
                checked={widgets.includes(widget.id)}
                onChange={() => toggleWidget(widget.id)}
              />
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-accent/25">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-accent" />
              <CardTitle>Install on your phone</CardTitle>
            </div>
            {pwa.installed ? (
              <Badge tone="success">Installed</Badge>
            ) : (
              <Badge tone="accent">{pwa.platform}</Badge>
            )}
          </CardHeader>
          <p className="mb-3 text-sm text-text-muted">
            G4 Mission Control is a Progressive Web App. Install it to your home screen and it
            runs like a native app — offline, with your data saved locally on this device.
          </p>
          {pwa.installed ? (
            <p className="text-sm text-success">
              You’re in the installed app. Your habits, goals, and journals stay on this phone.
            </p>
          ) : pwa.platform === 'ios' ? (
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-text-muted">
              <li>Open this site in <strong>Safari</strong> (required on iPhone)</li>
              <li>Tap the <strong>Share</strong> icon</li>
              <li>Tap <strong>Add to Home Screen</strong>, then Add</li>
            </ol>
          ) : (
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-text-muted">
              <li>Open this site in <strong>Chrome</strong></li>
              <li>Tap menu <strong>⋮</strong> → <strong>Install app</strong> / Add to Home screen</li>
              <li>Or use the Install button below when Chrome offers it</li>
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            {pwa.canNativeInstall ? (
              <Button
                onClick={async () => {
                  const ok = await pwa.promptInstall();
                  if (ok) addToast('success', 'Installed — open from your home screen');
                }}
              >
                <Download className="size-4" />
                Install app
              </Button>
            ) : null}
            <Badge tone={pwa.offlineReady || pwa.installed ? 'success' : 'neutral'}>
              {pwa.offlineReady || pwa.installed ? 'Offline ready' : 'Open once online to cache'}
            </Badge>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup & restore</CardTitle>
          </CardHeader>
          <p className="mb-4 text-sm text-text-muted">
            Export a full JSON backup of your IndexedDB data, or restore from a previous file.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onExport()} disabled={busy}>
              <Download className="size-4" />
              Export backup
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </Card>

        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <p className="mb-4 text-sm text-text-muted">
            Wipe all local Mission Control data including credentials, habits, and logs.
            This cannot be undone.
          </p>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => void onReset()}
          >
            <RotateCcw className="size-4" />
            {resetArmed ? 'Confirm reset data' : 'Reset all data'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
