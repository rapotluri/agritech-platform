import Header from "@/components/Header";
import ProductCreation from "@/components/ProductCreation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function InsuranceProducts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <ProductCreation />
      </div>
    </>
  );
}
