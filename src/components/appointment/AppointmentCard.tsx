import { useState } from "react";
import { Calendar, Clock, MapPin, DollarSign, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Appointment } from "@/types";

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => Promise<void>;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCancel =
    onCancel &&
    (appointment.status === "pending" || appointment.status === "confirmed");

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(appointment.id);
    } finally {
      setCancelling(false);
      setConfirmOpen(false);
    }
  };

  const slot = appointment.slot;
  const doctor = appointment.doctor;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
      data-testid={`card-appointment-${appointment.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900">{doctor?.name ?? "Doctor"}</p>
          <p className="text-sm text-blue-600">{doctor?.specialization}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-mono font-medium text-gray-800" data-testid={`text-booking-ref-${appointment.id}`}>
            {appointment.booking_reference}
          </span>
        </div>
        {slot && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {new Date(slot.slot_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {slot.start_time} – {slot.end_time}
            </div>
          </>
        )}
        {doctor?.clinic_address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {doctor.clinic_address}
          </div>
        )}
        {doctor?.consultation_fee && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-green-500" />
            ${doctor.consultation_fee}
          </div>
        )}
      </div>

      {canCancel && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={() => setConfirmOpen(true)}
            disabled={cancelling}
            data-testid={`button-cancel-appointment-${appointment.id}`}
          >
            Cancel Appointment
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  );
}
