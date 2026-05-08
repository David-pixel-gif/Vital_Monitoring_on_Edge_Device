import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { VitalPulseProvider } from "./context/VitalPulseContext";
import AlertsPage from "./pages/AlertsPage";
import DevicesPage from "./pages/DevicesPage";
import LiveMonitorPage from "./pages/LiveMonitorPage";
import OverviewPage from "./pages/OverviewPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import PatientHistoryPage from "./pages/PatientHistoryPage";
import PatientsPage from "./pages/PatientsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <VitalPulseProvider>
        <Routes>
          <Route path="/" element={<LiveMonitorPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/monitoring" element={<LiveMonitorPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/history" element={<PatientHistoryPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </VitalPulseProvider>
    </BrowserRouter>
  );
}
