import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Cog6ToothIcon, UserIcon, BuildingOfficeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default async function SettingsPage() {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and system preferences</p>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Profile Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">User Profile</h3>
          </div>
          <p className="text-gray-600 mb-4">Update your personal information and preferences</p>
          <a 
            href="/protected/operations-dashboard/settings/user-profile"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
          >
            Manage Profile
          </a>
        </div>

        {/* Organization Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Organization</h3>
          </div>
          <p className="text-gray-600 mb-4">Manage organization settings and policies</p>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            Coming Soon
          </button>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Audit Log</h3>
          </div>
          <p className="text-gray-600 mb-4">View system activity and compliance logs</p>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mt-8">
        <Cog6ToothIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Management</h2>
        <p className="text-gray-600 mb-6">
          This section will be implemented in Phase 6. You&apos;ll be able to:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ User Management</div>
            <div>Update profiles and preferences</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Organization Settings</div>
            <div>Configure system policies</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">✓ Audit & Compliance</div>
            <div>Track system activity</div>
          </div>
        </div>
      </div>
    </div>
  );
}
