import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllDoctors } from "@/services/doctors";
import { getAllSlotsForDoctor, generateSlots, deleteSlot, updateSlotAvailability } from "@/services/slots";
import { useToast } from "@/hooks/use-toast";
import type { Doctor, AvailabilitySlot } from "@/types";

const INTERVALS = [15, 20, 30, 60];

export default function AdminAvailability() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [genForm, setGenForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    interval: 30,
  });

  useEffect(() => { getAllDoctors().then(setDoctors); }, []);

  const loadSlots = (doctorId: string) => {
    setLoadingSlots(true);
    getAllSlotsForDoctor(doctorId)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  };

  const handleDoctorChange = (id: string) => {
    setSelectedDoctorId(id);
    if (id) loadSlots(id);
    else setSlots([]);
  };

  const handleGenerate = async () => {
    if (!selectedDoctorId || !genForm.date) {
      toast({ title: "Select a doctor and date", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const newSlots = await generateSlots({
        doctorId: selectedDoctorId,
        date: genForm.date,
        startTime: genForm.startTime,
        endTime: genForm.endTime,
        intervalMinutes: genForm.interval,
      });
      toast({ title: `${newSlots.length} slots generated` });
      loadSlots(selectedDoctorId);
    } catch (e: unknown) {
      toast({ title: "Failed to generate slots", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSlot(deleteTarget);
      toast({ title: "Slot deleted" });
      setDeleteTarget(null);
      if (selectedDoctorId) loadSlots(selectedDoctorId);
    } catch {
      toast({ title: "Cannot delete booked slot", variant: "destructive" });
    }
  };

  const handleToggle = async (slot: AvailabilitySlot) => {
    try {
      await updateSlotAvailability(slot.id, !slot.is_available);
      toast({ title: `Slot marked ${slot.is_available ? "unavailable" : "available"}` });
      if (selectedDoctorId) loadSlots(selectedDoctorId);
    } catch {
      toast({ title: "Failed to update slot", variant: "destructive" });
    }
  };

  const groupedSlots = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Availability Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Generate Slots
            </h2>
            <div className="space-y-3">
              <div>
                <Label>Doctor</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDoctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  data-testid="select-doctor"
                >
                  <option value="">Select doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={genForm.date} onChange={(e) => setGenForm({ ...genForm, date: e.target.value })} className="mt-1" min={new Date().toISOString().split("T")[0]} data-testid="input-slot-date" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={genForm.startTime} onChange={(e) => setGenForm({ ...genForm, startTime: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input type="time" value={genForm.endTime} onChange={(e) => setGenForm({ ...genForm, endTime: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Interval (minutes)</Label>
                <div className="flex gap-2 mt-1">
                  {INTERVALS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setGenForm({ ...genForm, interval: i })}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium border transition-colors ${genForm.interval === i ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedDoctorId || !genForm.date}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-generate-slots"
              >
                {generating ? "Generating..." : "Generate Slots"}
              </Button>
            </div>
          </div>

          {/* Slots list */}
          <div className="lg:col-span-2">
            {!selectedDoctorId ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
                Select a doctor to view slots
              </div>
            ) : loadingSlots ? (
              <div className="py-12"><LoadingSpinner /></div>
            ) : slots.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
                No slots found. Generate some slots using the panel on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSlots).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateSlots]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {dateSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs ${slot.is_available ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"}`}
                          data-testid={`slot-${slot.id}`}
                        >
                          <span className="font-medium text-gray-800">{slot.start_time}</span>
                          <div className="flex gap-1 ml-1">
                            <button onClick={() => handleToggle(slot)} className="text-gray-400 hover:text-gray-600" title="Toggle availability">
                              {slot.is_available ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => setDeleteTarget(slot.id)} className="text-gray-300 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Slot"
          description="Are you sure you want to delete this slot? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}
