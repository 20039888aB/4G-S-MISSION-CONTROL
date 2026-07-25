import Dexie, { type EntityTable } from 'dexie';
import { QUOTE_CATALOG, QUOTE_CATALOG_COUNT } from '@/data/quotes/catalog';
import {
  SCHEMA_V1,
  SCHEMA_V2,
  SCHEMA_V3,
  SCHEMA_V4,
  SCHEMA_V5,
  type G4Tables,
  type TableName,
} from '@/db/schema';
import type {
  Achievement,
  AppSettings,
  Habit,
} from '@/types';

export class G4Database extends Dexie {
  credentials!: EntityTable<G4Tables['credentials'], 'id'>;
  profiles!: EntityTable<G4Tables['profiles'], 'id'>;
  habits!: EntityTable<G4Tables['habits'], 'id'>;
  habitLogs!: EntityTable<G4Tables['habitLogs'], 'id'>;
  goals!: EntityTable<G4Tables['goals'], 'id'>;
  tasks!: EntityTable<G4Tables['tasks'], 'id'>;
  healthMetrics!: EntityTable<G4Tables['healthMetrics'], 'id'>;
  workouts!: EntityTable<G4Tables['workouts'], 'id'>;
  bodyMeasurements!: EntityTable<G4Tables['bodyMeasurements'], 'id'>;
  transactions!: EntityTable<G4Tables['transactions'], 'id'>;
  budgets!: EntityTable<G4Tables['budgets'], 'id'>;
  savingsGoals!: EntityTable<G4Tables['savingsGoals'], 'id'>;
  assets!: EntityTable<G4Tables['assets'], 'id'>;
  liabilities!: EntityTable<G4Tables['liabilities'], 'id'>;
  businesses!: EntityTable<G4Tables['businesses'], 'id'>;
  clients!: EntityTable<G4Tables['clients'], 'id'>;
  businessProjects!: EntityTable<G4Tables['businessProjects'], 'id'>;
  invoices!: EntityTable<G4Tables['invoices'], 'id'>;
  businessIdeas!: EntityTable<G4Tables['businessIdeas'], 'id'>;
  wishlist!: EntityTable<G4Tables['wishlist'], 'id'>;
  courses!: EntityTable<G4Tables['courses'], 'id'>;
  books!: EntityTable<G4Tables['books'], 'id'>;
  learningSessions!: EntityTable<G4Tables['learningSessions'], 'id'>;
  prayerLogs!: EntityTable<G4Tables['prayerLogs'], 'id'>;
  bibleReadings!: EntityTable<G4Tables['bibleReadings'], 'id'>;
  spiritualEntries!: EntityTable<G4Tables['spiritualEntries'], 'id'>;
  prayerRequests!: EntityTable<G4Tables['prayerRequests'], 'id'>;
  gratitudeEntries!: EntityTable<G4Tables['gratitudeEntries'], 'id'>;
  journalEntries!: EntityTable<G4Tables['journalEntries'], 'id'>;
  calendarEvents!: EntityTable<G4Tables['calendarEvents'], 'id'>;
  notes!: EntityTable<G4Tables['notes'], 'id'>;
  dailyCheckIns!: EntityTable<G4Tables['dailyCheckIns'], 'id'>;
  coachMessages!: EntityTable<G4Tables['coachMessages'], 'id'>;
  achievements!: EntityTable<G4Tables['achievements'], 'id'>;
  unlockedAchievements!: EntityTable<G4Tables['unlockedAchievements'], 'id'>;
  notifications!: EntityTable<G4Tables['notifications'], 'id'>;
  settings!: EntityTable<G4Tables['settings'], 'id'>;
  activityLogs!: EntityTable<G4Tables['activityLogs'], 'id'>;
  quotes!: EntityTable<G4Tables['quotes'], 'id'>;
  streakCovenants!: EntityTable<G4Tables['streakCovenants'], 'id'>;
  bodyPhotos!: EntityTable<G4Tables['bodyPhotos'], 'id'>;
  faithGrindLinks!: EntityTable<G4Tables['faithGrindLinks'], 'id'>;
  warRoomSessions!: EntityTable<G4Tables['warRoomSessions'], 'id'>;

  constructor() {
    super('G4MissionControl');
    this.version(1).stores(SCHEMA_V1);
    this.version(2).stores(SCHEMA_V2).upgrade(async (tx) => {
      await tx
        .table('businesses')
        .toCollection()
        .modify((business: Record<string, unknown>) => {
          if (!business.status) business.status = 'active';
        });
    });
    this.version(3).stores(SCHEMA_V3);
    this.version(4).stores(SCHEMA_V4);
    this.version(5).stores(SCHEMA_V5);
  }
}

export const db = new G4Database();

/** Stub for future schema migrations. */
export async function migrateIfNeeded(): Promise<void> {
  // Versioned Dexie upgrades handle structural changes.
  // Use this hook for data backfills when bumping schema versions.
}

const DEFAULT_HABIT_NAMES = [
  'Wake 4:30 AM',
  'Exercise',
  'Read',
  'Code',
  'Study',
  'Pray',
  'Meditate',
  'Drink Water',
  'Sleep on time',
  'Healthy eating',
  'No junk food',
  'No procrastination',
] as const;

const HABIT_META: Record<
  (typeof DEFAULT_HABIT_NAMES)[number],
  Pick<Habit, 'icon' | 'pillar' | 'color'>
> = {
  'Wake 4:30 AM': { icon: 'sunrise', pillar: 'grinding', color: '#F0B429' },
  Exercise: { icon: 'dumbbell', pillar: 'grinding', color: '#F0B429' },
  Read: { icon: 'book-open', pillar: 'goals', color: '#0EA5E9' },
  Code: { icon: 'code-2', pillar: 'grinding', color: '#F0B429' },
  Study: { icon: 'graduation-cap', pillar: 'goals', color: '#0EA5E9' },
  Pray: { icon: 'hands-praying', pillar: 'god', color: '#3B82F6' },
  Meditate: { icon: 'brain', pillar: 'gratitude', color: '#14B8A6' },
  'Drink Water': { icon: 'droplets', pillar: 'grinding', color: '#38BDF8' },
  'Sleep on time': { icon: 'moon', pillar: 'grinding', color: '#64748B' },
  'Healthy eating': { icon: 'salad', pillar: 'grinding', color: '#22C55E' },
  'No junk food': { icon: 'ban', pillar: 'grinding', color: '#EF4444' },
  'No procrastination': { icon: 'zap', pillar: 'grinding', color: '#F0B429' },
};

const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
  {
    key: 'streak_7',
    title: '7-Day Streak',
    description: 'Complete a habit for 7 days in a row.',
    icon: 'flame',
    category: 'habits',
    threshold: 7,
    pillar: 'grinding',
  },
  {
    key: 'streak_30',
    title: '30-Day Streak',
    description: 'Hold a 30-day habit streak.',
    icon: 'flame',
    category: 'habits',
    threshold: 30,
    pillar: 'grinding',
  },
  {
    key: 'workouts_100',
    title: '100 Workouts',
    description: 'Log 100 workouts.',
    icon: 'dumbbell',
    category: 'fitness',
    threshold: 100,
    pillar: 'grinding',
  },
  {
    key: 'prayers_100',
    title: '100 Prayers',
    description: 'Log 100 prayer moments.',
    icon: 'hands-praying',
    category: 'spiritual',
    threshold: 100,
    pillar: 'god',
  },
  {
    key: 'saved_100k',
    title: 'First 100k KES Saved',
    description: 'Reach 100,000 KES in savings goals.',
    icon: 'piggy-bank',
    category: 'finance',
    threshold: 100_000,
    pillar: 'goals',
  },
  {
    key: 'first_course',
    title: 'First Course',
    description: 'Complete your first course.',
    icon: 'graduation-cap',
    category: 'learning',
    threshold: 1,
    pillar: 'goals',
  },
  {
    key: 'lose_5kg',
    title: 'Lose 5kg',
    description: 'Drop 5kg from your starting weight.',
    icon: 'scale',
    category: 'fitness',
    threshold: 5,
    pillar: 'grinding',
  },
  {
    key: 'gratitude_30',
    title: 'Grateful Heart',
    description: 'Write 30 gratitude entries.',
    icon: 'heart',
    category: 'general',
    threshold: 30,
    pillar: 'gratitude',
  },
  {
    key: 'bible_21',
    title: 'Word Warrior',
    description: 'Complete 21 Bible readings.',
    icon: 'book',
    category: 'spiritual',
    threshold: 21,
    pillar: 'god',
  },
  {
    key: 'tasks_50',
    title: 'Task Crusher',
    description: 'Complete 50 tasks.',
    icon: 'check-circle',
    category: 'general',
    threshold: 50,
    pillar: 'grinding',
  },
  {
    key: 'first_invoice',
    title: 'First Invoice Paid',
    description: 'Collect payment on your first invoice.',
    icon: 'receipt',
    category: 'business',
    threshold: 1,
    pillar: 'goals',
  },
  {
    key: 'study_50h',
    title: '50 Study Hours',
    description: 'Accumulate 50 hours of focused study.',
    icon: 'clock',
    category: 'learning',
    threshold: 50,
    pillar: 'goals',
  },
  {
    key: 'net_worth_positive',
    title: 'In the Green',
    description: 'Reach a positive net worth.',
    icon: 'trending-up',
    category: 'finance',
    threshold: 1,
    pillar: 'goals',
  },
  {
    key: 'wake_early_14',
    title: 'Dawn Discipline',
    description: 'Wake at 4:30 AM for 14 days.',
    icon: 'sunrise',
    category: 'habits',
    threshold: 14,
    pillar: 'grinding',
  },
];

const DEFAULT_WIDGETS = [
  'mission-scores',
  'habits-today',
  'goals-progress',
  'finance-snapshot',
  'ai-coach',
  'quote',
  'gratitude',
  'upcoming',
];

function defaultSettings(): AppSettings {
  const now = new Date().toISOString();
  return {
    id: 'app',
    theme: 'system',
    currency: 'KES',
    wakeTime: '04:30',
    sleepTarget: '21:30',
    sidebarCollapsed: false,
    sidebarAccordionMode: 'single',
    dashboardWidgets: DEFAULT_WIDGETS,
    locale: 'en-KE',
    notificationsEnabled: true,
    updatedAt: now,
  };
}

export async function seedDefaultsIfEmpty(): Promise<void> {
  await db.open();

  await db.transaction(
    'rw',
    db.habits,
    db.quotes,
    db.achievements,
    db.settings,
    async () => {
      const [habitCount, quoteCount, achievementCount, settingsCount] =
        await Promise.all([
          db.habits.count(),
          db.quotes.count(),
          db.achievements.count(),
          db.settings.count(),
        ]);

      const now = new Date().toISOString();

      if (habitCount === 0) {
        const habits: Habit[] = DEFAULT_HABIT_NAMES.map((name, index) => {
          const meta = HABIT_META[name];
          return {
            id: `habit-default-${index}`,
            name,
            description: `Default habit: ${name}`,
            icon: meta.icon,
            color: meta.color,
            pillar: meta.pillar,
            frequency: 'daily',
            targetPerDay: name === 'Drink Water' ? 8 : 1,
            archived: false,
            sortOrder: index,
            createdAt: now,
            updatedAt: now,
          };
        });
        await db.habits.bulkPut(habits);
      }

      // Upgrade to the full ~1000 time-aware library when missing or outdated.
      if (quoteCount < QUOTE_CATALOG_COUNT) {
        await db.quotes.clear();
        await db.quotes.bulkPut(QUOTE_CATALOG);
      }

      if (achievementCount === 0) {
        await db.achievements.bulkPut(
          DEFAULT_ACHIEVEMENTS.map((item, index) => ({
            ...item,
            id: `achievement-default-${index}`,
          })),
        );
      }

      if (settingsCount === 0) {
        await db.settings.put(defaultSettings());
      }
    },
  );
}

export function getTable(name: TableName) {
  return db.table(name);
}
