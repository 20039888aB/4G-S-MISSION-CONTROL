import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { db } from '@/db/database';
import { formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

type Period = 'week' | 'month' | 'year';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function periodRange(period: Period): { start: Date; end: Date; keys: string[] } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (period === 'week') {
    const start = startOfWeek(end, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    return {
      start,
      end,
      keys: days.map((d) => format(d, 'yyyy-MM-dd')),
    };
  }
  if (period === 'month') {
    const start = startOfMonth(end);
    const days = eachDayOfInterval({ start, end: endOfMonth(end) });
    return {
      start,
      end,
      keys: days.map((d) => format(d, 'yyyy-MM-dd')),
    };
  }
  const start = startOfYear(end);
  const months = eachMonthOfInterval({ start, end: endOfYear(end) });
  return {
    start,
    end,
    keys: months.map((d) => format(d, 'yyyy-MM')),
  };
}

export default function StatisticsPage() {
  const currency = useSettingsStore((s) => s.currency);
  const [period, setPeriod] = useState<Period>('week');
  const range = useMemo(() => periodRange(period), [period]);

  const habits = useLiveQuery(() => db.habits.filter((h) => !h.archived).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.toArray(), []);
  const workouts = useLiveQuery(() => db.workouts.toArray(), []);
  const sessions = useLiveQuery(() => db.learningSessions.toArray(), []);

  const habitChart = useMemo(() => {
    const active = habits ?? [];
    const logs = habitLogs ?? [];
    if (period === 'year') {
      return range.keys.map((month) => {
        const monthLogs = logs.filter((l) => l.date.startsWith(month));
        const daysInMonth = new Set(monthLogs.map((l) => l.date.slice(0, 10))).size || 1;
        let completed = 0;
        let possible = active.length * daysInMonth;
        for (const habit of active) {
          completed += monthLogs.filter(
            (l) => l.habitId === habit.id && l.count >= habit.targetPerDay,
          ).length;
        }
        return {
          label: month.slice(5),
          completion: possible ? Math.round((completed / possible) * 100) : 0,
        };
      });
    }
    return range.keys.map((day) => {
      const dayLogs = logs.filter((l) => l.date.slice(0, 10) === day);
      const done = active.filter((h) =>
        dayLogs.some((l) => l.habitId === h.id && l.count >= h.targetPerDay),
      ).length;
      return {
        label: format(new Date(`${day}T12:00:00`), period === 'week' ? 'EEE' : 'd'),
        completion: active.length
          ? Math.round((done / active.length) * 100)
          : 0,
      };
    });
  }, [habits, habitLogs, period, range.keys]);

  const cashflowChart = useMemo(() => {
    const rows = transactions ?? [];
    if (period === 'year') {
      return range.keys.map((month) => {
        const monthRows = rows.filter((t) => t.date.startsWith(month));
        return {
          label: month.slice(5),
          income: monthRows
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0),
          expense: monthRows
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0),
        };
      });
    }
    return range.keys.map((day) => {
      const dayRows = rows.filter((t) => t.date.slice(0, 10) === day);
      return {
        label: format(new Date(`${day}T12:00:00`), period === 'week' ? 'EEE' : 'd'),
        income: dayRows
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0),
        expense: dayRows
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, period, range.keys]);

  const workoutChart = useMemo(() => {
    const rows = workouts ?? [];
    if (period === 'year') {
      return range.keys.map((month) => ({
        label: month.slice(5),
        count: rows.filter((w) => w.date.startsWith(month)).length,
      }));
    }
    return range.keys.map((day) => ({
      label: format(new Date(`${day}T12:00:00`), period === 'week' ? 'EEE' : 'd'),
      count: rows.filter((w) => w.date.slice(0, 10) === day).length,
    }));
  }, [workouts, period, range.keys]);

  const studyChart = useMemo(() => {
    const rows = sessions ?? [];
    if (period === 'year') {
      return range.keys.map((month) => ({
        label: month.slice(5),
        hours:
          rows
            .filter((s) => s.date.startsWith(month))
            .reduce((sum, s) => sum + s.durationMinutes, 0) / 60,
      }));
    }
    return range.keys.map((day) => ({
      label: format(new Date(`${day}T12:00:00`), period === 'week' ? 'EEE' : 'd'),
      hours:
        rows
          .filter((s) => s.date.slice(0, 10) === day)
          .reduce((sum, s) => sum + s.durationMinutes, 0) / 60,
    }));
  }, [sessions, period, range.keys]);

  const chartTipStyle = {
    background: 'var(--color-bg-elevated, #121a2b)',
    border: '1px solid var(--color-border, #243049)',
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mission"
        title="Statistics"
        description="Habits, cashflow, workouts, and study hours — at a glance."
        actions={
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
            defaultValue="week"
          >
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card glass>
          <CardHeader>
            <CardTitle className="text-base">Habit completion %</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={habitChart}>
                <defs>
                  <linearGradient id="habitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0B429" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#F0B429" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit="%"
                />
                <Tooltip contentStyle={chartTipStyle} />
                <Area
                  type="monotone"
                  dataKey="completion"
                  name="Completion"
                  stroke="#F0B429"
                  fill="url(#habitFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="text-base">Finance cashflow</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={chartTipStyle}
                  formatter={(value) =>
                    formatCurrency(Number(value ?? 0), currency)
                  }
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workouts</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={chartTipStyle} />
                <Bar dataKey="count" name="Workouts" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study hours</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyChart}>
                <defs>
                  <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243049" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={chartTipStyle} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke="#0EA5E9"
                  fill="url(#studyFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <p className="text-xs text-text-muted">
        Period window: {format(range.start, 'MMM d, yyyy')} – today ({todayKey()}
        ). Empty series stay at zero until you log data.
      </p>
    </div>
  );
}
