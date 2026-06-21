import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabaseConfigured } from "@/lib/supabase";

import SetupScreen from "@/pages/SetupScreen";
import NotFound from "@/pages/NotFound";
import HomePage from "@/pages/HomePage";
import DoctorsPage from "@/pages/DoctorsPage";
import DoctorDetailPage from "@/pages/DoctorDetailPage";
import BookingPage from "@/pages/BookingPage";
import BookingSuccessPage from "@/pages/BookingSuccessPage";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientProfilePage from "@/pages/patient/PatientProfilePage";

import AdminOverview from "@/pages/admin/AdminOverview";
import AdminDoctors from "@/pages/admin/AdminDoctors";
import AdminAvailability from "@/pages/admin/AdminAvailability";
import AdminAppointments from "@/pages/admin/AdminAppointments";
import AdminPatients from "@/pages/admin/AdminPatients";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";

if (!supabaseConfigured) {
  // Render setup screen without router
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/doctors" component={DoctorsPage} />
      <Route path="/doctors/:doctorId" component={DoctorDetailPage} />
      <Route path="/book/:doctorId" component={BookingPage} />
      <Route path="/booking-success/:appointmentId" component={BookingSuccessPage} />

      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      <Route path="/dashboard" component={PatientDashboard} />
      <Route path="/dashboard/profile" component={PatientProfilePage} />
      <Route path="/dashboard/appointments" component={PatientDashboard} />

      <Route path="/admin" component={AdminOverview} />
      <Route path="/admin/doctors" component={AdminDoctors} />
      <Route path="/admin/availability" component={AdminAvailability} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      <Route path="/admin/patients" component={AdminPatients} />
      <Route path="/admin/analytics" component={AdminAnalytics} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  if (!supabaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <AuthProvider>
      <WouterRouter base={""}>
        <Router />
      </WouterRouter>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
