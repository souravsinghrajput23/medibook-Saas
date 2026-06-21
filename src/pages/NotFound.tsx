import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl font-medium text-gray-700 mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
