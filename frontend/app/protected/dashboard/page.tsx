import { createClient } from "@/utils/supabase/server";
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
    <div className="flex-1 w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-green-50 to-white p-0">
      {/* AccuRate Logo/Branding */}
      <div className="w-full flex flex-col items-center py-10 mb-2">
        <span className="text-4xl font-extrabold font-sans">
          <span className="text-green-600">Accu</span>
          <span className="text-green-500">Rate</span>
        </span>
        <span className="text-lg text-gray-500 mt-2 tracking-wide">Dashboard</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl px-4">
        {/* Weather Data Retrieval Card */}
        <Link href="/protected/weather" className="group block p-8 rounded-2xl shadow-xl border border-green-100 bg-white hover:bg-green-50 transition-all duration-200 hover:scale-[1.03] relative overflow-hidden">
          <h2 className="text-2xl font-bold mb-2 text-green-700 group-hover:text-green-800 transition">Weather Data Retrieval</h2>
          <p className="text-gray-600 mb-4">Access and analyze weather data for your needs.</p>
          <span className="inline-block mt-2 text-green-700 font-semibold group-hover:underline">Go to Weather Data &rarr;</span>
        </Link>
        {/* Insurance Product Development Card */}
        <Link href="/protected/products" className="group block p-8 rounded-2xl shadow-xl border border-green-100 bg-white hover:bg-green-50 transition-all duration-200 hover:scale-[1.03] relative overflow-hidden">
          <h2 className="text-2xl font-bold mb-2 text-green-700 group-hover:text-green-800 transition">Insurance Product Development</h2>
          <p className="text-gray-600 mb-4">Develop and manage insurance products.</p>
          <span className="inline-block mt-2 text-green-700 font-semibold group-hover:underline">Go to Products &rarr;</span>
        </Link>
        {/* Insure Smart Card */}
        <Link href="/protected/insure-smart" className="group block p-8 rounded-2xl shadow-xl border border-green-100 bg-white hover:bg-green-50 transition-all duration-200 hover:scale-[1.03] relative overflow-hidden">
          <h2 className="text-2xl font-bold mb-2 text-green-700 group-hover:text-green-800 transition">Insure Smart</h2>
          <p className="text-gray-600 mb-4">Design and optimize weather insurance products with a step-by-step wizard.</p>
          <span className="inline-block mt-2 text-green-700 font-semibold group-hover:underline">Go to Insure Smart &rarr;</span>
        </Link>
      </div>
    </div>
  );
} 