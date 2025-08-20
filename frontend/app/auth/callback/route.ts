import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // After successful session exchange, check if user needs NDA
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      try {
        // Check if user has accepted NDA with smart fallback
        const { data: ndaAcceptance, error: ndaError } = await supabase
          .from('nda_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .single();

        // Smart fallback: Only skip NDA if we're CERTAIN user has accepted it
        if (!ndaError && ndaAcceptance && ndaAcceptance.id) {
          // User has clearly accepted NDA - go to dashboard
          console.log('User has clearly accepted NDA, redirecting to dashboard');
          return NextResponse.redirect(`${origin}/protected/operations-dashboard`);
        } else {
          // Any uncertainty = show NDA page (safe fallback)
          console.log('NDA status unclear or not accepted, redirecting to NDA page');
          return NextResponse.redirect(`${origin}/legal/nda`);
        }
      } catch (error) {
        // Any error = show NDA page (safe fallback)
        console.log('Error checking NDA status, falling back to NDA page:', error);
        return NextResponse.redirect(`${origin}/legal/nda`);
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Fallback: redirect to NDA page (safe default)
  return NextResponse.redirect(`${origin}/legal/nda`);
}
