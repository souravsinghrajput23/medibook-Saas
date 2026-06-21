import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllDoctors, createDoctor, updateDoctor, deleteDoctor } from "@/services/doctors";
import { useToast } from "@/hooks/use-toast";
import type { Doctor } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience_years: z.coerce.number().min(0),
  consultation_fee: z.coerce.number().min(1, "Fee must be positive"),
  bio: z.string().optional(),
  clinic_address: z.string().optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().min(0).optional(),
  is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function AdminDoctors() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  const load = () => getAllDoctors().then(setDoctors).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true },
  });

  const openCreate = () => {
    reset({ is_active: true });
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    reset({
      name: doc.name,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience_years: doc.experience_years,
      consultation_fee: doc.consultation_fee,
      bio: doc.bio ?? "",
      clinic_address: doc.clinic_address ?? "",
      avatar_url: doc.avatar_url ?? "",
      rating: doc.rating ?? undefined,
      review_count: doc.review_count ?? undefined,
      is_active: doc.is_active,
    });
    setFormOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        await updateDoctor(editing.id, data);
        toast({ title: "Doctor updated" });
      } else {
        await createDoctor(data as Omit<Doctor, "id" | "created_at" | "updated_at">);
        toast({ title: "Doctor saved" });
      }
      setFormOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save doctor", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (doc: Doctor) => {
    try {
      await updateDoctor(doc.id, { is_active: !doc.is_active });
      toast({ title: `Doctor ${doc.is_active ? "deactivated" : "activated"}` });
      load();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoctor(deleteTarget.id);
      toast({ title: "Doctor deleted" });
      setDeleteTarget(null);
      load();
    } catch {
      toast({ title: "Cannot delete doctor with appointments", variant: "destructive" });
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-900">Doctors</h1>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2" data-testid="button-add-doctor">
            <Plus className="h-4 w-4" /> Add Doctor
          </Button>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Specialization</th>
                    <th className="text-left px-5 py-3 font-medium">Experience</th>
                    <th className="text-left px-5 py-3 font-medium">Fee</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50" data-testid={`row-doctor-${doc.id}`}>
                      <td className="px-5 py-3 font-medium text-gray-900">{doc.name}</td>
                      <td className="px-5 py-3 text-gray-600">{doc.specialization}</td>
                      <td className="px-5 py-3 text-gray-600">{doc.experience_years} yrs</td>
                      <td className="px-5 py-3 text-gray-600">${doc.consultation_fee}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${doc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {doc.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleToggle(doc)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={doc.is_active ? "Deactivate" : "Activate"} data-testid={`button-toggle-doctor-${doc.id}`}>
                            {doc.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button onClick={() => openEdit(doc)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" data-testid={`button-edit-doctor-${doc.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(doc)} className="p-1.5 rounded hover:bg-red-50 text-red-400" data-testid={`button-delete-doctor-${doc.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No doctors yet. Add your first doctor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">{editing ? "Edit Doctor" : "Add Doctor"}</h2>
                <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Full name</Label>
                    <Input {...register("name")} className="mt-1" data-testid="input-doctor-name" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label>Specialization</Label>
                    <Input {...register("specialization")} className="mt-1" data-testid="input-doctor-specialization" />
                    {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization.message}</p>}
                  </div>
                  <div>
                    <Label>Qualification</Label>
                    <Input {...register("qualification")} className="mt-1" />
                    {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification.message}</p>}
                  </div>
                  <div>
                    <Label>Experience (years)</Label>
                    <Input type="number" {...register("experience_years")} className="mt-1" />
                  </div>
                  <div>
                    <Label>Consultation Fee ($)</Label>
                    <Input type="number" step="0.01" {...register("consultation_fee")} className="mt-1" data-testid="input-doctor-fee" />
                    {errors.consultation_fee && <p className="text-xs text-red-500 mt-1">{errors.consultation_fee.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <Label>Clinic address</Label>
                    <Input {...register("clinic_address")} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Avatar URL</Label>
                    <Input {...register("avatar_url")} className="mt-1" placeholder="https://..." />
                    {errors.avatar_url && <p className="text-xs text-red-500 mt-1">{errors.avatar_url.message}</p>}
                  </div>
                  <div>
                    <Label>Rating (0–5)</Label>
                    <Input type="number" step="0.1" min="0" max="5" {...register("rating")} className="mt-1" />
                  </div>
                  <div>
                    <Label>Review count</Label>
                    <Input type="number" min="0" {...register("review_count")} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <textarea {...register("bio")} rows={3} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Short biography..." />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="is_active" {...register("is_active")} className="rounded" />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={saving} data-testid="button-save-doctor">
                    {saving ? "Saving..." : "Save Doctor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Doctor"
          description={`Are you sure you want to delete ${deleteTarget?.name}? This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}
