import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OperationsSidebar } from "@/components/operations-dashboard/OperationsSidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user has accepted NDA with smart fallback
  try {
    const { data: ndaAcceptance, error: ndaError } = await supabase
      .from('nda_acceptances')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Smart fallback: Only allow access if we're CERTAIN user has accepted NDA
    if (ndaError || !ndaAcceptance || !ndaAcceptance.id) {
      // Any uncertainty = redirect to NDA page (safe fallback)
      return redirect("/legal/nda");
    } else {
      // User has clearly accepted NDA - allow access
    }
  } catch {
    // Any error = redirect to NDA page (safe fallback)
    return redirect("/legal/nda");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <OperationsSidebar user={user} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
