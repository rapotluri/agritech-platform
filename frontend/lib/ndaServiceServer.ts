import { createClient } from '@/utils/supabase/server'
import { Database } from './database.types'
import { getUserIPFromHeaders, getUserAgentFromHeaders, getUserLocaleFromHeaders, getUserLocationFromIP } from './utils/ndaUtils'

type NDAAcceptanceInsert = Database['public']['Tables']['nda_acceptances']['Insert']

export interface NDAAcceptanceDataServer {
  nda_title: string
  nda_pdf_url: string
  nda_sha256: string
  headers: Headers
}

/**
 * Accept NDA for the current user (Server-side version)
 * This function captures IP, user-agent, and locale from request headers
 */
export async function acceptNDAServer(data: NDAAcceptanceDataServer): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Test if we can access the table at all - but ignore errors for now
    try {
      await supabase
        .from('nda_acceptances')
        .select('id')
        .limit(1);

      // Test query completed
    } catch {
      // Test query failed (this might be normal)
    }

    // Test if we can see our own user record
    let appUser = null;
    try {
      const { data: appUserData } = await supabase
        .from('app_users')
        .select('id, access_revoked_at')
        .eq('id', user.id)
        .single();

      appUser = appUserData;
    } catch {
      // App user query failed
    }

    // Check if user exists in app_users table
    if (!appUser) {
      return { success: false, error: 'User account not properly configured. Please contact support.' }
    }

    // Check if user access is revoked
    if (appUser.access_revoked_at) {
      return { success: false, error: 'User access has been revoked. Please contact support.' }
    }

    const userIP = getUserIPFromHeaders(data.headers);
    const userAgent = getUserAgentFromHeaders(data.headers);
    const userLocale = getUserLocaleFromHeaders(data.headers);
    
    // Get geographic location from IP
    const locationData = await getUserLocationFromIP(userIP);

    const ndaAcceptance: NDAAcceptanceInsert = {
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      nda_title: data.nda_title,
      nda_pdf_url: data.nda_pdf_url,
      nda_sha256: data.nda_sha256,
      ip: userIP,
      user_agent: userAgent,
      locale: userLocale,
      country: locationData.country,
      country_code: locationData.country_code,
      region: locationData.region,
      city: locationData.city,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timezone: locationData.timezone,
    }

    const { error: insertError } = await supabase
      .from('nda_acceptances')
      .insert(ndaAcceptance)
      .select('id, user_id, accepted_at');

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to accept NDA' }
  }
}
