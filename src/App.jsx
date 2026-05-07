// [Merge conflict resolved: removed all conflict markers and duplicate/commented dead code]
// No code needed in this section; relevant code is below in the file.
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PatientList from "./components/PatientList.jsx";
import AddPatient from "./components/AddPatient.jsx";
import EditPatient from "./components/EditPatient.jsx";
import PatientProfile from "./components/PatientProfile.jsx";
import ProcessingReports from "./components/ProcessingReports.jsx";
import DiagnoSense from "./components/DiagnoSense.jsx";
import GoogleCallback from "./components/GoogleCallback.jsx";
import EvidencePanel from './components/EvidencePanel';
import Settings from './components/Settings.jsx';
import Subscription from './components/subscription.jsx';
import Integration from "./components/integration.jsx";
import Support from "./components/support.jsx";
import "./App.css";
import { SidebarProvider } from "./components/SidebarContext";
import { SubscriptionProvider } from "./components/SubscriptionContext";
import { NotificationsProvider } from "./components/NotificationsContext";
import NotificationsPanel from "./components/NotificationsPanel";
import { getCookie, setCookie } from "./components/cookieUtils";
import { ThemeProvider } from "./components/ThemeContext";
import { PageCacheProvider } from "./components/PageCacheContext";

const ProtectedRoute = ({ children }) => {
  const token = getCookie("user_token");
  return token ? children : <Navigate to="/login" />;
};

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SubscriptionProvider>
          <NotificationsProvider>
            <Outlet />
            <NotificationsPanel />
          </NotificationsProvider>
        </SubscriptionProvider>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

/**
 * OAuthHashHandler
 *
 * Checks for Google auth tokens in the URL hash on every route load.
 * This is necessary because the backend may redirect to the root URL (/)
 * with the token in the hash (e.g., localhost:5173/#token=...).
 */
const OAuthHashHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const token =
      hashParams.get("token") ||
      hashParams.get("access_token") ||
      hashParams.get("auth_token");

    if (token) {
      console.log("[OAuthHashHandler] Token found in hash, authenticating...");

      // Store token identically to normal login
      setCookie("user_token", token, 7);
      setCookie("isAuthenticated", "true", 7);

      // Clear token from URL to keep it clean and prevent re-processing
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
    <PageCacheProvider>
    <BrowserRouter>
      <OAuthHashHandler />
      <Routes>
        <Route path="/" element={<DiagnoSense />} />

        <Route path="/home" element={<DiagnoSense />} />

        <Route path="/login" element={<AuthPage />} />

        <Route path="/loading" element={<ProcessingReports />} />
        <Route path="/evidence" element={<EvidencePanel />} />
        <Route path="/integration" element={<Integration />} />

        {/* Google OAuth callback - backend redirects here after sign in */}
        <Route path="/google-callback" element={<GoogleCallback />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Global Authenticated Layout */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/addpatient" element={<AddPatient />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/patient-profile" element={<PatientProfile />} />
          <Route path="/patient-profile/:patientId" element={<PatientProfile />} />
          <Route path="/edit-patient/:patientId" element={<EditPatient />} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </PageCacheProvider>
    </ThemeProvider>
  );
}

export default App;

