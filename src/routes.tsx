import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui';
import { AppLayout } from '@/layouts/AppLayout';

const SetupPage = lazy(() => import('@/pages/auth/SetupPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const HabitsPage = lazy(() => import('@/pages/habits/HabitsPage'));
const GoalsPage = lazy(() => import('@/pages/goals/GoalsPage'));
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage'));
const HealthPage = lazy(() => import('@/pages/health/HealthPage'));
const FinancePage = lazy(() => import('@/pages/finance/FinancePage'));
const BusinessPage = lazy(() => import('@/pages/business/BusinessPage'));
const WishlistPage = lazy(() => import('@/pages/wishlist/WishlistPage'));
const LearningPage = lazy(() => import('@/pages/learning/LearningPage'));
const SpiritualPage = lazy(() => import('@/pages/spiritual/SpiritualPage'));
const GratitudePage = lazy(() => import('@/pages/gratitude/GratitudePage'));
const JournalPage = lazy(() => import('@/pages/journal/JournalPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const NotesPage = lazy(() => import('@/pages/notes/NotesPage'));
const DailyReviewPage = lazy(() => import('@/pages/review/DailyReviewPage'));
const AiCoachPage = lazy(() => import('@/pages/ai-coach/AiCoachPage'));
const AchievementsPage = lazy(() => import('@/pages/achievements/AchievementsPage'));
const StatisticsPage = lazy(() => import('@/pages/statistics/StatisticsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

function RouteFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<GuestRoute mode="setup" />}>
          <Route path="/setup" element={<SetupPage />} />
        </Route>
        <Route element={<GuestRoute mode="login" />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="business" element={<BusinessPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="learning" element={<LearningPage />} />
            <Route path="spiritual" element={<SpiritualPage />} />
            <Route path="gratitude" element={<GratitudePage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="review" element={<DailyReviewPage />} />
            <Route path="ai-coach" element={<AiCoachPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
