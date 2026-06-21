import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/common/LoadingSpinner";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
      return;
    }
    if (requiredRole && role !== requiredRole) {
      setLocation(role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, role, loading, requiredRole, setLocation]);

  if (loading) return <PageLoader />;
  if (!user) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
