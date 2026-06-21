import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllAppointments, adminConfirmAppointment, adminCancelAppointment, adminCompleteAppointment, adminRescheduleAppointment } from "@/services/appointments";
import { getAllDoctors } from "@/services/doctors";
import { getAvailableSlots } from "@/services/slots";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Doctor, AvailabilitySlot, AppointmentStatus } from "@/types";

const STATUS_OPTIONS: { value: AppointmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export default function AdminAppointments() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [doctorFilter, setDoctorFilter] = useState("all");

  const [confirmTarget, setConfirmTarget] = useState<{ action: string; id: string } | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<Appointment | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getAllAppointments({ search: search || undefined, status: statusFilter, doctorId: doctorFilter })
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(() => { getAllDoctors().then(setDoctors); }, []);
  useEffect(() => { load(); }, [search, statusFilter, doctorFilter]);

  const doAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
      load();
    } catch (e: unknown) {
      toast({ title: "Action failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setActionLoading(false);
      setConfirmTarget(null);
    }
  };

  const handleConfirm = () => doAction(async () => {
    await adminConfirmAppointment(confirmTarget!.id);
    toast({ title: "Appointment confirmed" });
  });

  const handleCancel = () => doAction(async () => {
    await adminCancelAppointment(confirmTarget!.id);
    toast({ title: "Appointment cancelled" });
  });

  const handleComplete = () => doAction(async () => {
    await adminCompleteAppointment(confirmTarget!.id);
    toast({ title: "Appointment marked as completed" });
  });

  const openReschedule = async (appt: Appointment) => {
    setRescheduleModal(appt);
    setSelectedNewSlot(null);
    const slots = await getAvailableSlots(appt.doctor_id);
    setRescheduleSlots(slots.filter((s) => s.id !== appt.slot_id));
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !selectedNewSlot) return;
    setActionLoading(true);
    try {
      await adminRescheduleAppointment(rescheduleModal.id, selectedNewSlot);
      toast({ title: "Appointment rescheduled" });
      setRescheduleModal(null);
      load();
    } catch (e: unknown) {
      toast({ title: "Reschedule failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Appointments</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search patient or reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-appointments" />
          </div>
          <select className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "all")} data-testid="select-status-filter">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
            <option value="all">All Doctors</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Reference</th>
                    <th className="text-left px-4 py-3 font-medium">Patient</th>
                    <th className="text-left px-4 py-3 font-medium">Phone</th>
                    <th className="text-left px-4 py-3 font-medium">Doctor</th>
                    <th className="text-left px-4 py-3 font-medium">Date / Time</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-appt-${a.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{a.booking_reference}</td>
                      <td className="px-4 py-3 text-gray-700">{a.patient_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.patient_phone}</td>
                      <td className="px-4 py-3 text-gray-700">{a.doctor?.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {a.slot ? `${a.slot.slot_date} ${a.slot.start_time}` : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {a.status === "pending" && (
                            <button onClick={() => setConfirmTarget({ action: "confirm", id: a.id })} className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium" data-testid={`button-confirm-${a.id}`}>Confirm</button>
                          )}
                          {["pending", "confirmed", "rescheduled"].includes(a.status) && (
                            <>
                              <button onClick={() => openReschedule(a)} className="px-2 py-1 rounded text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium" data-testid={`button-reschedule-${a.id}`}>Reschedule</button>
                              <button onClick={() => setConfirmTarget({ action: "cancel", id: a.id })} className="px-2 py-1 rounded text-xs bg-red-50 text-red-600 hover:bg-red-100 font-medium" data-testid={`button-cancel-${a.id}`}>Cancel</button>
                            </>
                          )}
                          {a.status === "confirmed" && (
                            <button onClick={() => setConfirmTarget({ action: "complete", id: a.id })} className="px-2 py-1 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 font-medium" data-testid={`button-complete-${a.id}`}>Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No appointments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmTarget?.action === "confirm"}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
          title="Confirm Appointment"
          description="Mark this appointment as confirmed?"
          confirmLabel="Confirm"
          onConfirm={handleConfirm}
        />
        <ConfirmDialog
          open={confirmTarget?.action === "cancel"}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
          title="Cancel Appointment"
          description="Are you sure you want to cancel this appointment?"
          confirmLabel="Cancel Appointment"
          variant="destructive"
          onConfirm={handleCancel}
        />
        <ConfirmDialog
          open={confirmTarget?.action === "complete"}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
          title="Mark as Completed"
          description="Mark this appointment as completed?"
          confirmLabel="Mark Completed"
          onConfirm={handleComplete}
        />

        {/* Reschedule modal */}
        {rescheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Reschedule Appointment</h2>
                <button onClick={() => setRescheduleModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">Select a new available slot for {rescheduleModal.patient_name}</p>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-gray-400">No available slots for this doctor.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-5 max-h-60 overflow-y-auto">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedNewSlot(slot.id)}
                        className={`p-2 rounded-lg border text-xs text-left ${selectedNewSlot === slot.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:border-blue-300"}`}
                        data-testid={`button-reschedule-slot-${slot.id}`}
                      >
                        <div className="font-medium">{slot.slot_date}</div>
                        <div>{slot.start_time}</div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setRescheduleModal(null)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedNewSlot || actionLoading} onClick={handleReschedule} data-testid="button-confirm-reschedule">
                    {actionLoading ? "Rescheduling..." : "Reschedule"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
