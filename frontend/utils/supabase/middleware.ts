import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();

    // protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // NDA check for authenticated users accessing protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && !user.error && user.data.user) {
      try {
        // Check if user has accepted NDA with smart fallback
        const { data: ndaAcceptance, error: ndaError } = await supabase
          .from('nda_acceptances')
          .select('id')
          .eq('user_id', user.data.user.id)
          .single();

        // Smart fallback: Only allow access if we're CERTAIN user has accepted NDA
        if (ndaError || !ndaAcceptance || !ndaAcceptance.id) {
          // Any uncertainty = redirect to NDA page (safe fallback)
          if (request.nextUrl.pathname !== '/legal/nda') {
            return NextResponse.redirect(new URL("/legal/nda", request.url));
          }
        } else {
          // User has clearly accepted NDA - allow access
        }
      } catch (error) {
        // Any error = redirect to NDA page (safe fallback)
        if (request.nextUrl.pathname !== '/legal/nda') {
          return NextResponse.redirect(new URL("/legal/nda", request.url));
        }
      }
    }

    if (request.nextUrl.pathname === "/" && !user.error) {
      return NextResponse.redirect(new URL("/protected/operations-dashboard", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
