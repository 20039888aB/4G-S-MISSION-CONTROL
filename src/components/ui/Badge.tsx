import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'god'
  | 'goals'
  | 'grinding'
  | 'gratitude';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-text-muted border-border',
  accent: 'bg-accent-soft text-accent border-accent/30',
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  danger: 'bg-danger/15 text-danger border-danger/25',
  god: 'bg-god/15 text-god border-god/25',
  goals: 'bg-goals/15 text-goals border-goals/25',
  grinding: 'bg-grinding/15 text-grinding border-grinding/25',
  gratitude: 'bg-gratitude/15 text-gratitude border-gratitude/25',
};

export function Badge({
  className,
  tone = 'neutral',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
