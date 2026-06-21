import { useState, useEffect } from "react";
import { Users, CalendarCheck, Clock, CheckCircle, Activity } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getAllAppointments, getAdminOverview } from "@/services/appointments";
import type { Appointment } from "@/types";

interface Overview {
  totalDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
}

export default function AdminOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminOverview(), getAllAppointments()])
      .then(([ov, appts]) => {
        setOverview(ov);
        setRecent(appts.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = overview
    ? [
        { label: "Total Doctors", value: overview.totalDoctors, icon: Users, color: "text-blue-600 bg-blue-50" },
        { label: "Pending", value: overview.pendingAppointments, icon: Clock, color: "text-amber-600 bg-amber-50" },
        { label: "Confirmed", value: overview.confirmedAppointments, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
        { label: "Completed", value: overview.completedAppointments, icon: CheckCircle, color: "text-green-600 bg-green-50" },
      ]
    : [];

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Overview</h1>
        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {cards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className={`inline-flex rounded-lg p-2 mb-3 ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-800 text-sm">Recent Appointments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left px-5 py-3 font-medium">Reference</th>
                      <th className="text-left px-5 py-3 font-medium">Patient</th>
                      <th className="text-left px-5 py-3 font-medium">Doctor</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recent.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-appointment-${a.id}`}>
                        <td className="px-5 py-3 font-mono text-xs text-gray-700">{a.booking_reference}</td>
                        <td className="px-5 py-3 text-gray-700">{a.patient_name}</td>
                        <td className="px-5 py-3 text-gray-700">{a.doctor?.name ?? "—"}</td>
                        <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No appointments yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
