import { Stethoscope, AlertTriangle } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export default function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{APP_CONFIG.name}</h1>
        <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Setup Required</span>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          Supabase environment variables are missing. Please add your{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
            VITE_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
            VITE_SUPABASE_ANON_KEY
          </code>{" "}
          to your environment variables and restart the app.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left text-xs font-mono text-gray-700">
          <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
        </div>
      </div>
    </div>
  );
}
