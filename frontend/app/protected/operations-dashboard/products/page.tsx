import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProductLibrary } from "@/components/products/ProductLibrary";

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <ProductLibrary />;
}
