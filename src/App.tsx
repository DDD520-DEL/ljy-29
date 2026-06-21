import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from 'react';
import TimerPage from "@/pages/TimerPage";
import RecordsPage from "@/pages/RecordsPage";
import RecordDetailPage from "@/pages/RecordDetailPage";
import AnalysisPage from "@/pages/AnalysisPage";
import ComparisonPage from "@/pages/ComparisonPage";
import IntersectionsPage from "@/pages/IntersectionsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import FavoritesPage from "@/pages/FavoritesPage";
import WeeklyReportPage from "@/pages/WeeklyReportPage";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useDataStore } from "@/store/useDataStore";
import { useNotification } from "@/hooks/useNotification";

function AppContent() {
  const { initData, reminders } = useDataStore();
  const location = useLocation();

  useNotification(reminders);

  useEffect(() => {
    initData();
  }, [initData]);

  const hideBottomNav = location.pathname.startsWith('/records/') && location.pathname !== '/records';

  return (
    <div className="min-h-screen bg-slate-900">
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/intersections" element={<IntersectionsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/weekly-report" element={<WeeklyReportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      {!hideBottomNav && <BottomNavigation />}
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
