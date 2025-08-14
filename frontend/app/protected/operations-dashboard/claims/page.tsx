import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default async function ClaimsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
            <p className="text-gray-600 mt-2">Process and track insurance claims</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Export Claims</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Bulk Approve</span>
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Claims Management</h2>
        <p className="text-gray-600 mb-6">
          This section will be implemented in Phase 5. You'll be able to:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Review Claims</div>
            <div>Examine claim details and documentation</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Process Approvals</div>
            <div>Approve or reject claims efficiently</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Track Status</div>
            <div>Monitor claim processing progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}
