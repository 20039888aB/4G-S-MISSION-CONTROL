import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ClipboardList, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PageHeader,
  Progress,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { useTimedQuote } from '@/hooks/useTimedQuote';
import { formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { DailyCheckIn } from '@/types';

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function DailyReviewPage() {
  const addToast = useUiStore((s) => s.addToast);
  const { quote, greeting } = useTimedQuote();
  const today = todayKey();

  const checkIns = useLiveQuery(() => db.dailyCheckIns.toArray(), []);
  const habits = useLiveQuery(
    () => db.habits.filter((h) => !h.archived).toArray(),
    [],
  );
  const habitLogs = useLiveQuery(
    () => db.habitLogs.where('date').equals(today).toArray(),
    [today],
  );
  const tasks = useLiveQuery(
    () => db.tasks.filter((t) => t.status !== 'cancelled').toArray(),
    [],
  );

  const todayCheckIn = useMemo(
    () => (checkIns ?? []).find((c) => c.date.slice(0, 10) === today) ?? null,
    [checkIns, today],
  );

  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [focus, setFocus] = useState(7);
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [gratefulFor, setGratefulFor] = useState('');
  const [prayerNote, setPrayerNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!todayCheckIn) return;
    setMood(todayCheckIn.mood);
    setEnergy(todayCheckIn.energy);
    setFocus(todayCheckIn.focus);
    setWins(todayCheckIn.wins);
    setBlockers(todayCheckIn.blockers);
    setTomorrowPriority(todayCheckIn.tomorrowPriority);
    setGratefulFor(todayCheckIn.gratefulFor ?? '');
    setPrayerNote(todayCheckIn.prayerNote ?? '');
  }, [todayCheckIn]);

  const habitsDone =
    habits?.filter((h) =>
      habitLogs?.some((l) => l.habitId === h.id && l.count >= h.targetPerDay),
    ).length ?? 0;
  const tasksDone = tasks?.filter((t) => t.status === 'done').length ?? 0;
  const tasksOpen =
    tasks?.filter((t) => t.status === 'todo' || t.status === 'in_progress').length ?? 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const payload: Omit<DailyCheckIn, 'id' | 'createdAt'> & {
        id?: string;
        createdAt?: string;
      } = {
        date: today,
        mood,
        energy,
        focus,
        wins: wins.trim(),
        blockers: blockers.trim(),
        tomorrowPriority: tomorrowPriority.trim(),
        gratefulFor: gratefulFor.trim() || undefined,
        prayerNote: prayerNote.trim() || undefined,
        updatedAt: now,
      };

      if (todayCheckIn) {
        await db.dailyCheckIns.update(todayCheckIn.id, payload);
        addToast('success', 'Daily review updated');
      } else {
        await db.dailyCheckIns.add({
          ...payload,
          id: uid(),
          createdAt: now,
        } as DailyCheckIn);
        addToast('success', 'Daily review saved');
      }
    } finally {
      setBusy(false);
    }
  }

  const history = useMemo(
    () =>
      [...(checkIns ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((c) => c.date.slice(0, 10) !== today)
        .slice(0, 10),
    [checkIns, today],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Review"
        description={`${greeting.line} — close the loop on today’s mission.`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glass>
          <p className="text-xs text-text-muted">Habits today</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {habitsDone}/{habits?.length ?? 0}
          </p>
          <Progress
            className="mt-3"
            value={habitsDone}
            max={Math.max(habits?.length ?? 1, 1)}
          />
        </Card>
        <Card glass>
          <p className="text-xs text-text-muted">Tasks closed</p>
          <p className="mt-1 font-display text-2xl font-bold">{tasksDone}</p>
          <p className="mt-1 text-sm text-text-muted">{tasksOpen} still open</p>
        </Card>
        <Card glass>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {greeting.label} quote
            </span>
          </div>
          <p className="text-sm italic text-text">
            &ldquo;{quote?.text ?? 'Stay locked on the 4 G\'s.'}&rdquo;
          </p>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-accent" />
            <CardTitle>Mission check-in</CardTitle>
          </div>
          {todayCheckIn ? <Badge tone="success">Saved today</Badge> : null}
        </CardHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={`Mood (${mood}/10)`}
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
            />
            <Input
              label={`Energy (${energy}/10)`}
              type="range"
              min={1}
              max={10}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
            />
            <Input
              label={`Focus (${focus}/10)`}
              type="range"
              min={1}
              max={10}
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
            />
          </div>
          <Textarea
            label="Wins"
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            rows={2}
            placeholder="What went right?"
          />
          <Textarea
            label="Blockers"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            placeholder="What got in the way?"
          />
          <Input
            label="Tomorrow’s #1 priority"
            value={tomorrowPriority}
            onChange={(e) => setTomorrowPriority(e.target.value)}
            placeholder="One clear mission for tomorrow"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea
              label="Grateful for"
              value={gratefulFor}
              onChange={(e) => setGratefulFor(e.target.value)}
              rows={2}
            />
            <Textarea
              label="Prayer / reflection"
              value={prayerNote}
              onChange={(e) => setPrayerNote(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" loading={busy}>
            <CheckCircle2 className="size-4" />
            {todayCheckIn ? 'Update review' : 'Save review'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <EmptyState
            title="No past reviews yet"
            description="Come back each evening — consistency compounds."
          />
        ) : (
          <ul className="space-y-3">
            {history.map((c) => (
              <li
                key={c.id}
                className="rounded-[var(--radius-md)] border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{formatDate(c.date)}</p>
                  <Badge>Mood {c.mood}</Badge>
                  <Badge>Energy {c.energy}</Badge>
                  <Badge>Focus {c.focus}</Badge>
                </div>
                {c.wins ? (
                  <p className="mt-1 text-sm text-text-muted">Wins: {c.wins}</p>
                ) : null}
                {c.tomorrowPriority ? (
                  <p className="mt-1 text-sm text-text-muted">
                    Next: {c.tomorrowPriority}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
