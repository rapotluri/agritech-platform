import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const InsureSmartWizard = dynamic(() => import("@/components/InsureSmartWizard"), { ssr: false });

export default async function InsureSmartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <InsureSmartWizard />;
} 