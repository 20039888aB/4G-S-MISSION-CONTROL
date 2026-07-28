import { motion } from 'framer-motion';
import { localDateKey, shiftLocalDateKey, type GoalWeekDay } from '@/features/goals/hooks';
import type { Goal, GoalDayLog } from '@/types';
import { cn } from '@/lib/utils';

/** Mini 7-day strip for a single goal. */
export function GoalWeekStrip({
  goal,
  logs,
}: {
  goal: Goal;
  logs: GoalDayLog[];
}) {
  const today = localDateKey();
  const days: Array<GoalWeekDay & { log?: GoalDayLog }> = Array.from(
    { length: 7 },
    (_, i) => {
      const date = shiftLocalDateKey(today, i - 6);
      const log = logs.find((l) => l.goalId === goal.id && l.date === date);
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y!, m! - 1, d!);
      const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
      return {
        date,
        label: labels[dt.getDay()]!,
        isToday: date === today,
        avgProgress: log?.progress ?? goal.progress,
        workedCount: log?.worked ? 1 : 0,
        netDelta: log?.delta ?? 0,
        log,
      };
    },
  );

  return (
    <div className="flex gap-1.5">
      {days.map((day, index) => (
        <motion.div
          key={day.date}
          title={
            day.log
              ? `${day.date}: ${day.log.progress}%${day.log.worked ? ' · worked' : ''}`
              : `${day.date}: no log`
          }
          className="flex flex-1 flex-col items-center gap-1"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.03 * index }}
        >
          <span
            className={cn(
              'size-7 rounded-full border text-[10px] font-semibold leading-7',
              day.log?.worked
                ? 'border-accent bg-accent text-[#0b1220]'
                : day.log
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : 'border-border text-text-muted',
              day.isToday && !day.log?.worked && 'ring-1 ring-accent/50',
            )}
          >
            {day.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
