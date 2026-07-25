import type { G4Pillar } from '@/types';

export interface PillarScores {
  god: number;
  goals: number;
  grinding: number;
  gratitude: number;
}

const RANKS = [
  { min: 90, title: 'Vanguard' },
  { min: 80, title: 'Sentinel' },
  { min: 70, title: 'Keeper' },
  { min: 55, title: 'Builder' },
  { min: 40, title: 'Seeker' },
  { min: 0, title: 'Initiate' },
] as const;

const PILLAR_CODE: Record<G4Pillar, string> = {
  god: 'GOD',
  goals: 'GOAL',
  grinding: 'GRIND',
  gratitude: 'GRAT',
};

/** Living callsign from 4G pillar blend — evolves as scores move. */
export function buildCallsign(
  pillars: PillarScores,
  weekKey?: string,
): {
  callsign: string;
  rank: string;
  dominant: G4Pillar;
  overall: number;
  blurb: string;
} {
  const overall = Math.round(
    (pillars.god + pillars.goals + pillars.grinding + pillars.gratitude) / 4,
  );
  const rank = RANKS.find((r) => overall >= r.min)?.title ?? 'Initiate';
  const dominant = (
    Object.entries(pillars) as [G4Pillar, number][]
  ).sort((a, b) => b[1] - a[1])[0]![0];

  const week = weekKey ?? isoWeekKey();
  const code = `${PILLAR_CODE[dominant]}-${overall}-${week.slice(-2)}`;
  const callsign = `${rank} ${code}`;

  const blurb =
    overall >= 80
      ? 'Your identity is compounding — protect the rhythm that built this rank.'
      : overall >= 60
        ? 'Solid trajectory. One kept covenant this week can push you into the next rank.'
        : 'Callsign is forming. Stack small wins across God, Goals, Grinding, and Gratitude.';

  return { callsign, rank, dominant, overall, blurb };
}

export function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Map app mission scores into 4G pillars. */
export function pillarsFromMission(scores: {
  spiritual: number;
  mission: number;
  discipline: number;
  learning: number;
  health: number;
  finance: number;
}): PillarScores {
  return {
    god: scores.spiritual,
    goals: Math.round((scores.mission + scores.learning) / 2),
    grinding: Math.round((scores.discipline + scores.health) / 2),
    gratitude: Math.round((scores.spiritual + scores.finance) / 2),
  };
}
