import { Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: ReactNode;
  glass?: boolean;
  className?: string;
  accentClassName?: string;
  /** Makes the whole card a tap target (e.g. quick-edit vitals). */
  onClick?: () => void;
  clickHint?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  glass = false,
  className,
  accentClassName,
  onClick,
  clickHint = 'Tap to edit',
}: StatCardProps) {
  const interactive = Boolean(onClick);
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
          {label}
        </p>
        <p className="font-display text-2xl font-bold text-text">{value}</p>
        {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
        {interactive ? (
          <p className="text-[10px] font-medium text-accent">{clickHint}</p>
        ) : null}
        {trend}
      </div>
      {Icon ? (
        <div
          className={cn(
            'relative flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent',
            accentClassName,
          )}
        >
          <Icon className="size-5" />
          {interactive ? (
            <Pencil className="absolute -right-1 -bottom-1 size-3 rounded-full bg-bg p-0.5 text-accent" />
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full rounded-[var(--radius-lg)] text-left transition',
          'hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          className,
        )}
      >
        <Card glass={glass} className="relative overflow-hidden">
          {body}
        </Card>
      </button>
    );
  }

  return (
    <Card glass={glass} className={cn('relative overflow-hidden', className)}>
      {body}
    </Card>
  );
}
