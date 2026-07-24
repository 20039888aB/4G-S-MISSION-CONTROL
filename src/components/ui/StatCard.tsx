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
}: StatCardProps) {
  return (
    <Card glass={glass} className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
            {label}
          </p>
          <p className="font-display text-2xl font-bold text-text">{value}</p>
          {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
          {trend}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent',
              accentClassName,
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
