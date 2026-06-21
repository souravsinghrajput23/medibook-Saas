import { supabase } from "@/lib/supabase";
import type { Doctor, DoctorWithSlots } from "@/types";
import { DEMO_DOCTORS, DEMO_SPECIALIZATIONS } from "@/data/demoDoctors";

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

export async function getDoctors(filters?: {
  search?: string;
  specialization?: string;
}): Promise<Doctor[]> {
  let query = supabase
    .from("doctors")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (filters?.specialization && filters.specialization !== "all") {
    query = query.eq("specialization", filters.specialization);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    if (isDbError(error)) {
      // DB not set up yet — return filtered demo data
      let results = DEMO_DOCTORS;
      if (filters?.specialization && filters.specialization !== "all") {
        results = results.filter((d) => d.specialization === filters.specialization);
      }
      if (filters?.search) {
        results = results.filter((d) =>
          d.name.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      return results;
    }
    throw error;
  }
  return data ?? [];
}

export async function getDoctor(id: string): Promise<DoctorWithSlots | null> {
  // If it's a demo doctor, return it directly
  if (id.startsWith("demo-")) {
    return DEMO_DOCTORS.find((d) => d.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    if (isDbError(error)) {
      return DEMO_DOCTORS.find((d) => d.id === id) ?? null;
    }
    return null;
  }
  return data;
}

export async function getAllDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("name");
  if (error) {
    if (isDbError(error)) return DEMO_DOCTORS;
    throw error;
  }
  return data ?? [];
}

export async function createDoctor(doctor: Omit<Doctor, "id" | "created_at" | "updated_at">): Promise<Doctor> {
  const { data, error } = await supabase
    .from("doctors")
    .insert(doctor)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDoctor(id: string, doctor: Partial<Doctor>): Promise<Doctor> {
  const { data, error } = await supabase
    .from("doctors")
    .update({ ...doctor, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDoctor(id: string): Promise<void> {
  const { error } = await supabase.from("doctors").delete().eq("id", id);
  if (error) throw error;
}

export async function getSpecializations(): Promise<string[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("specialization")
    .eq("is_active", true);
  if (error) {
    if (isDbError(error)) return DEMO_SPECIALIZATIONS;
    throw error;
  }
  const unique = [...new Set((data ?? []).map((d) => d.specialization))];
  return unique.sort();
}
