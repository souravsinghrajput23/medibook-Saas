-- ============================================================
-- MediBook Database Schema
-- Run this in Supabase SQL Editor before using the app
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  specialization      TEXT NOT NULL,
  qualification       TEXT NOT NULL,
  experience_years    INTEGER NOT NULL DEFAULT 0,
  bio                 TEXT,
  clinic_address      TEXT,
  consultation_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  avatar_url          TEXT,
  rating              NUMERIC(3,1),
  review_count        INTEGER DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AVAILABILITY SLOTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_slots_unique UNIQUE (doctor_id, slot_date, start_time)
);

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference   TEXT NOT NULL UNIQUE,
  patient_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  doctor_id           UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  slot_id             UUID NOT NULL REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  patient_name        TEXT NOT NULL,
  patient_phone       TEXT NOT NULL,
  reason_for_visit    TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','rescheduled','cancelled','completed')),
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id   ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id    ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_id      ON public.appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_availability_doctor_date  ON public.availability_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_doctors_active            ON public.doctors(is_active);

-- ============================================================
-- TRIGGERS — auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    'patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER FUNCTION — is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- BOOKING FUNCTION (atomic, prevents double booking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_slot_id           UUID,
  p_doctor_id         UUID,
  p_patient_name      TEXT,
  p_patient_phone     TEXT,
  p_reason_for_visit  TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id     UUID;
  v_slot        public.availability_slots%ROWTYPE;
  v_ref         TEXT;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  -- Check authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock slot row
  SELECT * INTO v_slot
  FROM public.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF NOT v_slot.is_available THEN
    RAISE EXCEPTION 'Slot is no longer available';
  END IF;

  -- Ensure no active appointment already exists for this slot
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE slot_id = p_slot_id
      AND status NOT IN ('cancelled')
  ) THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;

  -- Generate booking reference
  v_ref := 'MED-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- Create appointment
  INSERT INTO public.appointments (
    booking_reference, patient_id, doctor_id, slot_id,
    patient_name, patient_phone, reason_for_visit, status
  )
  VALUES (
    v_ref, v_user_id, p_doctor_id, p_slot_id,
    p_patient_name, p_patient_phone, p_reason_for_visit, 'pending'
  )
  RETURNING * INTO v_appointment;

  -- Mark slot unavailable
  UPDATE public.availability_slots
  SET is_available = FALSE
  WHERE id = p_slot_id;

  RETURN row_to_json(v_appointment);
END;
$$;

-- ============================================================
-- PATIENT CANCEL FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_patient_appointment(
  p_appointment_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_appt    public.appointments%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_appt
  FROM public.appointments
  WHERE id = p_appointment_id
    AND patient_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or not yours';
  END IF;

  IF v_appt.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Appointment cannot be cancelled';
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_appointment_id;

  -- Release slot
  UPDATE public.availability_slots
  SET is_available = TRUE
  WHERE id = v_appt.slot_id;
END;
$$;

-- ============================================================
-- ADMIN CONFIRM FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_confirm_appointment(
  p_appointment_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.appointments
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = p_appointment_id AND status = 'pending';
END;
$$;

-- ============================================================
-- ADMIN CANCEL FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_cancel_appointment(
  p_appointment_id UUID,
  p_notes          TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_appt public.appointments%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_appt
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled', admin_notes = p_notes, updated_at = NOW()
  WHERE id = p_appointment_id;

  -- Release slot
  UPDATE public.availability_slots
  SET is_available = TRUE
  WHERE id = v_appt.slot_id;
END;
$$;

-- ============================================================
-- ADMIN RESCHEDULE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reschedule_appointment(
  p_appointment_id UUID,
  p_new_slot_id    UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_appt     public.appointments%ROWTYPE;
  v_new_slot public.availability_slots%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_appt
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found'; END IF;

  -- Lock new slot
  SELECT * INTO v_new_slot
  FROM public.availability_slots
  WHERE id = p_new_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'New slot not found'; END IF;
  IF NOT v_new_slot.is_available THEN RAISE EXCEPTION 'New slot is not available'; END IF;

  -- Check no other active booking on new slot
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE slot_id = p_new_slot_id AND status NOT IN ('cancelled') AND id != p_appointment_id
  ) THEN
    RAISE EXCEPTION 'New slot already booked';
  END IF;

  -- Release old slot
  UPDATE public.availability_slots SET is_available = TRUE WHERE id = v_appt.slot_id;

  -- Reserve new slot
  UPDATE public.availability_slots SET is_available = FALSE WHERE id = p_new_slot_id;

  -- Update appointment
  UPDATE public.appointments
  SET slot_id = p_new_slot_id,
      doctor_id = v_new_slot.doctor_id,
      status = 'rescheduled',
      updated_at = NOW()
  WHERE id = p_appointment_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments     ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to re-create cleanly
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select"  ON public.profiles;

DROP POLICY IF EXISTS "doctors_public_read"    ON public.doctors;
DROP POLICY IF EXISTS "doctors_admin_all"      ON public.doctors;

DROP POLICY IF EXISTS "slots_public_read"      ON public.availability_slots;
DROP POLICY IF EXISTS "slots_admin_all"        ON public.availability_slots;

DROP POLICY IF EXISTS "appointments_patient_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_all"      ON public.appointments;

-- PROFILES
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND role = 'patient')
  WITH CHECK (auth.uid() = id AND role = 'patient');

-- DOCTORS — public can read active doctors
CREATE POLICY "doctors_public_read"
  ON public.doctors FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "doctors_admin_all"
  ON public.doctors FOR ALL
  USING (public.is_admin());

-- AVAILABILITY SLOTS — public can see future available slots
CREATE POLICY "slots_public_read"
  ON public.availability_slots FOR SELECT
  USING (is_available = TRUE AND slot_date >= CURRENT_DATE OR public.is_admin());

CREATE POLICY "slots_admin_all"
  ON public.availability_slots FOR ALL
  USING (public.is_admin());

-- APPOINTMENTS — patients see only their own
CREATE POLICY "appointments_patient_select"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin());

CREATE POLICY "appointments_admin_all"
  ON public.appointments FOR ALL
  USING (public.is_admin());
