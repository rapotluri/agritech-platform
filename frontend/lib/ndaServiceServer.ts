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
    console.log('=== NDA ACCEPTANCE DEBUG START ===');
    console.log('Starting NDA acceptance process...');
    
    const supabase = await createClient();
    console.log('Supabase client created successfully');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { success: false, error: 'User not authenticated' }
    }

    console.log('User authenticated successfully:', { userId: user.id, email: user.email });

    // Test basic table access
    console.log('Testing basic table access...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('nda_acceptances')
        .select('id')
        .limit(1);

      console.log('Test query result:', { testData, testError });
    } catch (testErr) {
      console.log('Test query failed (this might be normal):', testErr);
    }

    // Test if we can see our own user record
    console.log('Testing app_users table access...');
    let appUser = null;
    try {
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_users')
        .select('id, access_revoked_at')
        .eq('id', user.id)
        .single();

      console.log('App user query result:', { appUserData, appUserError });
      appUser = appUserData;
    } catch (appUserErr) {
      console.log('App user query failed:', appUserErr);
    }

    // Check if user exists in app_users table
    if (!appUser) {
      console.error('❌ User not found in app_users table. This will cause RLS to fail.');
      return { success: false, error: 'User account not properly configured. Please contact support.' }
    }

    // Check if user access is revoked
    if (appUser.access_revoked_at) {
      console.error('❌ User access is revoked:', appUser.access_revoked_at);
      return { success: false, error: 'User access has been revoked. Please contact support.' }
    }

    console.log('✅ User validation passed:', appUser);

    const userIP = getUserIPFromHeaders(data.headers);
    const userAgent = getUserAgentFromHeaders(data.headers);
    const userLocale = getUserLocaleFromHeaders(data.headers);
    
    // Get geographic location from IP
    console.log('Getting geographic location from IP:', userIP);
    const locationData = await getUserLocationFromIP(userIP);
    console.log('Location data captured:', locationData);

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

    console.log('NDA acceptance data prepared:', ndaAcceptance);
    console.log('Attempting to insert NDA acceptance...');

    const { data: insertResult, error: insertError } = await supabase
      .from('nda_acceptances')
      .insert(ndaAcceptance)
      .select('id, user_id, accepted_at');

    if (insertError) {
      console.error('❌ INSERT FAILED:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return { success: false, error: insertError.message }
    }

    console.log('✅ NDA acceptance successful!');
    console.log('Insert result:', insertResult);
    console.log('=== NDA ACCEPTANCE DEBUG END ===');
    return { success: true }
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { success: false, error: 'Failed to accept NDA' }
  }
}
