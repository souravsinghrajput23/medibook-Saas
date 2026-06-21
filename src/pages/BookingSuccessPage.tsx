import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle, Calendar, Clock, Hash } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { supabase } from "@/lib/supabase";
import type { Appointment } from "@/types";

export default function BookingSuccessPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) return;
    supabase
      .from("appointments")
      .select("*, doctor:doctors(*), slot:availability_slots(*)")
      .eq("id", appointmentId)
      .single()
      .then(({ data }) => { setAppointment(data); setLoading(false); });
  }, [appointmentId]);

  if (loading) return <PublicLayout><div className="py-20"><LoadingSpinner /></div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Appointment Booked!</h1>
          <p className="text-sm text-gray-500 mb-6">Your appointment has been successfully booked.</p>

          {appointment && (
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 text-sm mb-6">
              <div className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-1.5 text-gray-500"><Hash className="h-3.5 w-3.5" />Booking Ref</span>
                <span className="font-mono font-bold text-gray-900" data-testid="text-booking-reference">{appointment.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-900">{appointment.doctor?.name}</span>
              </div>
              {appointment.slot && (
                <>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500"><Calendar className="h-3.5 w-3.5" />Date</span>
                    <span className="text-gray-700">{new Date(appointment.slot.slot_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500"><Clock className="h-3.5 w-3.5" />Time</span>
                    <span className="text-gray-700">{appointment.slot.start_time}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={appointment.status} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href="/dashboard/appointments">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-view-appointments">
                View My Appointments
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
