import { Link } from "wouter";
import { Star, MapPin, DollarSign, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Doctor } from "@/types";

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      data-testid={`card-doctor-${doctor.id}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {doctor.avatar_url ? (
            <img
              src={doctor.avatar_url}
              alt={doctor.name}
              className="h-16 w-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-lg">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate" data-testid={`text-doctor-name-${doctor.id}`}>
              {doctor.name}
            </h3>
            <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
            <p className="text-xs text-gray-500 mt-0.5">{doctor.qualification}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {doctor.experience_years} yrs experience
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            {doctor.rating?.toFixed(1) ?? "N/A"}{" "}
            <span className="text-gray-400">({doctor.review_count ?? 0})</span>
          </div>
          {doctor.clinic_address && (
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{doctor.clinic_address}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 col-span-2">
            <DollarSign className="h-3.5 w-3.5 text-green-500" />
            Consultation fee: <span className="font-semibold text-gray-900">${doctor.consultation_fee}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/doctors/${doctor.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              data-testid={`button-view-profile-${doctor.id}`}
            >
              View Profile
            </Button>
          </Link>
          <Link href={`/book/${doctor.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid={`button-book-${doctor.id}`}
            >
              Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
