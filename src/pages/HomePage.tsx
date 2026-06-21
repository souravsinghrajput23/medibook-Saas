import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ChevronRight,
  Calendar,
  CheckCircle,
  Stethoscope,
  Star,
  Shield,
  Clock,
  HeartPulse,
  Users,
  Award,
  Quote,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_CONFIG } from "@/config/app";
import { getDoctors, getSpecializations } from "@/services/doctors";
import type { Doctor } from "@/types";

const TESTIMONIALS = [
  {
    name: "Emily R.",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face",
    text: "MediBook made scheduling my appointment so easy. I found a specialist, picked a slot, and got confirmed in under 3 minutes. Absolutely seamless!",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    text: "I love being able to see all available times before choosing a doctor. The booking confirmation and reference number gave me real peace of mind.",
    rating: 5,
  },
  {
    name: "Maria K.",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    text: "Cancelled and rescheduled twice due to work — the process was instant and stress-free. This is how healthcare booking should always work.",
    rating: 5,
  },
];

const SPECIALIZATIONS = [
  { label: "General Physician", icon: "🩺", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Dermatologist", icon: "✨", color: "bg-pink-50 text-pink-700 border-pink-100" },
  { label: "Pediatrician", icon: "👶", color: "bg-green-50 text-green-700 border-green-100" },
  { label: "Dentist", icon: "🦷", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { label: "Cardiologist", icon: "❤️", color: "bg-red-50 text-red-700 border-red-100" },
  { label: "Orthopedist", icon: "🦴", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { label: "Neurologist", icon: "🧠", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { label: "Ophthalmologist", icon: "👁️", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
];

const STATS = [
  { value: "50+", label: "Verified Doctors", icon: Award },
  { value: "10k+", label: "Appointments Booked", icon: Calendar },
  { value: "4.9★", label: "Average Rating", icon: Star },
  { value: "24/7", label: "Online Booking", icon: Clock },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    label: "Find Your Doctor",
    desc: "Browse our network of verified specialists by name or specialization. Read profiles, experience and reviews.",
    step: "01",
  },
  {
    icon: Calendar,
    label: "Pick a Time Slot",
    desc: "See real-time availability and choose a date and time that fits your schedule perfectly.",
    step: "02",
  },
  {
    icon: CheckCircle,
    label: "Confirm & Attend",
    desc: "Receive instant booking confirmation with your unique reference number. Simply show up at the clinic.",
    step: "03",
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    Promise.all([
      getDoctors().catch(() => [] as Doctor[]),
      getSpecializations().catch(() => [] as string[]),
    ])
      .then(([docs, specs]) => {
        setDoctors(docs);
        setSpecializations(specs);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (specialization !== "all") params.set("specialization", specialization);
    setLocation(`/doctors?${params.toString()}`);
  };

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-40 -left-16 w-60 h-60 bg-cyan-100 rounded-full blur-2xl opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
                <HeartPulse className="h-3.5 w-3.5" />
                Trusted by 10,000+ patients
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Book a Doctor <br />
                <span className="text-blue-600">Appointment</span> Online
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-lg">
                Connect with verified healthcare professionals. Choose your specialist, pick a time, and get confirmed instantly — no phone calls, no waiting.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/doctors">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 py-2.5 text-base"
                    data-testid="button-find-doctor"
                  >
                    Find a Doctor <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="px-6 py-2.5 text-base" data-testid="button-get-started">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" />No hidden fees</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" />Instant confirmation</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" />Verified doctors</span>
              </div>
            </div>

            {/* Right hero image collage */}
            <div className="hidden lg:block relative">
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop"
                  alt="Doctor with patient"
                  className="rounded-2xl object-cover w-full h-44 shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop"
                  alt="Female doctor"
                  className="rounded-2xl object-cover w-full h-44 shadow-md mt-6"
                />
                <img
                  src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop"
                  alt="Doctor consultation"
                  className="rounded-2xl object-cover w-full h-44 shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=300&fit=crop"
                  alt="Medical team"
                  className="rounded-2xl object-cover w-full h-44 shadow-md mt-6"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Appointments today</p>
                  <p className="font-bold text-gray-900 text-lg">128</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-10 bg-gray-50 rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 max-w-3xl shadow-sm">
            <Input
              placeholder="Search by doctor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-white h-10"
              data-testid="input-home-search"
            />
            <select
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              data-testid="select-specialization"
            >
              <option value="all">All Specializations</option>
              {specializations.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="inline-flex items-center justify-center bg-white/10 rounded-full p-2 mb-2">
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-blue-100 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALIZATIONS ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Specialization</h2>
            <p className="text-gray-500">Find the right specialist for your healthcare needs</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {SPECIALIZATIONS.map((spec) => (
              <Link
                key={spec.label}
                href={`/doctors?specialization=${encodeURIComponent(spec.label)}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${spec.color}`}
                data-testid={`link-spec-${spec.label}`}
              >
                <span className="text-2xl">{spec.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{spec.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How MediBook Works</h2>
            <p className="text-gray-500">Three simple steps to your next appointment</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-blue-100" />
            {HOW_IT_WORKS.map((step) => (
              <div key={step.label} className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-blue-100 flex items-center justify-center shadow-sm mb-5">
                    <step.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.step.slice(1)}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.label}</h3>
                <p className="text-sm text-gray-500 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED DOCTORS ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Our Top Doctors</h2>
              <p className="text-gray-500 text-sm">Highly rated specialists ready to help you</p>
            </div>
            <Link href="/doctors" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : doctors.length === 0 ? (
            <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No doctors found</p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                The database may not be set up yet. Please run the SQL schema and seed files from the README.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctors.slice(0, 4).map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY MEDIBOOK ── */}
      <section className="py-14 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Why Patients Choose MediBook</h2>
              <p className="text-gray-500 mb-8">We make healthcare access simple, transparent, and reliable for everyone.</p>
              <div className="space-y-5">
                {[
                  { icon: Shield, title: "Verified Professionals", desc: "Every doctor on our platform is verified, licensed, and background-checked.", color: "text-blue-600 bg-blue-100" },
                  { icon: Clock, title: "Book in Minutes", desc: "No phone tag, no waiting on hold. Pick a slot and confirm in under 3 minutes.", color: "text-green-600 bg-green-100" },
                  { icon: HeartPulse, title: "Your Health, Your Control", desc: "View and manage all your appointments in one place. Cancel or reschedule anytime.", color: "text-pink-600 bg-pink-100" },
                  { icon: Users, title: "All Specializations", desc: "From general medicine to specialized care — we cover over 20 medical specializations.", color: "text-purple-600 bg-purple-100" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&h=500&fit=crop"
                alt="Doctor and patient consultation"
                className="rounded-2xl shadow-lg w-full object-cover h-96"
              />
              {/* Floating card */}
              <div className="absolute -bottom-5 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm font-semibold text-gray-900">"Best healthcare app I've used!"</p>
                <p className="text-xs text-gray-400 mt-1">— Sarah M., verified patient</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Patients Say</h2>
            <p className="text-gray-500">Real reviews from real patients</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 relative">
                <Quote className="h-8 w-8 text-blue-100 absolute top-4 right-4" />
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Stethoscope className="h-10 w-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to book your appointment?
          </h2>
          <p className="text-blue-100 mb-8 text-base">
            Join thousands of patients who trust MediBook for their healthcare needs. It's free to register.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-2.5">
                Create Free Account
              </Button>
            </Link>
            <Link href="/doctors">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-2.5">
                Browse Doctors
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
