import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Self-typing greeting — restarts when the full line changes (name / day-part).
 */
export function TypewriterGreeting({
  text,
  className,
  charMs = 38,
  startDelayMs = 220,
}: {
  text: string;
  className?: string;
  charMs?: number;
  startDelayMs?: number;
}) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    let i = 0;
    let intervalId = 0;
    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, charMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(startId);
      window.clearInterval(intervalId);
    };
  }, [text, charMs, startDelayMs]);

  return (
    <h2 className={cn('font-display font-bold text-text', className)}>
      <span>{shown}</span>
      <motion.span
        aria-hidden
        className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] bg-accent align-baseline"
        animate={done ? { opacity: [1, 0, 1] } : { opacity: 1 }}
        transition={
          done
            ? { duration: 1.05, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      />
    </h2>
  );
}
