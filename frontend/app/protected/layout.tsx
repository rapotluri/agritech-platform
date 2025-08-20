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

  // Check if user has accepted NDA
  const { data: ndaAcceptance, error: ndaError } = await supabase
    .from('nda_acceptances')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // If NDA check fails or user hasn't accepted NDA, redirect to NDA page
  if (ndaError || !ndaAcceptance) {
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
