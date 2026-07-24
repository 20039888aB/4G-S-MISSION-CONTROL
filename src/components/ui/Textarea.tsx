import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
    const areaId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          className={cn(
            'w-full resize-y rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2',
            'text-text placeholder:text-text-muted/70',
            'transition-colors focus:border-accent focus:outline-none',
            error && 'border-danger',
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs text-danger">{error}</span> : null}
      </label>
    );
  },
);

Textarea.displayName = 'Textarea';
