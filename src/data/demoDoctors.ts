import type { Doctor, AvailabilitySlot } from "@/types";

// ─── Demo doctors used as fallback when DB tables don't exist yet ───
export const DEMO_DOCTORS: Doctor[] = [
  {
    id: "demo-1",
    name: "Dr. Sarah Mitchell",
    specialization: "General Physician",
    qualification: "MBBS, MD (Internal Medicine)",
    experience_years: 14,
    bio: "Dr. Mitchell is a board-certified internist with 14 years of experience treating a wide range of conditions. She is known for her thorough, patient-centered approach and commitment to preventive care. She specializes in managing chronic conditions such as diabetes, hypertension, and thyroid disorders.",
    clinic_address: "MediBook Clinic, 120 Health Plaza, Suite 200, New York, NY 10001",
    consultation_fee: 80,
    avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
    rating: 4.8,
    review_count: 312,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "Dr. James Okafor",
    specialization: "Dermatologist",
    qualification: "MBBS, MD (Dermatology), FAAD",
    experience_years: 10,
    bio: "Dr. Okafor is a fellowship-trained dermatologist specializing in medical, surgical, and cosmetic dermatology. He treats acne, eczema, psoriasis, rosacea, and performs skin cancer screenings.",
    clinic_address: "MediBook Clinic, 120 Health Plaza, Suite 305, New York, NY 10001",
    consultation_fee: 120,
    avatar_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
    rating: 4.7,
    review_count: 189,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    name: "Dr. Priya Sharma",
    specialization: "Pediatrician",
    qualification: "MBBS, DCH, MD (Pediatrics)",
    experience_years: 8,
    bio: "Dr. Sharma is a compassionate pediatrician with 8 years of experience caring for newborns through teenagers. She creates a warm, reassuring environment for children and families.",
    clinic_address: "MediBook Clinic, 120 Health Plaza, Suite 110, New York, NY 10001",
    consultation_fee: 90,
    avatar_url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face",
    rating: 4.9,
    review_count: 245,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    name: "Dr. Robert Chen",
    specialization: "Dentist",
    qualification: "DDS, MS (Orthodontics)",
    experience_years: 12,
    bio: "Dr. Chen is a general and cosmetic dentist with over 12 years of practice. He offers comprehensive dental care including cleanings, fillings, crowns, veneers, and Invisalign treatment.",
    clinic_address: "MediBook Dental, 140 Health Plaza, Suite 50, New York, NY 10001",
    consultation_fee: 95,
    avatar_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face",
    rating: 4.6,
    review_count: 178,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    name: "Dr. Emily Watson",
    specialization: "Cardiologist",
    qualification: "MBBS, MD (Cardiology), FACC",
    experience_years: 16,
    bio: "Dr. Watson is an interventional cardiologist with 16 years of experience in diagnosing and treating complex heart conditions. She is a Fellow of the American College of Cardiology.",
    clinic_address: "MediBook Heart Center, 120 Health Plaza, Suite 400, New York, NY 10001",
    consultation_fee: 150,
    avatar_url: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=face",
    rating: 4.9,
    review_count: 401,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    name: "Dr. Marcus Thompson",
    specialization: "Orthopedist",
    qualification: "MBBS, MS (Orthopedics), FAAOS",
    experience_years: 11,
    bio: "Dr. Thompson is a board-certified orthopedic surgeon specializing in sports medicine, joint replacement, and minimally invasive surgery.",
    clinic_address: "MediBook Orthopedics, 160 Health Plaza, Suite 220, New York, NY 10001",
    consultation_fee: 130,
    avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face",
    rating: 4.7,
    review_count: 223,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-7",
    name: "Dr. Aisha Patel",
    specialization: "Neurologist",
    qualification: "MBBS, MD (Neurology), DM",
    experience_years: 9,
    bio: "Dr. Patel is a neurologist with expertise in headache medicine, epilepsy, and multiple sclerosis. She provides comprehensive neurological evaluations and individualized treatment plans.",
    clinic_address: "MediBook Neurology, 120 Health Plaza, Suite 350, New York, NY 10001",
    consultation_fee: 140,
    avatar_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=face",
    rating: 4.8,
    review_count: 156,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-8",
    name: "Dr. Daniel Kim",
    specialization: "Ophthalmologist",
    qualification: "MBBS, MD (Ophthalmology), FACS",
    experience_years: 13,
    bio: "Dr. Kim is a comprehensive ophthalmologist offering expert care for cataracts, glaucoma, diabetic eye disease, and LASIK consultations.",
    clinic_address: "MediBook Eye Center, 120 Health Plaza, Suite 175, New York, NY 10001",
    consultation_fee: 110,
    avatar_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face",
    rating: 4.6,
    review_count: 134,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate demo slots for the next 7 working days for a given doctor ID
export function generateDemoSlots(doctorId: string): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const morningTimes = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const afternoonTimes = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

  let dayOffset = 1;
  let workingDays = 0;

  while (workingDays < 7) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    dayOffset++;

    const dow = date.getDay();
    if (dow === 0) continue; // skip Sunday

    const dateStr = date.toISOString().split("T")[0];

    const times = dow === 6 ? morningTimes : [...morningTimes, ...afternoonTimes];

    times.forEach((t, i) => {
      const [h, m] = t.split(":").map(Number);
      const endM = m + 30;
      const endH = h + Math.floor(endM / 60);
      const end = `${String(endH).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`;
      slots.push({
        id: `demo-slot-${doctorId}-${dateStr}-${i}`,
        doctor_id: doctorId,
        slot_date: dateStr,
        start_time: t,
        end_time: end,
        is_available: true,
        created_at: new Date().toISOString(),
      });
    });

    workingDays++;
  }

  return slots;
}

export const DEMO_SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Dentist",
  "General Physician",
  "Neurologist",
  "Ophthalmologist",
  "Orthopedist",
  "Pediatrician",
];
