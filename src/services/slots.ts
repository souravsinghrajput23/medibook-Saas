import { supabase } from "@/lib/supabase";
import type { AvailabilitySlot } from "@/types";
import { generateDemoSlots } from "@/data/demoDoctors";

function isDbError(err: unknown) {
  const msg = (err as { message?: string })?.message ?? String(err);
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("PGRST205") ||
    msg.includes("relation") ||
    msg.toLowerCase().includes("table")
  );
}

export async function getAvailableSlots(
  doctorId: string,
  date?: string
): Promise<AvailabilitySlot[]> {
  // Demo doctor — return generated slots
  if (doctorId.startsWith("demo-")) {
    const slots = generateDemoSlots(doctorId);
    return date ? slots.filter((s) => s.slot_date === date) : slots;
  }

  const today = new Date().toISOString().split("T")[0];
  let query = supabase
    .from("availability_slots")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("is_available", true)
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time");

  if (date) {
    query = query.eq("slot_date", date);
  }

  const { data, error } = await query;
  if (error) {
    if (isDbError(error)) {
      const slots = generateDemoSlots(doctorId);
      return date ? slots.filter((s) => s.slot_date === date) : slots;
    }
    throw error;
  }
  return data ?? [];
}

export async function getSlotsForDoctor(
  doctorId: string,
  includeUnavailable = false
): Promise<AvailabilitySlot[]> {
  let query = supabase
    .from("availability_slots")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("slot_date")
    .order("start_time");

  if (!includeUnavailable) {
    query = query.eq("is_available", true);
  }

  const { data, error } = await query;
  if (error) {
    if (isDbError(error)) return generateDemoSlots(doctorId);
    throw error;
  }
  return data ?? [];
}

export async function getAllSlotsForDoctor(
  doctorId: string
): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("slot_date")
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function generateSlots(params: {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
}): Promise<AvailabilitySlot[]> {
  const slots: { doctor_id: string; slot_date: string; start_time: string; end_time: string; is_available: boolean }[] = [];
  const [startH, startM] = params.startTime.split(":").map(Number);
  const [endH, endM] = params.endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current + params.intervalMinutes <= endMinutes) {
    const h1 = String(Math.floor(current / 60)).padStart(2, "0");
    const m1 = String(current % 60).padStart(2, "0");
    const next = current + params.intervalMinutes;
    const h2 = String(Math.floor(next / 60)).padStart(2, "0");
    const m2 = String(next % 60).padStart(2, "0");
    slots.push({
      doctor_id: params.doctorId,
      slot_date: params.date,
      start_time: `${h1}:${m1}`,
      end_time: `${h2}:${m2}`,
      is_available: true,
    });
    current = next;
  }

  if (slots.length === 0) return [];

  const { data, error } = await supabase
    .from("availability_slots")
    .upsert(slots, {
      onConflict: "doctor_id,slot_date,start_time",
      ignoreDuplicates: true,
    })
    .select();
  if (error) throw error;
  return data ?? [];
}

export async function deleteSlot(id: string): Promise<void> {
  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateSlotAvailability(
  id: string,
  isAvailable: boolean
): Promise<void> {
  const { error } = await supabase
    .from("availability_slots")
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) throw error;
}
