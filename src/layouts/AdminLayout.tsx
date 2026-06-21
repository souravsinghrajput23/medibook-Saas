import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  UserRound,
  Calendar,
  CalendarCheck,
  Users,
  BarChart2,
  LogOut,
  Stethoscope,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/app";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", icon: UserRound },
  { href: "/admin/availability", label: "Availability", icon: Calendar },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { logout, profile } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out successfully" });
  };

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) => {
    const isActive = location === href;
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        data-testid={`link-admin-nav-${label.toLowerCase()}`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {label}
        {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-blue-500" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="bg-blue-600 rounded-lg p-1.5">
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{APP_CONFIG.name}</p>
          <p className="text-xs text-purple-600 font-medium">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2 text-xs text-gray-400 truncate">
          {profile?.full_name ?? "Admin"}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            data-testid="button-admin-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Admin Dashboard</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
