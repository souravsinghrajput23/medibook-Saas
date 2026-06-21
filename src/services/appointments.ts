import { supabase } from "@/lib/supabase";
import type { Appointment, AppointmentStatus } from "@/types";

export async function bookAppointment(params: {
  slotId: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  reasonForVisit?: string;
}): Promise<Appointment> {
  const { data, error } = await supabase.rpc("book_appointment", {
    p_slot_id: params.slotId,
    p_doctor_id: params.doctorId,
    p_patient_name: params.patientName,
    p_patient_phone: params.patientPhone,
    p_reason_for_visit: params.reasonForVisit ?? null,
  });
  if (error) throw error;
  return data;
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `*, doctor:doctors(*), slot:availability_slots(*)`
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function cancelMyAppointment(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_patient_appointment", {
    p_appointment_id: id,
  });
  if (error) throw error;
}

export async function getAllAppointments(filters?: {
  status?: AppointmentStatus | "all";
  doctorId?: string;
  date?: string;
  search?: string;
}): Promise<Appointment[]> {
  let query = supabase
    .from("appointments")
    .select(`*, doctor:doctors(*), slot:availability_slots(*), profile:profiles(*)`)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.doctorId && filters.doctorId !== "all") {
    query = query.eq("doctor_id", filters.doctorId);
  }
  if (filters?.date) {
    query = query.eq("slot.slot_date", filters.date);
  }
  if (filters?.search) {
    query = query.or(
      `patient_name.ilike.%${filters.search}%,booking_reference.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function adminConfirmAppointment(id: string): Promise<void> {
  const { error } = await supabase.rpc("admin_confirm_appointment", {
    p_appointment_id: id,
  });
  if (error) throw error;
}

export async function adminCancelAppointment(id: string, notes?: string): Promise<void> {
  const { error } = await supabase.rpc("admin_cancel_appointment", {
    p_appointment_id: id,
    p_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function adminCompleteAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function adminRescheduleAppointment(
  id: string,
  newSlotId: string
): Promise<void> {
  const { error } = await supabase.rpc("admin_reschedule_appointment", {
    p_appointment_id: id,
    p_new_slot_id: newSlotId,
  });
  if (error) throw error;
}

export async function getAdminOverview(): Promise<{
  totalDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
}> {
  const today = new Date().toISOString().split("T")[0];

  const [doctors, todayAppts, pending, confirmed, completed] = await Promise.all([
    supabase.from("doctors").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("slot.slot_date", today),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  return {
    totalDoctors: doctors.count ?? 0,
    todayAppointments: todayAppts.count ?? 0,
    pendingAppointments: pending.count ?? 0,
    confirmedAppointments: confirmed.count ?? 0,
    completedAppointments: completed.count ?? 0,
  };
}

export async function getPatients(): Promise<
  { id: string; full_name: string | null; phone: string | null; created_at: string; email?: string; appointment_count?: number }[]
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "patient")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
