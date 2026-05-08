import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { VitalPulseProvider, useVitalPulse } from "./context/VitalPulseContext";
import AlertsPage from "./pages/AlertsPage";
import DevicesPage from "./pages/DevicesPage";
import LiveMonitorPage from "./pages/LiveMonitorPage";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import PatientHistoryPage from "./pages/PatientHistoryPage";
import PatientsPage from "./pages/PatientsPage";
import RegisterPage from "./pages/RegisterPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

function RequireAuth({ children }) {
  const location = useLocation();
  const { currentUser, loading } = useVitalPulse();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicOnly({ children }) {
  const { currentUser, loading } = useVitalPulse();

  if (loading) {
    return null;
  }

  if (currentUser) {
    return <Navigate to="/overview" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <VitalPulseProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
          <Route path="/overview" element={<RequireAuth><OverviewPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><OverviewPage /></RequireAuth>} />
          <Route path="/monitoring" element={<RequireAuth><LiveMonitorPage /></RequireAuth>} />
          <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
          <Route path="/patients" element={<RequireAuth><PatientsPage /></RequireAuth>} />
          <Route path="/patients/:id" element={<RequireAuth><PatientDetailPage /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><PatientHistoryPage /></RequireAuth>} />
          <Route path="/devices" element={<RequireAuth><DevicesPage /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </VitalPulseProvider>
    </BrowserRouter>
  );
}
