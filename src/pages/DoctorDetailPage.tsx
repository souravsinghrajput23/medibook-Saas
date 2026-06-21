import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Star, MapPin, Clock, DollarSign, Calendar, ChevronLeft, Award } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { getDoctor } from "@/services/doctors";
import { getAvailableSlots } from "@/services/slots";
import { useAuth } from "@/contexts/AuthContext";
import type { Doctor, AvailabilitySlot } from "@/types";

export default function DoctorDetailPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    if (!doctorId) return;
    Promise.all([getDoctor(doctorId), getAvailableSlots(doctorId)])
      .then(([doc, sl]) => {
        setDoctor(doc);
        setSlots(sl);
        const dates = [...new Set(sl.map((s) => s.slot_date))];
        if (dates[0]) setSelectedDate(dates[0]);
      })
      .finally(() => setLoading(false));
  }, [doctorId]);

  const handleBook = () => {
    if (!user) {
      // Not logged in — send to login with redirect back here
      setLocation(`/login?redirect=/book/${doctorId}`);
      return;
    }
    // If a slot is pre-selected, pass it as a query param
    const qs = selectedSlot ? `?slotId=${selectedSlot.id}&date=${selectedSlot.slot_date}` : "";
    setLocation(`/book/${doctorId}${qs}`);
  };

  if (loading) return <PublicLayout><div className="py-20"><LoadingSpinner /></div></PublicLayout>;
  if (!doctor) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-gray-500">Doctor not found.</p>
        <Link href="/doctors"><Button variant="outline" className="mt-4">Back to Doctors</Button></Link>
      </div>
    </PublicLayout>
  );

  const uniqueDates = [...new Set(slots.map((s) => s.slot_date))];
  const slotsForDate = selectedDate ? slots.filter((s) => s.slot_date === selectedDate) : [];
  const initials = doctor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/doctors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Doctors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start gap-5">
                {doctor.avatar_url ? (
                  <img
                    src={doctor.avatar_url}
                    alt={doctor.name}
                    className="h-24 w-24 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-2xl">{initials}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900" data-testid="text-doctor-name">{doctor.name}</h1>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                  <p className="text-sm text-gray-500">{doctor.qualification}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {doctor.experience_years} yrs experience
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      {doctor.rating?.toFixed(1)} ({doctor.review_count} reviews)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-green-500" />
                      ${doctor.consultation_fee} per visit
                    </span>
                  </div>
                  {doctor.clinic_address && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {doctor.clinic_address}
                    </p>
                  )}
                </div>
              </div>
              {doctor.bio && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-blue-500" /> About
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" /> Book an Appointment
              </h2>

              {uniqueDates.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming slots available</p>
                </div>
              ) : (
                <>
                  {/* Date picker */}
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Select date</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {uniqueDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selectedDate === date
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                        }`}
                        data-testid={`button-date-${date}`}
                      >
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </button>
                    ))}
                  </div>

                  {/* Time slots — clickable, highlight selection */}
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Select time <span className="normal-case font-normal text-gray-400">(optional — choose on next page)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {slotsForDate.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id === selectedSlot?.id ? null : slot)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedSlot?.id === slot.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                        data-testid={`slot-time-${slot.id}`}
                      >
                        {slot.start_time}
                      </button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 mb-4 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      Selected: {new Date(selectedSlot.slot_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {selectedSlot.start_time}
                    </div>
                  )}

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleBook}
                    data-testid="button-book-appointment"
                  >
                    {selectedSlot ? "Book this slot" : "Book Appointment"}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                      You'll be asked to sign in before confirming
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
