import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { User, Calendar, ChevronRight, Radio, Download, FileText, FileSpreadsheet } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppointmentCard } from "@/components/appointment/AppointmentCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getMyAppointments, cancelMyAppointment } from "@/services/appointments";
import { supabase } from "@/lib/supabase";
import { exportAppointmentsCSV, exportAppointmentsPDF } from "@/lib/exportAppointments";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed ✓",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function PatientDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getMyAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Supabase Realtime subscription ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`patient-appointments-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Appointment;
          setAppointments((prev) =>
            prev.map((a) => a.id === updated.id ? { ...a, ...updated } : a)
          );
          const newStatus = updated.status as AppointmentStatus;
          const label = STATUS_LABELS[newStatus] ?? newStatus;
          toast({
            title: `Appointment ${label}`,
            description: `Your appointment status has been updated to "${label}" by the clinic.`,
            variant: newStatus === "cancelled" ? "destructive" : "default",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` },
        () => { load(); }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [user?.id, load, toast]);

  const handleCancel = async (id: string) => {
    try {
      await cancelMyAppointment(id);
      toast({ title: "Appointment cancelled" });
      load();
    } catch {
      toast({ title: "Failed to cancel", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (appointments.length === 0) {
      toast({ title: "Nothing to export", description: "You have no appointments yet.", variant: "destructive" });
      return;
    }
    setExporting("csv");
    try {
      exportAppointmentsCSV(
        appointments,
        `medibook-appointments-${new Date().toISOString().slice(0, 10)}.csv`
      );
      toast({ title: "CSV downloaded", description: `${appointments.length} appointments exported.` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (appointments.length === 0) {
      toast({ title: "Nothing to export", description: "You have no appointments yet.", variant: "destructive" });
      return;
    }
    setExporting("pdf");
    try {
      await exportAppointmentsPDF(
        appointments,
        profile?.full_name ?? "Patient",
        `medibook-appointments-${new Date().toISOString().slice(0, 10)}.pdf`
      );
      toast({ title: "PDF downloaded", description: `${appointments.length} appointments exported.` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const upcoming = appointments.filter((a) => ["pending", "confirmed", "rescheduled"].includes(a.status));
  const past = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  return (
    <ProtectedRoute requiredRole="patient">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Profile summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile?.full_name ?? "Patient"}</p>
                <p className="text-sm text-gray-500">{profile?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live indicator */}
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                  isLive ? "text-green-700 bg-green-50 border-green-200" : "text-gray-400 bg-gray-50 border-gray-200"
                }`}
              >
                <Radio className={`h-3 w-3 ${isLive ? "animate-pulse text-green-500" : "text-gray-400"}`} />
                {isLive ? "Live" : "Connecting..."}
              </div>

              {/* Export buttons */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-gray-600"
                onClick={handleExportCSV}
                disabled={exporting !== null}
                title="Export as CSV spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                {exporting === "csv" ? "Exporting…" : "CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-gray-600"
                onClick={handleExportPDF}
                disabled={exporting !== null}
                title="Export as PDF report"
              >
                <FileText className="h-3.5 w-3.5 text-red-500" />
                {exporting === "pdf" ? "Exporting…" : "PDF"}
              </Button>

              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="gap-1" data-testid="link-edit-profile">
                  Edit Profile <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Live updates info banner */}
          {isLive && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <Radio className="h-3.5 w-3.5 animate-pulse text-green-500 flex-shrink-0" />
              <span>
                <strong>Real-time updates active</strong> — your appointment status will update automatically when the clinic confirms or changes it.
              </span>
            </div>
          )}

          {/* Export summary row */}
          {!loading && appointments.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{appointments.length}</span> total appointment{appointments.length !== 1 ? "s" : ""} on record
              </p>
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">Download history:</span>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting !== null}
                  className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  CSV
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting !== null}
                  className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  PDF
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : (
            <>
              {/* Upcoming */}
              <section>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Upcoming Appointments
                  {upcoming.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full w-5 h-5">
                      {upcoming.length}
                    </span>
                  )}
                </h2>
                {upcoming.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="h-10 w-10" />}
                    title="No upcoming appointments"
                    description="Book an appointment with one of our doctors."
                    action={
                      <Link href="/doctors">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Find a Doctor</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />)}
                  </div>
                )}
              </section>

              {/* Past */}
              {past.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Past Appointments</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {past.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
                  </div>
                </section>
              )}

              {/* Cancelled */}
              {cancelled.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Cancelled</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cancelled.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
