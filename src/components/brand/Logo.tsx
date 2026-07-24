import { cn } from '@/lib/utils';

/** Primary written brand mark — The 4 G's wordmark artwork. */
export const LOGO_MAIN_SRC = './logo-main.jpeg';

export interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  showMotto?: boolean;
  /** `full` shows the written logo poster; `mark` is compact for chrome. */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

const sizeMap = {
  sm: {
    mark: 'h-9 w-9',
    full: 'h-10 w-auto max-w-[7.5rem]',
    title: 'text-sm',
    motto: 'text-[10px]',
  },
  md: {
    mark: 'h-11 w-11',
    full: 'h-14 w-auto max-w-[10rem]',
    title: 'text-lg',
    motto: 'text-xs',
  },
  lg: {
    mark: 'h-16 w-16',
    full: 'h-28 w-auto max-w-[14rem] sm:h-32 sm:max-w-[16rem]',
    title: 'text-2xl',
    motto: 'text-sm',
  },
  hero: {
    mark: 'h-24 w-24',
    full: 'h-[min(52vh,28rem)] w-auto max-w-[min(90vw,22rem)]',
    title: 'text-3xl',
    motto: 'text-sm',
  },
} as const;

export function Logo({
  className,
  showWordmark = true,
  showMotto = false,
  variant = 'full',
  size = 'md',
}: LogoProps) {
  const dims = sizeMap[size];
  const imgClass =
    variant === 'mark'
      ? cn('shrink-0 rounded-xl object-cover object-center', dims.mark)
      : cn('shrink-0 rounded-2xl object-contain', dims.full);

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        variant === 'full' && !showWordmark && 'flex-col',
        className,
      )}
    >
      <img
        src={LOGO_MAIN_SRC}
        alt="The 4 G's — God, Goals, Grinding, Gratitude"
        className={imgClass}
        decoding="async"
      />
      {showWordmark ? (
        <div className="min-w-0">
          <p className={cn('font-display font-bold tracking-tight text-text', dims.title)}>
            G4 Mission Control
          </p>
          {showMotto ? (
            <p className={cn('text-text-muted', dims.motto)}>
              God • Goals • Grinding • Gratitude
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
