import { Download, FileText, RotateCcw, Smartphone, Upload } from 'lucide-react';
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
  const boxRef = useRef<HTMLInputElement>(null);
  const addToast = useUiStore((s) => s.addToast);
  const [resetArmed, setResetArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [boxPassword, setBoxPassword] = useState('');
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
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  async function onExport() {
    try {
      await downloadBackup();
      addToast('success', 'JSON backup downloaded.');
    } catch {
      addToast('danger', 'Backup export failed.');
    }
  }

  async function onExportPdf() {
    setBusy(true);
    try {
      const { downloadMissionReportPdf } = await import(
        '@/services/export/missionReportPdf'
      );
      await downloadMissionReportPdf();
      addToast('success', 'Branded Mission Report PDF downloaded.');
    } catch {
      addToast('danger', 'PDF export failed.');
    } finally {
      setBusy(false);
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
      localStorage.removeItem('g4_session');
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
            <CardTitle>In-app notifications</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Toggle
              label="Reminders & inbox alerts"
              checked={notificationsEnabled}
              onChange={(on) => {
                setNotificationsEnabled(on);
                addToast(
                  'info',
                  on
                    ? 'Notifications armed — check the bell in the top bar.'
                    : 'Notifications paused.',
                );
              }}
            />
            <p className="text-xs leading-relaxed text-text-muted">
              Alerts stay on this device only: inbox under the bell, plus a short toast.
              No accounts, email, or remote push servers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!notificationsEnabled || busy}
                onClick={() => {
                  void (async () => {
                    const { sendTestNotification } = await import(
                      '@/services/notifications/local'
                    );
                    const ok = await sendTestNotification();
                    addToast(
                      ok ? 'success' : 'warning',
                      ok
                        ? 'Test sent — open the bell to read it.'
                        : 'Could not send (notifications may be off).',
                    );
                  })();
                }}
              >
                Send test notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!notificationsEnabled}
                onClick={() => {
                  void (async () => {
                    const { requestNotificationPermission } = await import(
                      '@/services/notifications/local'
                    );
                    const perm = await requestNotificationPermission();
                    addToast(
                      perm === 'granted' ? 'success' : 'info',
                      perm === 'granted'
                        ? 'Browser banners allowed (still local-only).'
                        : perm === 'denied'
                          ? 'Browser banners blocked — inbox still works.'
                          : 'Browser notifications unavailable here.',
                    );
                  })();
                }}
              >
                Allow browser banners
              </Button>
            </div>
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
            Download a branded Mission Report PDF (logo + navy/gold), keep a full JSON restore
            backup, or import a previous file. Everything stays on this device.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onExportPdf()} disabled={busy}>
              <FileText className="size-4" />
              Export Mission PDF
            </Button>
            <Button variant="secondary" onClick={() => void onExport()} disabled={busy}>
              <Download className="size-4" />
              Export JSON backup
            </Button>
            <Button
              variant="ghost"
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

        <Card className="lg:col-span-2 border-accent/25">
          <CardHeader>
            <CardTitle>Black box (encrypted migrate)</CardTitle>
          </CardHeader>
          <p className="mb-3 text-sm text-text-muted">
            Password-locked offline package for phone ↔ phone restore. No cloud. Use a password
            you will remember.
          </p>
          <Input
            label="Black box password"
            type="password"
            value={boxPassword}
            onChange={(e) => setBoxPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={busy || boxPassword.length < 6}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const { downloadBlackBox } = await import(
                      '@/services/security/blackBox'
                    );
                    await downloadBlackBox(boxPassword);
                    addToast('success', 'Black box downloaded.');
                  } catch (err) {
                    addToast(
                      'danger',
                      err instanceof Error ? err.message : 'Black box export failed.',
                    );
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Export black box
            </Button>
            <Button
              variant="secondary"
              disabled={busy || boxPassword.length < 6}
              onClick={() => boxRef.current?.click()}
            >
              Import black box
            </Button>
            <input
              ref={boxRef}
              type="file"
              accept=".g4box,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void (async () => {
                  setBusy(true);
                  try {
                    const { importBlackBox } = await import(
                      '@/services/security/blackBox'
                    );
                    await importBlackBox(file, boxPassword);
                    addToast('success', 'Black box restored. Reloading…');
                    window.setTimeout(() => window.location.reload(), 600);
                  } catch {
                    addToast('danger', 'Import failed — check password/file.');
                    setBusy(false);
                  }
                })();
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
