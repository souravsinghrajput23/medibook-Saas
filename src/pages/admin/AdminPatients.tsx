import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getPatients } from "@/services/appointments";

interface Patient {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients().then(setPatients).finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Patients</h1>
        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Phone</th>
                    <th className="text-left px-5 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50" data-testid={`row-patient-${p.id}`}>
                      <td className="px-5 py-3 font-medium text-gray-900">{p.full_name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{p.phone ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(p.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">
                        No patients registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {patients.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
              </div>
            )}
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
