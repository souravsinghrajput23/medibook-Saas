import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Search, Stethoscope } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { getDoctors, getSpecializations } from "@/services/doctors";
import type { Doctor } from "@/types";

export default function DoctorsPage() {
  const qs = useSearch();
  const params = new URLSearchParams(qs);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [specialization, setSpecialization] = useState(params.get("specialization") ?? "all");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);

  useEffect(() => {
    getSpecializations().catch(() => []).then(setSpecializations);
  }, []);

  useEffect(() => {
    setLoading(true);
    setDbMissing(false);
    getDoctors({
      search: search || undefined,
      specialization: specialization !== "all" ? specialization : undefined,
    })
      .then(setDoctors)
      .catch((err: unknown) => {
        // Supabase PostgrestError has a .message property (not instanceof Error)
        const msg = (err as { message?: string })?.message ?? String(err);
        const isDbMissing =
          msg.includes("schema cache") ||
          msg.includes("does not exist") ||
          msg.includes("PGRST205") ||
          msg.includes("relation") ||
          msg.includes("table");
        setDbMissing(isDbMissing);
        setDoctors([]);
      })
      .finally(() => setLoading(false));
  }, [search, specialization]);

  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-1">Find a Doctor</h1>
          <p className="text-blue-100 text-sm">Browse our network of verified healthcare professionals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by doctor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-doctors"
            />
          </div>
          <select
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            data-testid="select-filter-specialization"
          >
            <option value="all">All Specializations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : dbMissing ? (
          <div className="py-16 text-center bg-amber-50 rounded-2xl border border-amber-200">
            <Stethoscope className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Database Setup Required</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              The database tables haven't been created yet. Please run the SQL schema files in your Supabase SQL Editor to get started.
            </p>
            <div className="inline-block bg-white border border-amber-200 rounded-lg px-4 py-3 text-left font-mono text-xs text-gray-700 max-w-sm">
              <p className="text-amber-600 font-semibold mb-1"># In Supabase SQL Editor, run:</p>
              <p>1. supabase/schema.sql</p>
              <p>2. supabase/seed.sql</p>
            </div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700">No doctors found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} />
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
