export type Role = "patient" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  bio: string | null;
  clinic_address: string | null;
  consultation_fee: number;
  avatar_url: string | null;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  booking_reference: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  patient_name: string;
  patient_phone: string;
  reason_for_visit: string | null;
  status: AppointmentStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  slot?: AvailabilitySlot;
  profile?: Profile;
}

export interface DoctorWithSlots extends Doctor {
  slots?: AvailabilitySlot[];
}
