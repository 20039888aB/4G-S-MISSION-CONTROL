import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Book,
  CheckCircle,
  Clock,
  Dumbbell,
  Flame,
  GraduationCap,
  Heart,
  Lock,
  PiggyBank,
  Receipt,
  Scale,
  Sunrise,
  TrendingUp,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Progress,
} from '@/components/ui';
import { db } from '@/db/database';
import { formatDate } from '@/lib/utils';
import { evaluateAchievements } from '@/services/achievements/engine';
import { useUiStore } from '@/stores/uiStore';
import type { Achievement, UnlockedAchievement } from '@/types';

const ICON_MAP: Record<string, typeof Award> = {
  flame: Flame,
  dumbbell: Dumbbell,
  'hands-praying': Heart,
  'piggy-bank': PiggyBank,
  'graduation-cap': GraduationCap,
  scale: Scale,
  heart: Heart,
  book: Book,
  'check-circle': CheckCircle,
  receipt: Receipt,
  clock: Clock,
  'trending-up': TrendingUp,
  sunrise: Sunrise,
};

export default function AchievementsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const achievements = useLiveQuery(() => db.achievements.toArray(), []);
  const unlocked = useLiveQuery(() => db.unlockedAchievements.toArray(), []);
  const [celebrating, setCelebrating] = useState<Achievement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const newly = await evaluateAchievements(db);
      if (cancelled || newly.length === 0) return;
      const defs = await db.achievements.toArray();
      const fresh = newly
        .map((u) => defs.find((d) => d.id === u.achievementId))
        .filter((d): d is Achievement => Boolean(d));
      setCelebrating(fresh);
      for (const item of newly) {
        await db.unlockedAchievements.update(item.id, { seen: true });
      }
      addToast(
        'success',
        fresh.length === 1
          ? `Unlocked: ${fresh[0]!.title}`
          : `${fresh.length} new achievements unlocked!`,
      );
      window.setTimeout(() => setCelebrating([]), 4200);
    })();
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const unlockedMap = useMemo(() => {
    const map = new Map<string, UnlockedAchievement>();
    for (const row of unlocked ?? []) {
      map.set(row.achievementId, row);
    }
    return map;
  }, [unlocked]);

  const sorted = useMemo(() => {
    const rows = [...(achievements ?? [])];
    rows.sort((a, b) => {
      const au = unlockedMap.has(a.id) ? 0 : 1;
      const bu = unlockedMap.has(b.id) ? 0 : 1;
      if (au !== bu) return au - bu;
      return a.title.localeCompare(b.title);
    });
    return rows;
  }, [achievements, unlockedMap]);

  const unlockedCount = unlockedMap.size;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mission"
        title="Achievements"
        description={`${unlockedCount}/${sorted.length || 0} badges unlocked — keep stacking proof.`}
      />

      <AnimatePresence>
        {celebrating.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative overflow-hidden rounded-[var(--radius-lg)] border border-accent/40 bg-accent-soft/40 p-5"
          >
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(240,180,41,0.35),transparent_55%)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative flex items-center gap-3">
              <Award className="size-8 text-accent" />
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
                  New unlock
                </p>
                <p className="font-display text-xl font-bold">
                  {celebrating.map((c) => c.title).join(' · ')}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {sorted.length === 0 ? (
        <Card glass>
          <EmptyState
            icon={Award}
            title="No achievements seeded"
            description="Default badges appear after first app seed."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((achievement, i) => {
            const unlock = unlockedMap.get(achievement.id);
            const unlockedNow = Boolean(unlock);
            const Icon = ICON_MAP[achievement.icon] ?? Award;
            const isNew = celebrating.some((c) => c.id === achievement.id);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isNew ? [1, 1.03, 1] : 1,
                }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  glass={unlockedNow}
                  className={
                    unlockedNow
                      ? 'h-full border-accent/30'
                      : 'h-full opacity-75'
                  }
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          unlockedNow
                            ? 'flex size-11 items-center justify-center rounded-full bg-accent text-[#0b1220]'
                            : 'flex size-11 items-center justify-center rounded-full border border-border bg-surface text-text-muted'
                        }
                      >
                        {unlockedNow ? (
                          <Icon className="size-5" />
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {achievement.title}
                        </CardTitle>
                        <Badge tone={unlockedNow ? 'accent' : 'neutral'}>
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <p className="mb-3 text-sm text-text-muted">
                    {achievement.description}
                  </p>
                  {unlockedNow && unlock ? (
                    <p className="text-xs text-accent">
                      Unlocked {formatDate(unlock.unlockedAt)}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted">
                        Threshold: {achievement.threshold}
                      </p>
                      <Progress value={0} className="opacity-40" />
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
