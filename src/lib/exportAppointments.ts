import type { Appointment } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── CSV Export ──────────────────────────────────────────────────────────────
export function exportAppointmentsCSV(appointments: Appointment[], filename = "appointments.csv") {
  const headers = [
    "Booking Ref",
    "Doctor",
    "Specialization",
    "Date",
    "Time",
    "Status",
    "Fee",
    "Reason for Visit",
    "Clinic",
    "Booked On",
  ];

  const rows = appointments.map((a) => [
    a.booking_reference ?? "",
    a.doctor?.name ?? "",
    a.doctor?.specialization ?? "",
    a.slot ? formatDate(a.slot.slot_date) : "",
    a.slot ? `${a.slot.start_time} – ${a.slot.end_time}` : "",
    statusLabel(a.status),
    a.doctor?.consultation_fee ? `$${a.doctor.consultation_fee}` : "",
    a.reason_for_visit ?? "",
    a.doctor?.clinic_address ?? "",
    formatDateTime(a.created_at),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── PDF Export ──────────────────────────────────────────────────────────────
export async function exportAppointmentsPDF(
  appointments: Appointment[],
  patientName: string,
  filename = "appointments.pdf"
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Header ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MediBook", 14, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Appointment History Report", 14, 17);
  doc.text(`Patient: ${patientName}`, pageW - 14, 10, { align: "right" });
  doc.text(`Generated: ${today}`, pageW - 14, 17, { align: "right" });

  // ── Summary row ──
  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  doc.setTextColor(55, 65, 81); // gray-700
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const summaryY = 28;
  doc.text(`Total Appointments: ${total}`, 14, summaryY);
  doc.text(`Pending: ${pending}`, 60, summaryY);
  doc.text(`Confirmed: ${confirmed}`, 95, summaryY);
  doc.text(`Completed: ${completed}`, 135, summaryY);
  doc.text(`Cancelled: ${cancelled}`, 175, summaryY);

  // ── Table ──
  const statusColors: Record<string, [number, number, number]> = {
    pending:    [217, 119, 6],  // amber
    confirmed:  [22, 163, 74],  // green
    completed:  [100, 116, 139], // slate
    cancelled:  [220, 38, 38],  // red
    rescheduled:[37, 99, 235],  // blue
  };

  autoTable(doc, {
    startY: summaryY + 5,
    head: [["Booking Ref", "Doctor", "Specialization", "Date", "Time", "Status", "Fee", "Reason"]],
    body: appointments.map((a) => [
      a.booking_reference ?? "—",
      a.doctor?.name ?? "—",
      a.doctor?.specialization ?? "—",
      a.slot ? new Date(a.slot.slot_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
      a.slot ? a.slot.start_time : "—",
      statusLabel(a.status),
      a.doctor?.consultation_fee ? `$${a.doctor.consultation_fee}` : "—",
      a.reason_for_visit ?? "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      5: { cellWidth: 22 },
      6: { cellWidth: 14, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === "body") {
        const status = String(data.cell.raw).toLowerCase();
        const color = statusColors[status];
        if (color) data.cell.styles.textColor = color;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ──
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `MediBook Appointment History — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" }
    );
  }

  doc.save(filename);
}
