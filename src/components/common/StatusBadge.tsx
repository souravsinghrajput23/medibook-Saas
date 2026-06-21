import type { AppointmentStatus } from "@/types";

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  rescheduled: { label: "Rescheduled", className: "bg-purple-100 text-purple-800 border-purple-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 border-green-200" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </span>
  );
}
