import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ClaimsManagement } from "@/components/claims/ClaimsManagement";

export default async function ClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <ClaimsManagement />;
}
