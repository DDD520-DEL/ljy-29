import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import DashboardPage from "@/pages/DashboardPage";
import TimerPage from "@/pages/TimerPage";
import RecordsPage from "@/pages/RecordsPage";
import RecordDetailPage from "@/pages/RecordDetailPage";
import AnalysisPage from "@/pages/AnalysisPage";
import ComparisonPage from "@/pages/ComparisonPage";
import IntersectionsPage from "@/pages/IntersectionsPage";
import IntersectionDetailPage from "@/pages/IntersectionDetailPage";
import SignalTimingEditPage from "@/pages/SignalTimingEditPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import FavoritesPage from "@/pages/FavoritesPage";
import WeeklyReportPage from "@/pages/WeeklyReportPage";
import HelpPage from "@/pages/HelpPage";
import { BottomNavigation } from "@/components/BottomNavigation";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { useDataStore } from "@/store/useDataStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useNotification } from "@/hooks/useNotification";

function AppContent() {
  const { initData, reminders } = useDataStore();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isVisible,
    hasCompletedOnboarding,
    currentStepIndex,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    getCurrentStep,
    getTotalSteps,
    isFirstStep,
    isLastStep,
  } = useOnboardingStore();

  const currentStep = getCurrentStep();
  const totalSteps = getTotalSteps();

  useNotification(reminders);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (!isVisible || hasCompletedOnboarding) return;

    if (currentStep === 'timer') {
      navigate('/timer');
    } else if (currentStep === 'records') {
      navigate('/records');
    } else if (currentStep === 'analysis') {
      navigate('/analysis');
    }
  }, [currentStep, isVisible, hasCompletedOnboarding, navigate]);

  const hideBottomNav = (location.pathname.startsWith('/records/') && location.pathname !== '/records')
    || (location.pathname.startsWith('/intersections/') && location.pathname !== '/intersections');

  const showOnboarding = isVisible && !hasCompletedOnboarding && !hideBottomNav;

  return (
    <div className="min-h-screen bg-slate-900">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/intersections" element={<IntersectionsPage />} />
        <Route path="/intersections/:id" element={<IntersectionDetailPage />} />
        <Route path="/intersections/:id/signal-timing" element={<SignalTimingEditPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/weekly-report" element={<WeeklyReportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      {!hideBottomNav && <BottomNavigation />}
      {showOnboarding && (
        <OnboardingOverlay
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          isFirstStep={isFirstStep()}
          isLastStep={isLastStep()}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
