import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Valid phone number required"),
});
type FormData = z.infer<typeof schema>;

export default function PatientProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setLoading(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Profile updated" });
  };

  return (
    <ProtectedRoute requiredRole="patient">
      <DashboardLayout>
        <div className="max-w-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h1>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...register("full_name")} className="mt-1" data-testid="input-full-name" />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" {...register("phone")} className="mt-1" data-testid="input-phone" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading} data-testid="button-save-profile">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
