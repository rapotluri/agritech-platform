import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center justify-center p-8">
      <h1 className="font-bold text-3xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Weather Data Retrieval Card */}
        <Link href="/protected/weather" className="block p-6 rounded-lg shadow-lg border border-gray-200 bg-white hover:bg-green-50 transition">
          <h2 className="text-xl font-semibold mb-2">Weather Data Retrieval</h2>
          <p className="text-gray-600 mb-4">Access and analyze weather data for your needs.</p>
          <span className="text-green-700 font-medium">Go to Weather Data &rarr;</span>
        </Link>
        {/* Insurance Product Development Card */}
        <Link href="/protected/products" className="block p-6 rounded-lg shadow-lg border border-gray-200 bg-white hover:bg-green-50 transition">
          <h2 className="text-xl font-semibold mb-2">Insurance Product Development</h2>
          <p className="text-gray-600 mb-4">Develop and manage insurance products.</p>
          <span className="text-green-700 font-medium">Go to Products &rarr;</span>
        </Link>
      </div>
    </div>
  );
} 