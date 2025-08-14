import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UsersIcon, PlusIcon } from "@heroicons/react/24/outline";

export default async function FarmersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farmer Management</h1>
            <p className="text-gray-600 mt-2">Manage farmer enrollments and profiles</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Add Farmer</span>
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Farmer Management</h2>
        <p className="text-gray-600 mb-6">
          This section will be implemented in Phase 3. You'll be able to:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Enroll Farmers</div>
            <div>Add new farmers to the system</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Manage Profiles</div>
            <div>Update farmer information and plots</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Track Status</div>
            <div>Monitor enrollment and KYC status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
