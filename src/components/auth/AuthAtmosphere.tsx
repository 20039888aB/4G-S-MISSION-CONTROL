import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { LOGO_MAIN_SRC } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export function AuthAtmosphere({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10',
        'bg-[#070b14]',
        className,
      )}
    >
      <motion.img
        src={LOGO_MAIN_SRC}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1.14 }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#070b14]/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/75 to-[#070b14]/45" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 size-[28rem] rounded-full bg-[#F0B429]/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 size-[26rem] rounded-full bg-[#dc2626]/12 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="auth-card"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
