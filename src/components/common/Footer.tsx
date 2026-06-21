import { Link } from "wouter";
import { Stethoscope, Phone, Mail, MapPin } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 rounded-lg p-1.5">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">{APP_CONFIG.name}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{APP_CONFIG.description}</p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +1 (800) 555-0100</div>
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> support@medibook.app</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> 120 Health Plaza, New York, NY</div>
            </div>
          </div>

          {/* For Patients */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">For Patients</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/doctors" className="hover:text-white transition-colors">Find a Doctor</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">My Appointments</Link></li>
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Specializations</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["General Physician", "Dermatologist", "Pediatrician", "Cardiologist", "Neurologist", "Dentist"].map((s) => (
                <li key={s}>
                  <Link href={`/doctors?specialization=${encodeURIComponent(s)}`} className="hover:text-white transition-colors">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><span className="cursor-default">About Us</span></li>
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Help Center</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.</p>
          <p>Made with ❤️ for better healthcare access</p>
        </div>
      </div>
    </footer>
  );
}
