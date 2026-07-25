import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  CheckSquare,
  Flame,
  Quote as QuoteIcon,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
  StatCard,
} from '@/components/ui';
import { db } from '@/db/database';
import { useMissionScores } from '@/hooks/useMissionScores';
import { toggleHabitToday } from '@/features/habits/hooks';
import { useTimedQuote } from '@/hooks/useTimedQuote';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  buildCallsign,
  pillarsFromMission,
} from '@/services/mission/callsign';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

export default function DashboardPage() {
  const currency = useSettingsStore((s) => s.currency);
  const widgets = useSettingsStore((s) => s.dashboardWidgets);
  const scores = useMissionScores();
  const { quote, greeting, context, poolSize, loading: quoteLoading } =
    useTimedQuote();
  const addToast = useUiStore((s) => s.addToast);
  const setCommandOpen = useUiStore((s) => s.setCommandPaletteOpen);

  const today = new Date().toISOString().slice(0, 10);

  const habits = useLiveQuery(
    () => db.habits.filter((h) => !h.archived).sortBy('sortOrder'),
    [],
  );
  const habitLogs = useLiveQuery(
    () => db.habitLogs.where('date').startsWith(today).toArray(),
    [today],
  );
  const goals = useLiveQuery(
    () => db.goals.filter((g) => g.status === 'active').limit(4).toArray(),
    [],
  );
  const transactions = useLiveQuery(async () => {
    const month = today.slice(0, 7);
    return db.transactions.filter((t) => t.date.startsWith(month)).toArray();
  }, [today]);

  const habitsDone =
    habits?.filter((h) =>
      habitLogs?.some((l) => l.habitId === h.id && l.count >= h.targetPerDay),
    ).length ?? 0;

  const income =
    transactions
      ?.filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const expense =
    transactions
      ?.filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0) ?? 0;

  const enabled = (id: string) => widgets.includes(id);
  const callsign = buildCallsign(pillarsFromMission(scores)).callsign;

  return (
    <div className="space-y-6">
      <Card glass padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-4">
            <Logo size="md" variant="full" showWordmark={false} />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                {scores.loading ? 'Mission Control' : callsign}
              </p>
              <p className="text-[10px] text-text-muted">
                Mission Briefing · {greeting.label} ·{' '}
                <Link to="/mission-systems" className="text-accent hover:underline">
                  Mission Systems
                </Link>
              </p>
              <h2 className="font-display text-2xl font-bold text-text sm:text-3xl">
                {greeting.line}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {formatDate(greeting.now, 'EEEE, MMM d')} · {greeting.subline} — stay
                locked on the 4 G&apos;s.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{greeting.label}</Badge>
            <Badge tone="neutral">{poolSize ? `${poolSize} timed quotes` : 'Syncing quotes'}</Badge>
          </div>
        </div>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/review"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Daily Review
          </Link>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Quick Capture
          </button>
          <Link
            to="/habits"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Manage Habits
          </Link>
          <Link
            to="/goals"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Manage Goals
          </Link>
          <Link
            to="/notes"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Notes Vault
          </Link>
          <Link
            to="/tasks"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
          >
            Tasks
          </Link>
        </div>
      </Card>

      {enabled('mission-scores') ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {scores.loading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                label="Overall"
                value={scores.overall}
                hint="Mission readiness"
                icon={Sparkles}
                glass
              />
              <StatCard
                label="Discipline"
                value={scores.discipline}
                hint="Habits today"
                icon={Flame}
                accentClassName="bg-grinding/15 text-grinding"
              />
              <StatCard
                label="Health"
                value={scores.health}
                hint="Body systems"
                icon={Activity}
                accentClassName="bg-success/15 text-success"
              />
              <StatCard
                label="Finance"
                value={scores.finance}
                hint="Cashflow pulse"
                icon={Wallet}
                accentClassName="bg-goals/15 text-goals"
              />
            </>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {enabled('habits-today') ? (
          <Card glass className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Today's Habits</CardTitle>
                <p className="text-sm text-text-muted">
                  {habitsDone}/{habits?.length ?? 0} complete
                </p>
              </div>
              <Link to="/habits" className="text-sm font-medium text-accent hover:underline">
                Open
              </Link>
            </CardHeader>
            <Progress
              value={habitsDone}
              max={Math.max(habits?.length ?? 1, 1)}
              className="mb-4"
            />
            <ul className="grid gap-2 sm:grid-cols-2">
              {(habits ?? []).slice(0, 8).map((habit) => {
                const done = habitLogs?.some(
                  (l) => l.habitId === habit.id && l.count >= habit.targetPerDay,
                );
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleHabitToday(habit);
                        addToast(
                          'success',
                          done ? `Unchecked ${habit.name}` : `Completed ${habit.name}`,
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg/40 px-3 py-2 text-left transition hover:border-accent/50"
                    >
                      <CheckSquare
                        className={done ? 'size-4 text-success' : 'size-4 text-text-muted'}
                      />
                      <span className="truncate text-sm font-medium">{habit.name}</span>
                      {done ? (
                        <Badge tone="success" className="ml-auto">
                          Done
                        </Badge>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {!habits ? (
                <>
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </>
              ) : null}
            </ul>
          </Card>
        ) : null}

        {enabled('quote') ? (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,180,41,0.14),transparent_55%)]" />
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-accent">
                <QuoteIcon className="size-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Quote for {context?.label ?? greeting.label}
                </span>
                <Badge tone="accent">{greeting.clockLabel}</Badge>
              </div>
              {quoteLoading ? (
                <Skeleton className="h-24" />
              ) : quote ? (
                <>
                  <p className="font-display text-lg leading-snug text-text">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <p className="mt-3 text-sm text-text-muted">— {quote.author}</p>
                </>
              ) : (
                <Skeleton className="h-24" />
              )}
            </div>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {enabled('goals-progress') ? (
          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <Link to="/goals" className="text-sm font-medium text-accent hover:underline">
                View all
              </Link>
            </CardHeader>
            <div className="space-y-3">
              {(goals ?? []).length === 0 ? (
                <p className="text-sm text-text-muted">
                  No active goals yet — set one and start stacking wins.
                </p>
              ) : (
                (goals ?? []).map((goal) => (
                  <div key={goal.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-text-muted">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} />
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : null}

        {enabled('finance-snapshot') ? (
          <Card>
            <CardHeader>
              <CardTitle>Finance Snapshot</CardTitle>
              <Link to="/finance" className="text-sm font-medium text-accent hover:underline">
                Ledger
              </Link>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-border bg-surface/50 p-3">
                <p className="text-xs text-text-muted">Income (month)</p>
                <p className="mt-1 font-display text-xl font-semibold text-success">
                  {formatCurrency(income, currency)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border bg-surface/50 p-3">
                <p className="text-xs text-text-muted">Expenses (month)</p>
                <p className="mt-1 font-display text-xl font-semibold text-danger">
                  {formatCurrency(expense, currency)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <ScoreChip label="Learning" value={scores.learning} />
              <ScoreChip label="Business" value={scores.business} />
              <ScoreChip label="Spiritual" value={scores.spiritual} />
            </div>
          </Card>
        ) : null}
      </div>

      {enabled('ai-coach') ? (
        <Card glass>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <CardTitle>AI Coach</CardTitle>
            </div>
            <Link to="/ai-coach" className="text-sm font-medium text-accent hover:underline">
              Open coach
            </Link>
          </CardHeader>
          <p className="text-sm text-text-muted">
            Your local coach is standing by. Open the AI Coach module for personalized,
            shame-free insights across habits, prayer, spending, and grind.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-border px-2 py-2">
      <p className="text-text-muted">{label}</p>
      <p className="mt-0.5 font-display text-base font-semibold text-text">{value}</p>
    </div>
  );
}
