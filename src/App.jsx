// [Merge conflict resolved: removed all conflict markers and duplicate/commented dead code]
// No code needed in this section; relevant code is below in the file.
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PatientList from "./components/PatientList.jsx";
import AddPatient from "./components/AddPatient.jsx";
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
import { getCookie, setCookie, setJsonCookie } from "./components/cookieUtils";
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

    console.log("[OAuthHashHandler] current hash:", hash);

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const token =
      hashParams.get("token") ||
      hashParams.get("access_token") ||
      hashParams.get("user_token");

    if (token) {
      console.log("[OAuthHashHandler] token detected:", token);

      // Store token using utility
      setCookie("user_token", token, 7);
      setCookie("isAuthenticated", "true", 7);
      
      // Explicitly set in sessionStorage for fallback
      sessionStorage.setItem("user_token", token);
      sessionStorage.setItem("isAuthenticated", "true");

      // Explicitly set document.cookie for true cookie fallback
      document.cookie = `user_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      document.cookie = `isAuthenticated=true; path=/; max-age=${7 * 24 * 60 * 60}`;

      console.log("[OAuthHashHandler] document.cookie after setCookie:", document.cookie);
      console.log("[OAuthHashHandler] sessionStorage user_token after save:", sessionStorage.getItem("user_token"));

      // If user data is returned in the hash params, save it
      let userStr = hashParams.get("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userStr));
          setJsonCookie("user", userObj, 7);
          sessionStorage.setItem("user", JSON.stringify(userObj));
        } catch (e) {
          console.error("Failed to parse user data from URL:", e);
        }
      }

      // Dispatch authChanged event
      window.dispatchEvent(new CustomEvent("authChanged"));

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
          <Route path="/edit-patient/:patientId" element={<AddPatient />} />
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

