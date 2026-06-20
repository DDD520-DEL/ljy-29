import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import TimerPage from "@/pages/TimerPage";
import RecordsPage from "@/pages/RecordsPage";
import AnalysisPage from "@/pages/AnalysisPage";
import IntersectionsPage from "@/pages/IntersectionsPage";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useDataStore } from "@/store/useDataStore";

function AppContent() {
  const { initData } = useDataStore();

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/intersections" element={<IntersectionsPage />} />
      </Routes>
      <BottomNavigation />
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
