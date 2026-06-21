-- ============================================================
-- MediBook Seed Data — 8 Demo Doctors + Availability Slots
-- Run after schema.sql in Supabase SQL Editor
-- ============================================================

INSERT INTO public.doctors (
  name, specialization, qualification, experience_years,
  bio, clinic_address, consultation_fee,
  avatar_url, rating, review_count, is_active
)
VALUES
(
  'Dr. Sarah Mitchell',
  'General Physician',
  'MBBS, MD (Internal Medicine)',
  14,
  'Dr. Mitchell is a board-certified internist with 14 years of experience treating a wide range of conditions. She is known for her thorough, patient-centered approach and commitment to preventive care. She specializes in managing chronic conditions such as diabetes, hypertension, and thyroid disorders.',
  'MediBook Clinic, 120 Health Plaza, Suite 200, New York, NY 10001',
  80.00,
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
  4.8, 312, TRUE
),
(
  'Dr. James Okafor',
  'Dermatologist',
  'MBBS, MD (Dermatology), FAAD',
  10,
  'Dr. Okafor is a fellowship-trained dermatologist specializing in medical, surgical, and cosmetic dermatology. He treats acne, eczema, psoriasis, rosacea, and performs skin cancer screenings. He has a special interest in skin conditions affecting patients of all skin types.',
  'MediBook Clinic, 120 Health Plaza, Suite 305, New York, NY 10001',
  120.00,
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
  4.7, 189, TRUE
),
(
  'Dr. Priya Sharma',
  'Pediatrician',
  'MBBS, DCH, MD (Pediatrics)',
  8,
  'Dr. Sharma is a compassionate pediatrician with 8 years of experience caring for newborns through teenagers. She is fluent in English, Hindi, and Gujarati and creates a warm, reassuring environment for children and families. She has a special interest in childhood nutrition and developmental health.',
  'MediBook Clinic, 120 Health Plaza, Suite 110, New York, NY 10001',
  90.00,
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face',
  4.9, 245, TRUE
),
(
  'Dr. Robert Chen',
  'Dentist',
  'DDS, MS (Orthodontics)',
  12,
  'Dr. Chen is a general and cosmetic dentist with over 12 years of practice. He offers comprehensive dental care including cleanings, fillings, crowns, veneers, and Invisalign treatment. He is known for his gentle technique and making patients feel comfortable.',
  'MediBook Dental, 140 Health Plaza, Suite 50, New York, NY 10001',
  95.00,
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face',
  4.6, 178, TRUE
),
(
  'Dr. Emily Watson',
  'Cardiologist',
  'MBBS, MD (Cardiology), FACC',
  16,
  'Dr. Watson is an interventional cardiologist with 16 years of experience in diagnosing and treating complex heart conditions. She specializes in preventive cardiology, hypertension management, and cardiac rehabilitation. She is a Fellow of the American College of Cardiology.',
  'MediBook Heart Center, 120 Health Plaza, Suite 400, New York, NY 10001',
  150.00,
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=face',
  4.9, 401, TRUE
),
(
  'Dr. Marcus Thompson',
  'Orthopedist',
  'MBBS, MS (Orthopedics), FAAOS',
  11,
  'Dr. Thompson is a board-certified orthopedic surgeon specializing in sports medicine, joint replacement, and minimally invasive surgery. He works with both amateur and professional athletes and is skilled in arthroscopic procedures for knee, shoulder, and hip conditions.',
  'MediBook Orthopedics, 160 Health Plaza, Suite 220, New York, NY 10001',
  130.00,
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face',
  4.7, 223, TRUE
),
(
  'Dr. Aisha Patel',
  'Neurologist',
  'MBBS, MD (Neurology), DM',
  9,
  'Dr. Patel is a neurologist with expertise in headache medicine, epilepsy, and multiple sclerosis. She provides comprehensive neurological evaluations and develops individualized treatment plans. She is passionate about combining evidence-based medicine with compassionate patient care.',
  'MediBook Neurology, 120 Health Plaza, Suite 350, New York, NY 10001',
  140.00,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=face',
  4.8, 156, TRUE
),
(
  'Dr. Daniel Kim',
  'Ophthalmologist',
  'MBBS, MD (Ophthalmology), FACS',
  13,
  'Dr. Kim is a comprehensive ophthalmologist offering expert care for cataracts, glaucoma, diabetic eye disease, and LASIK consultations. With 13 years of experience, he blends advanced surgical techniques with thorough patient education to preserve and improve vision.',
  'MediBook Eye Center, 120 Health Plaza, Suite 175, New York, NY 10001',
  110.00,
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
  4.6, 134, TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Generate availability slots for the coming 10 days
-- ============================================================
DO $$
DECLARE
  doc         RECORD;
  d           INTEGER;
  target_date DATE;
  morning_times TEXT[] := ARRAY['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'];
  afternoon_times TEXT[] := ARRAY['14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  t           TEXT;
  start_t     TIME;
  end_t       TIME;
BEGIN
  FOR doc IN SELECT id FROM public.doctors LOOP
    FOR d IN 1..10 LOOP
      target_date := CURRENT_DATE + d;
      -- Skip Sundays
      IF EXTRACT(DOW FROM target_date) = 0 THEN CONTINUE; END IF;

      -- Morning slots
      FOREACH t IN ARRAY morning_times LOOP
        start_t := t::TIME;
        end_t   := start_t + INTERVAL '30 minutes';
        INSERT INTO public.availability_slots (doctor_id, slot_date, start_time, end_time, is_available)
        VALUES (doc.id, target_date, start_t, end_t, TRUE)
        ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;
      END LOOP;

      -- Afternoon slots (skip Saturdays for afternoon)
      IF EXTRACT(DOW FROM target_date) != 6 THEN
        FOREACH t IN ARRAY afternoon_times LOOP
          start_t := t::TIME;
          end_t   := start_t + INTERVAL '30 minutes';
          INSERT INTO public.availability_slots (doctor_id, slot_date, start_time, end_time, is_available)
          VALUES (doc.id, target_date, start_t, end_t, TRUE)
          ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END $$;
