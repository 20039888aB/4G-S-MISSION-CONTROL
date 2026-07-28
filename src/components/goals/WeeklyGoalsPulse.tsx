import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge, Card, CardHeader, CardTitle, Progress, Skeleton } from '@/components/ui';
import type { WeeklyGoalReport } from '@/features/goals/hooks';
import { cn } from '@/lib/utils';

const MOMENTUM_TONE: Record<
  WeeklyGoalReport['momentum'],
  'accent' | 'success' | 'warning' | 'neutral'
> = {
  rising: 'success',
  steady: 'accent',
  cooling: 'warning',
  quiet: 'neutral',
};

export function WeeklyGoalsPulse({
  report,
}: {
  report: WeeklyGoalReport | null;
}) {
  if (!report) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>Weekly Goal Pulse</CardTitle>
        </CardHeader>
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const maxBar = Math.max(1, ...report.days.map((d) => d.workedCount));

  return (
    <Card glass className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Weekly Goal Pulse</CardTitle>
          <p className="mt-1 text-sm text-text-muted">{report.headline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={MOMENTUM_TONE[report.momentum]}>{report.momentum}</Badge>
          <Link to="/goals" className="text-sm font-medium text-accent hover:underline">
            Goals
          </Link>
        </div>
      </CardHeader>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Days worked" value={`${report.daysWorked}/7`} />
        <Stat label="Goals touched" value={String(report.goalsTouched)} />
        <Stat
          label="Net progress"
          value={report.netProgressThisWeek > 0 ? `+${report.netProgressThisWeek}%` : '0%'}
        />
      </div>

      <div className="mb-3 flex items-end justify-between gap-1.5">
        {report.days.map((day, index) => (
          <motion.div
            key={day.date}
            className="flex flex-1 flex-col items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * index, duration: 0.35 }}
          >
            <div className="flex h-16 w-full items-end justify-center">
              <motion.div
                className={cn(
                  'w-full max-w-[2rem] rounded-t-md',
                  day.workedCount > 0 ? 'bg-accent' : 'bg-border/80',
                  day.isToday && 'ring-2 ring-accent/40',
                )}
                initial={{ height: 4 }}
                animate={{
                  height: Math.max(6, (day.workedCount / maxBar) * 56),
                }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              />
            </div>
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                day.isToday ? 'text-accent' : 'text-text-muted',
              )}
            >
              {day.label}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
        <span>Active goals avg</span>
        <span>{report.avgProgressNow}%</span>
      </div>
      <Progress value={report.avgProgressNow} className="mb-3" />
      <p className="text-sm text-text-muted">{report.coachingLine}</p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-bg/30 px-2 py-2">
      <p className="text-[10px] tracking-wide text-text-muted uppercase">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold text-text">{value}</p>
    </div>
  );
}
