import type { G4Pillar, TimeSlot } from '@/types';

export type InsightSeverity = 'info' | 'success' | 'warning';

export interface CoachAction {
  label: string;
  href: string;
}

export interface Insight {
  id: string;
  category: string;
  severity: InsightSeverity;
  message: string;
  relatedPillar: G4Pillar;
  quote?: string;
  quoteAuthor?: string;
  wisdom?: string;
  advice?: string;
  motivation?: string;
  /** Full script optimized for text-to-speech */
  speakText?: string;
  actions?: CoachAction[];
}

export interface HabitGap {
  id: string;
  name: string;
  pillar?: G4Pillar;
  streak: number;
}

export interface GoalBrief {
  id: string;
  title: string;
  progress: number;
  pillar?: G4Pillar;
  targetDate?: string;
  openMilestones: number;
}

export interface DataSnapshot {
  displayName: string;
  timeLabel: string;
  greeting: string;
  slot: Exclude<TimeSlot, 'any'>;
  weekday: string;
  currency: string;

  habitStreakMax: number;
  habitsCompletedToday: number;
  habitsTargetToday: number;
  habitGaps: HabitGap[];

  prayerSkippedDaysLast7: number;
  prayersLoggedLast7: number;
  bibleDaysLast7: number;
  openPrayerRequests: number;

  spendingThisMonth: number;
  incomeThisMonth: number;
  budgetUtilizationPct: number;
  spendingLabel: string;
  incomeLabel: string;
  netWorth: number;
  netWorthLabel: string;
  netWorthDelta30d: number;
  topSavingsName?: string;
  topSavingsPct?: number;

  avgSleepHoursLast7: number;
  sleepTargetHours: number;
  latestWeightKg?: number;
  workoutsLast30: number;

  studyHoursLast7: number;
  activeCourses: number;
  readingBooks: number;

  gratitudeStreak: number;
  gratitudeToday: boolean;

  goals: GoalBrief[];
  goalsCompleted: number;
  openTasks: number;
  overdueTasks: number;
  tasksDoneToday: number;

  recentMood?: number;
  recentEnergy?: number;
  recentFocus?: number;
  checkInToday: boolean;

  activeBusinesses: number;
  wishlistTopTitle?: string;
  wishlistTopPct?: number;
}

export type CoachIntent =
  | 'greeting'
  | 'today_plan'
  | 'habits'
  | 'goals'
  | 'finance'
  | 'health'
  | 'spiritual'
  | 'gratitude'
  | 'learning'
  | 'business'
  | 'motivation'
  | 'best_self'
  | 'stuck'
  | 'review'
  | 'help'
  | 'general';

export interface CoachReply {
  intent: CoachIntent;
  message: string;
  actions: CoachAction[];
  followUps: string[];
  insights?: Insight[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  intent?: CoachIntent;
  actions?: CoachAction[];
  followUps?: string[];
  createdAt: string;
}
