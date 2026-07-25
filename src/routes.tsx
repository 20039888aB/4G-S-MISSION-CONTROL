import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/errors/RouteErrorBoundary';
import { Skeleton } from '@/components/ui';
import { AppLayout } from '@/layouts/AppLayout';
import { lazyRetry } from '@/lib/lazyRetry';

const SetupPage = lazyRetry(() => import('@/pages/auth/SetupPage'));
const LoginPage = lazyRetry(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazyRetry(() => import('@/pages/dashboard/DashboardPage'));
const HabitsPage = lazyRetry(() => import('@/pages/habits/HabitsPage'));
const GoalsPage = lazyRetry(() => import('@/pages/goals/GoalsPage'));
const TasksPage = lazyRetry(() => import('@/pages/tasks/TasksPage'));
const HealthPage = lazyRetry(() => import('@/pages/health/HealthPage'));
const FinancePage = lazyRetry(() => import('@/pages/finance/FinancePage'));
const BusinessPage = lazyRetry(() => import('@/pages/business/BusinessPage'));
const WishlistPage = lazyRetry(() => import('@/pages/wishlist/WishlistPage'));
const LearningPage = lazyRetry(() => import('@/pages/learning/LearningPage'));
const SpiritualPage = lazyRetry(() => import('@/pages/spiritual/SpiritualPage'));
const GratitudePage = lazyRetry(() => import('@/pages/gratitude/GratitudePage'));
const JournalPage = lazyRetry(() => import('@/pages/journal/JournalPage'));
const CalendarPage = lazyRetry(() => import('@/pages/calendar/CalendarPage'));
const NotesPage = lazyRetry(() => import('@/pages/notes/NotesPage'));
const DailyReviewPage = lazyRetry(() => import('@/pages/review/DailyReviewPage'));
const AiCoachPage = lazyRetry(() => import('@/pages/ai-coach/AiCoachPage'));
const AchievementsPage = lazyRetry(() => import('@/pages/achievements/AchievementsPage'));
const StatisticsPage = lazyRetry(() => import('@/pages/statistics/StatisticsPage'));
const SettingsPage = lazyRetry(() => import('@/pages/settings/SettingsPage'));
const MissionSystemsPage = lazyRetry(() => import('@/pages/mission/MissionSystemsPage'));
const SharePage = lazyRetry(() => import('@/pages/share/SharePage'));

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
    <RouteErrorBoundary label="Mission Control hit a snag">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<GuestRoute mode="setup" />}>
            <Route path="/setup" element={<SetupPage />} />
          </Route>
          <Route element={<GuestRoute mode="login" />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route path="/share/:payload" element={<SharePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="mission-systems"
                element={
                  <RouteErrorBoundary label="Mission Systems hit a snag">
                    <MissionSystemsPage />
                  </RouteErrorBoundary>
                }
              />
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
    </RouteErrorBoundary>
  );
}
