import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, DollarSign, User, ChevronLeft, AlertTriangle } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getDoctor } from "@/services/doctors";
import { getAvailableSlots } from "@/services/slots";
import { bookAppointment } from "@/services/appointments";
import { useToast } from "@/hooks/use-toast";
import type { Doctor, AvailabilitySlot } from "@/types";

const schema = z.object({
  patient_name: z.string().min(2, "Name is required"),
  patient_phone: z.string().min(7, "Valid phone number is required"),
  reason_for_visit: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Pre-selected slot/date passed from the doctor detail page
  const qs = new URLSearchParams(search);
  const preSlotId = qs.get("slotId");
  const preDate = qs.get("date");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(preDate);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [step, setStep] = useState<"select" | "details" | "confirm">("select");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_name: profile?.full_name ?? "",
      patient_phone: profile?.phone ?? "",
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation(`/login?redirect=/book/${doctorId}${search ? `?${search}` : ""}`);
      return;
    }
    if (!doctorId) return;
    Promise.all([getDoctor(doctorId), getAvailableSlots(doctorId)])
      .then(([doc, sl]) => {
        setDoctor(doc);
        setSlots(sl);
        const dates = [...new Set(sl.map((s) => s.slot_date))];

        // Restore pre-selected slot from URL if present
        if (preSlotId) {
          const match = sl.find((s) => s.id === preSlotId);
          if (match) {
            setSelectedSlot(match);
            setSelectedDate(match.slot_date);
            return;
          }
        }
        if (preDate && dates.includes(preDate)) {
          setSelectedDate(preDate);
        } else if (dates[0]) {
          setSelectedDate(dates[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [doctorId, user]);

  useEffect(() => {
    if (profile) {
      reset({
        patient_name: profile.full_name ?? "",
        patient_phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const uniqueDates = [...new Set(slots.map((s) => s.slot_date))];
  const slotsForDate = selectedDate ? slots.filter((s) => s.slot_date === selectedDate) : [];
  const formValues = watch();

  // Demo doctors/slots can't be booked — Supabase has no matching rows
  const isDemoDoctor = doctorId?.startsWith("demo-") || selectedSlot?.id?.startsWith("demo-slot-");

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot || !doctorId) return;
    if (isDemoDoctor) return; // guard — should never reach here
    setSubmitting(true);
    try {
      const appt = await bookAppointment({
        slotId: selectedSlot.id,
        doctorId,
        patientName: data.patient_name,
        patientPhone: data.patient_phone,
        reasonForVisit: data.reason_for_visit,
      });
      toast({ title: "Appointment booked!", description: `Booking ref: ${appt.booking_reference}` });
      setLocation(`/booking-success/${appt.id}`);
    } catch (err: unknown) {
      // Supabase returns PostgrestError (not instanceof Error) — extract .message
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : null) ||
        "Booking failed. Please try again.";
      toast({ title: "Booking failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PublicLayout><div className="py-20"><LoadingSpinner /></div></PublicLayout>;
  if (!doctor) return <PublicLayout><p className="text-center py-12 text-gray-500">Doctor not found.</p></PublicLayout>;

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => setLocation(`/doctors/${doctorId}`)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Book Appointment</h1>
        <p className="text-sm text-gray-500 mb-4">with <span className="font-medium text-gray-800">{doctor.name}</span> · {doctor.specialization}</p>

        {/* Demo-mode warning — shown whenever the doctor is a demo placeholder */}
        {isDemoDoctor && (
          <div className="mb-6 flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Demo mode — booking disabled</p>
              <p className="text-xs text-amber-700 mt-1">
                This doctor is a demo profile. To enable real bookings, run{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">schema.sql</code> then{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">seed.sql</code> in your Supabase SQL Editor.
                After that, real doctors and available slots will appear.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Select slot */}
        {step === "select" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> Select Date
            </h2>
            {uniqueDates.length === 0 ? (
              <p className="text-sm text-gray-500">No available slots for this doctor.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {uniqueDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedDate === date ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}
                      data-testid={`button-date-${date}`}
                    >
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </button>
                  ))}
                </div>

                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" /> Select Time
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${selectedSlot?.id === slot.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}
                      data-testid={`button-slot-${slot.id}`}
                    >
                      {slot.start_time}
                    </button>
                  ))}
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedSlot}
                  onClick={() => setStep("details")}
                  data-testid="button-continue-to-details"
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Patient details */}
        {step === "details" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Your Details
            </h2>
            <form className="space-y-4">
              <div>
                <Label htmlFor="patient_name">Full name</Label>
                <Input id="patient_name" {...register("patient_name")} className="mt-1" data-testid="input-patient-name" />
                {errors.patient_name && <p className="text-xs text-red-500 mt-1">{errors.patient_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="patient_phone">Phone number</Label>
                <Input id="patient_phone" type="tel" {...register("patient_phone")} className="mt-1" data-testid="input-patient-phone" />
                {errors.patient_phone && <p className="text-xs text-red-500 mt-1">{errors.patient_phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="reason_for_visit">Reason for visit <span className="text-gray-400">(optional)</span></Label>
                <Input id="reason_for_visit" {...register("reason_for_visit")} className="mt-1" placeholder="Brief description" data-testid="input-reason" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("select")}>Back</Button>
                <Button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep("confirm")} data-testid="button-review-booking">Review Booking</Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedSlot && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Booking Summary</h2>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-900">{doctor.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Specialization</span>
                <span className="text-gray-700">{doctor.specialization}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-700">{new Date(selectedSlot.slot_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Time</span>
                <span className="text-gray-700">{selectedSlot.start_time} – {selectedSlot.end_time}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Fee</span>
                <span className="font-semibold text-green-700">${doctor.consultation_fee}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Patient name</span>
                <span className="text-gray-700">{formValues.patient_name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-700">{formValues.patient_phone}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("details")}>Back</Button>
              <Button
                type="button"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting || isDemoDoctor}
                onClick={handleSubmit(onSubmit)}
                title={isDemoDoctor ? "Set up the database to enable real bookings" : undefined}
                data-testid="button-confirm-appointment"
              >
                {submitting ? "Booking..." : "Confirm Appointment"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
