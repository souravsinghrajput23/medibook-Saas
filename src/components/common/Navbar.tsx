import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Stethoscope, LogOut, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/app";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out successfully" });
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-blue-600 ${
        location === href ? "text-blue-600" : "text-gray-600"
      }`}
      data-testid={`link-nav-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" data-testid="link-nav-home">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLink("/", "Home")}
            {navLink("/doctors", "Doctors")}
            {user && role === "patient" && navLink("/dashboard", "My Appointments")}
            {user && role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                data-testid="link-nav-admin"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={role === "admin" ? "/admin" : "/dashboard"}
                  data-testid="link-nav-dashboard"
                >
                  <Button variant="ghost" size="sm" className="gap-2">
                    {role === "admin" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <LayoutDashboard className="h-4 w-4" />
                    )}
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-gray-600"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" data-testid="link-nav-login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register" data-testid="link-nav-register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Home</Link>
          <Link href="/doctors" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Doctors</Link>
          {user && role === "patient" && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">My Appointments</Link>
          )}
          {user && role === "admin" && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-purple-600">Admin Dashboard</Link>
          )}
          {user ? (
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="block w-full text-left py-2 text-sm text-red-600"
            >
              Logout
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
