import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export interface SplashScreenProps {
  minDurationMs?: number;
  /** When false, splash stays visible even after minDurationMs. */
  readyToDismiss?: boolean;
  onFinish?: () => void;
  className?: string;
}

export function SplashScreen({
  minDurationMs = 1800,
  readyToDismiss = true,
  onFinish,
  className,
}: SplashScreenProps) {
  const [minElapsed, setMinElapsed] = useState(false);
  const visible = !(minElapsed && readyToDismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), minDurationMs);
    return () => window.clearTimeout(timer);
  }, [minDurationMs]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible ? (
        <motion.div
          className={cn(
            'fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden',
            'bg-[#070b14]',
            className,
          )}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          <img
            src="./logo-main.jpeg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-sm"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070b14]/40 via-[#070b14]/70 to-[#070b14]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center gap-5 px-4"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 rgba(240,180,41,0)',
                  '0 0 48px rgba(240,180,41,0.28)',
                  '0 0 0 rgba(240,180,41,0)',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-3xl"
            >
              <Logo size="hero" variant="full" showWordmark={false} />
            </motion.div>

            <div className="text-center">
              <motion.h1
                className="font-display text-2xl font-bold tracking-tight text-[#e8edf7] sm:text-3xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
              >
                G4 Mission Control
              </motion.h1>
            </div>

            <motion.div
              className="h-0.5 w-28 overflow-hidden rounded-full bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <motion.div
                className="h-full bg-[#F0B429]"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
