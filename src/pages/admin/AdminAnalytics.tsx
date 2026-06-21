import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Clock, PieChart as PieIcon } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAllAppointments } from "@/services/appointments";
import type { Appointment } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function last30Days() {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: typeof TrendingUp; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-5">
        <Icon className="h-4 w-4 text-blue-600" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminAnalytics() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  // --- Derived data ---

  // 1. Appointments per day (last 30 days)
  const trendData = useMemo(() => {
    const days = last30Days();
    const counts: Record<string, number> = {};
    days.forEach((d) => (counts[d] = 0));
    appointments.forEach((a) => {
      const day = a.created_at?.split("T")[0];
      if (day && counts[day] !== undefined) counts[day]++;
    });
    return days.map((d) => ({ date: formatDate(d), count: counts[d] }));
  }, [appointments]);

  // 2. Revenue by doctor (completed appointments only, by consultation fee)
  const revenueByDoctor = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((a) => {
      if (a.status === "completed" && a.doctor) {
        const name = a.doctor.name;
        map[name] = (map[name] ?? 0) + (a.doctor.consultation_fee ?? 0);
      }
    });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name: name.replace("Dr. ", ""), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [appointments]);

  // 3. Status breakdown (pie chart)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach((a) => { if (a.status in counts) counts[a.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value,
        color: STATUS_COLORS[status],
      }));
  }, [appointments]);

  // 4. Peak booking hours (by slot start time)
  const peakHours = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => {
      const t = a.slot?.start_time?.slice(0, 5);
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [appointments]);

  // Summary numbers
  const totalRevenue = useMemo(
    () => appointments.filter((a) => a.status === "completed").reduce((s, a) => s + (a.doctor?.consultation_fee ?? 0), 0),
    [appointments]
  );
  const completionRate = appointments.length
    ? Math.round((appointments.filter((a) => a.status === "completed").length / appointments.length) * 100)
    : 0;

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Analytics</h1>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <PieIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No appointment data yet</p>
            <p className="text-xs text-gray-400 mt-1">Charts will appear once appointments are booked.</p>
          </div>
        ) : (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Appointments", value: appointments.length, suffix: "" },
                { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, suffix: "" },
                { label: "Completion Rate", value: completionRate, suffix: "%" },
                { label: "Unique Doctors", value: new Set(appointments.map((a) => a.doctor_id)).size, suffix: "" },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Row 1: Trend + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <SectionCard title="Appointments — Last 30 Days" icon={TrendingUp}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trendData} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        cursor={{ fill: "#eff6ff" }}
                      />
                      <Bar dataKey="count" name="Appointments" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>

              <SectionCard title="Status Breakdown" icon={PieIcon}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={72}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Row 2: Revenue + Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Revenue by Doctor (Completed)" icon={DollarSign}>
                {revenueByDoctor.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">No completed appointments yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={revenueByDoctor}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        formatter={(v: number) => [`$${v}`, "Revenue"]}
                        cursor={{ fill: "#f0fdf4" }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              <SectionCard title="Peak Booking Hours" icon={Clock}>
                {peakHours.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">No slot data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={peakHours} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        formatter={(v: number) => [v, "Appointments"]}
                        cursor={{ fill: "#faf5ff" }}
                      />
                      <Bar dataKey="count" name="Appointments" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
