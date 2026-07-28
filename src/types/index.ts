/** Domain types for G4 Mission Control — string ids + ISO date strings. */

export type ThemeMode = 'light' | 'dark' | 'system';
export type SidebarAccordionMode = 'single' | 'multiple';

export type G4Pillar = 'god' | 'goals' | 'grinding' | 'gratitude';

/** Day-part tags for time-aware quote selection. `any` matches every slot. */
export type TimeSlot =
  | 'late_night'
  | 'dawn'
  | 'early_morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'any';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export type TransactionType = 'income' | 'expense' | 'transfer';
export type FinanceCategory =
  | 'salary'
  | 'business'
  | 'freelance'
  | 'gift'
  | 'food'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'savings'
  | 'investment'
  | 'tithe'
  | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type BusinessStatus = 'new' | 'active' | 'paused' | 'completed' | 'closed';
export type BusinessIdeaStatus = 'inbox' | 'exploring' | 'parked' | 'converted';
export type WishlistStatus = 'idea' | 'planned' | 'purchased' | 'dropped';
export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type BookStatus = 'to_read' | 'reading' | 'finished' | 'abandoned';
export type NotificationType = 'info' | 'success' | 'warning' | 'reminder' | 'achievement';
export type AchievementCategory =
  | 'habits'
  | 'fitness'
  | 'finance'
  | 'learning'
  | 'spiritual'
  | 'business'
  | 'general';

export type CalendarEventType =
  | 'meeting'
  | 'focus'
  | 'workout'
  | 'prayer'
  | 'study'
  | 'personal'
  | 'deadline'
  | 'other'
  | 'task'
  | 'event'
  | 'birthday'
  | 'appointment';

export type ActivityEntity =
  | 'habit'
  | 'goal'
  | 'task'
  | 'finance'
  | 'health'
  | 'learning'
  | 'spiritual'
  | 'business'
  | 'note'
  | 'checkin'
  | 'coach'
  | 'covenant'
  | 'warroom'
  | 'system';

export type CovenantDuration = 7 | 21 | 40;
export type CovenantStatus = 'active' | 'completed' | 'broken' | 'sealed';

/** Persisted AI Coach chat turn (local-only). */
export interface CoachChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  intent?: string;
  createdAt: string;
}

export type NoteType = 'idea' | 'note' | 'insight' | 'decision' | 'reminder';

export interface Note {
  id: string;
  title: string;
  body: string;
  type: NoteType;
  pillar?: G4Pillar;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  mood: number;
  energy: number;
  focus: number;
  wins: string;
  blockers: string;
  tomorrowPriority: string;
  gratefulFor?: string;
  prayerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  motto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  pillar?: G4Pillar;
  frequency: HabitFrequency;
  targetPerDay: number;
  reminderTime?: string;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
  notes?: string;
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  pillar?: G4Pillar;
  status: GoalStatus;
  progress: number;
  targetDate?: string;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

/** One row per goal per calendar day — history for weekly rollups. */
export interface GoalDayLog {
  id: string;
  goalId: string;
  /** Local calendar day YYYY-MM-DD */
  date: string;
  /** Goal progress % recorded that day */
  progress: number;
  previousProgress: number;
  delta: number;
  /** User marked intentional work on this goal today */
  worked: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  goalId?: string;
  projectId?: string;
  tags: string[];
  subtasks?: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthMetric {
  id: string;
  date: string;
  sleepHours?: number;
  waterMl?: number;
  steps?: number;
  energy?: number;
  mood?: number;
  /** Optional daily weight snapshot (kg). Prefer bodyMeasurements for trends. */
  weightKg?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  /** SpO2 blood oxygen percentage (modern pulse-ox reading). */
  spo2Pct?: number;
  temperatureC?: number;
  bloodSugar?: number;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
  createdAt: string;
}

export interface StreakCovenant {
  id: string;
  name: string;
  vow: string;
  durationDays: CovenantDuration;
  startDate: string;
  endDate: string;
  status: CovenantStatus;
  habitIds: string[];
  checkIns: { date: string; kept: boolean; note?: string }[];
  sealedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BodyPhoto {
  id: string;
  date: string;
  /** data URL (jpeg/webp) — local only */
  imageData: string;
  weightKg?: number;
  waistCm?: number;
  bmi?: number;
  notes?: string;
  createdAt: string;
}

export interface FaithGrindLink {
  id: string;
  habitId: string;
  scripture: string;
  reflectionPrompt: string;
  active: boolean;
  unlockCount: number;
  lastUnlockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarRoomSession {
  id: string;
  weekKey: string;
  score: number;
  callsign: string;
  debrief: string;
  rewardTitle: string;
  rewardEarned: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  calories?: number;
  intensity?: 'easy' | 'moderate' | 'hard';
  notes?: string;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  heightCm?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  neckCm?: number;
  notes?: string;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: FinanceCategory;
  description?: string;
  date: string;
  account?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  category: FinanceCategory;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  currency: string;
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Liability {
  id: string;
  name: string;
  category: string;
  balance: number;
  currency: string;
  interestRate?: number;
  dueDate?: string;
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  status: BusinessStatus;
  revenueYtd: number;
  expenseNotes?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessIdea {
  id: string;
  businessId?: string;
  title: string;
  description?: string;
  status: BusinessIdeaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProject {
  id: string;
  businessId: string;
  clientId?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  budget?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  projectId?: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  estimatedCost?: number;
  savedAmount?: number;
  currency: string;
  priority: TaskPriority;
  status: WishlistStatus;
  url?: string;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  provider?: string;
  status: CourseStatus;
  progress: number;
  totalHours?: number;
  hoursCompleted: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  status: BookStatus;
  totalPages?: number;
  currentPage: number;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSession {
  id: string;
  date: string;
  topic: string;
  durationMinutes: number;
  courseId?: string;
  bookId?: string;
  notes?: string;
  createdAt: string;
}

export interface PrayerLog {
  id: string;
  date: string;
  morning: boolean;
  evening: boolean;
  notes?: string;
  createdAt: string;
}

export interface BibleReading {
  id: string;
  date: string;
  passage: string;
  completed: boolean;
  reflection?: string;
  createdAt: string;
}

export interface SpiritualEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  details?: string;
  answered: boolean;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  biggestWin?: string;
  lessonLearned?: string;
  tomorrowBetter?: string;
  mood?: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: number;
  energy?: number;
  stress?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  color?: string;
  recurringWeekly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  threshold: number;
  pillar?: G4Pillar;
}

export interface UnlockedAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  seen: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  theme: ThemeMode;
  currency: string;
  wakeTime: string;
  sleepTarget: string;
  sidebarCollapsed: boolean;
  sidebarAccordionMode: SidebarAccordionMode;
  dashboardWidgets: string[];
  locale: string;
  notificationsEnabled: boolean;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  entity: ActivityEntity;
  action: string;
  summary: string;
  entityId?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  pillar?: G4Pillar;
  /** Time windows this quote prefers. Empty/`any` = always eligible. */
  slots?: TimeSlot[];
  tags: string[];
}

/** Compact read-only scorecard for accountability sharing (no private journals). */
export interface AccountabilityCard {
  v: 1;
  name: string;
  callsign: string;
  weekKey: string;
  overall: number;
  god: number;
  goals: number;
  grinding: number;
  gratitude: number;
  habitsDone: number;
  habitsTarget: number;
  note?: string;
  generatedAt: string;
}
