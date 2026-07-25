import type {
  Achievement,
  ActivityLog,
  AppSettings,
  Asset,
  AuthCredentials,
  BibleReading,
  BodyMeasurement,
  BodyPhoto,
  Book,
  Budget,
  Business,
  BusinessIdea,
  BusinessProject,
  CalendarEvent,
  Client,
  CoachChatMessage,
  Course,
  DailyCheckIn,
  FaithGrindLink,
  FinanceTransaction,
  Goal,
  GratitudeEntry,
  Habit,
  HabitLog,
  HealthMetric,
  Invoice,
  JournalEntry,
  LearningSession,
  Liability,
  Note,
  NotificationItem,
  PrayerLog,
  PrayerRequest,
  Quote,
  SavingsGoal,
  SpiritualEntry,
  StreakCovenant,
  Task,
  UnlockedAchievement,
  UserProfile,
  WarRoomSession,
  WishlistItem,
  Workout,
} from '@/types';

/** Table map for typed Dexie access. */
export interface G4Tables {
  credentials: AuthCredentials;
  profiles: UserProfile;
  habits: Habit;
  habitLogs: HabitLog;
  goals: Goal;
  tasks: Task;
  healthMetrics: HealthMetric;
  workouts: Workout;
  bodyMeasurements: BodyMeasurement;
  transactions: FinanceTransaction;
  budgets: Budget;
  savingsGoals: SavingsGoal;
  assets: Asset;
  liabilities: Liability;
  businesses: Business;
  clients: Client;
  businessProjects: BusinessProject;
  invoices: Invoice;
  businessIdeas: BusinessIdea;
  wishlist: WishlistItem;
  courses: Course;
  books: Book;
  learningSessions: LearningSession;
  prayerLogs: PrayerLog;
  bibleReadings: BibleReading;
  spiritualEntries: SpiritualEntry;
  prayerRequests: PrayerRequest;
  gratitudeEntries: GratitudeEntry;
  journalEntries: JournalEntry;
  calendarEvents: CalendarEvent;
  notes: Note;
  dailyCheckIns: DailyCheckIn;
  coachMessages: CoachChatMessage;
  achievements: Achievement;
  unlockedAchievements: UnlockedAchievement;
  notifications: NotificationItem;
  settings: AppSettings;
  activityLogs: ActivityLog;
  quotes: Quote;
  streakCovenants: StreakCovenant;
  bodyPhotos: BodyPhoto;
  faithGrindLinks: FaithGrindLink;
  warRoomSessions: WarRoomSession;
}

export type TableName = keyof G4Tables;

type LegacyTables = Exclude<
  TableName,
  | 'businessIdeas'
  | 'prayerRequests'
  | 'notes'
  | 'dailyCheckIns'
  | 'coachMessages'
  | 'streakCovenants'
  | 'bodyPhotos'
  | 'faithGrindLinks'
  | 'warRoomSessions'
>;

/** Dexie index definitions for version 1. */
export const SCHEMA_V1: Record<LegacyTables, string> = {
  credentials: 'id, username',
  profiles: 'id, username',
  habits: 'id, archived, sortOrder, pillar',
  habitLogs: 'id, habitId, date, [habitId+date]',
  goals: 'id, status, pillar',
  tasks: 'id, status, priority, dueDate, goalId',
  healthMetrics: 'id, date',
  workouts: 'id, date, type',
  bodyMeasurements: 'id, date',
  transactions: 'id, type, category, date',
  budgets: 'id, category, period',
  savingsGoals: 'id, name',
  assets: 'id, category',
  liabilities: 'id, category',
  businesses: 'id, name',
  clients: 'id, businessId, name',
  businessProjects: 'id, businessId, clientId, status',
  invoices: 'id, businessId, clientId, status, dueDate',
  wishlist: 'id, status, priority',
  courses: 'id, status',
  books: 'id, status',
  learningSessions: 'id, date, courseId, bookId',
  prayerLogs: 'id, date',
  bibleReadings: 'id, date',
  spiritualEntries: 'id, date',
  gratitudeEntries: 'id, date',
  journalEntries: 'id, date',
  calendarEvents: 'id, type, start, end',
  achievements: 'id, key, category',
  unlockedAchievements: 'id, achievementId, unlockedAt',
  notifications: 'id, type, read, createdAt',
  settings: 'id',
  activityLogs: 'id, entity, createdAt',
  quotes: 'id, author, pillar',
};

/** Version 2 adds business ideas, prayer requests, and business status index. */
export const SCHEMA_V2: Record<
  Exclude<
    TableName,
    | 'notes'
    | 'dailyCheckIns'
    | 'coachMessages'
    | 'streakCovenants'
    | 'bodyPhotos'
    | 'faithGrindLinks'
    | 'warRoomSessions'
  >,
  string
> = {
  ...SCHEMA_V1,
  businesses: 'id, name, status',
  businessIdeas: 'id, businessId, status, createdAt',
  prayerRequests: 'id, answered, createdAt',
};

/** Version 3 adds Notes Vault + Daily Check-ins. */
export const SCHEMA_V3: Record<
  Exclude<
    TableName,
    | 'coachMessages'
    | 'streakCovenants'
    | 'bodyPhotos'
    | 'faithGrindLinks'
    | 'warRoomSessions'
  >,
  string
> = {
  ...SCHEMA_V2,
  notes: 'id, type, pinned, updatedAt, createdAt',
  dailyCheckIns: 'id, date',
};

/** Version 4 adds AI Coach chat history. */
export const SCHEMA_V4: Record<
  Exclude<
    TableName,
    'streakCovenants' | 'bodyPhotos' | 'faithGrindLinks' | 'warRoomSessions'
  >,
  string
> = {
  ...SCHEMA_V3,
  coachMessages: 'id, role, createdAt',
};

/** Version 5 — covenants, body photos, faith×grind, war room. */
export const SCHEMA_V5: Record<TableName, string> = {
  ...SCHEMA_V4,
  streakCovenants: 'id, status, startDate, endDate',
  bodyPhotos: 'id, date, createdAt',
  faithGrindLinks: 'id, habitId, active, createdAt',
  warRoomSessions: 'id, weekKey, createdAt',
};

/** Version 6 — index createdAt on covenants for stable listing. */
export const SCHEMA_V6: Record<TableName, string> = {
  ...SCHEMA_V5,
  streakCovenants: 'id, status, startDate, endDate, createdAt',
};
