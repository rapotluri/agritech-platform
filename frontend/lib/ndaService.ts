import { createClient } from '@/utils/supabase/client'
import { Database } from './database.types'
import { getUserIP, getUserAgent, getUserLocale } from './utils/ndaUtils'

type NDAAcceptanceInsert = Database['public']['Tables']['nda_acceptances']['Insert']

const supabase = createClient()

export interface NDAAcceptanceData {
  nda_title: string
  nda_pdf_url: string
  nda_sha256: string
  ip?: string // Made optional since we'll auto-detect
  user_agent?: string // Made optional since we'll auto-detect
  locale?: string
}

export interface NDAAcceptanceDataServer {
  nda_title: string
  nda_pdf_url: string
  nda_sha256: string
  headers: Headers
}

export interface NDAStatus {
  hasAccepted: boolean
  acceptedAt?: string
  ndaTitle?: string
  ndaPdfUrl?: string
  ndaSha256?: string
}

export interface CurrentNDA {
  title: string
  pdf_url: string
  sha256: string
  version: string
  last_updated: string
}

/**
 * Accept NDA for the current user (Client-side version)
 */
export async function acceptNDA(data: NDAAcceptanceData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const ndaAcceptance: NDAAcceptanceInsert = {
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      nda_title: data.nda_title,
      nda_pdf_url: data.nda_pdf_url,
      nda_sha256: data.nda_sha256,
      ip: data.ip || getUserIP(),
      user_agent: data.user_agent || getUserAgent(),
      locale: data.locale || getUserLocale(),
    }

    const { error: insertError } = await supabase
      .from('nda_acceptances')
      .insert(ndaAcceptance)

    if (insertError) {
      console.error('Error inserting NDA acceptance:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error accepting NDA:', error)
    return { success: false, error: 'Failed to accept NDA' }
  }
}

/**
 * Get NDA acceptance status for the current user
 */
export async function getNDAStatus(): Promise<NDAStatus> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { hasAccepted: false }
    }

    const { data, error } = await supabase
      .from('nda_acceptances')
      .select('*')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching NDA status:', error)
      return { hasAccepted: false }
    }

    if (!data) {
      return { hasAccepted: false }
    }

    return {
      hasAccepted: true,
      acceptedAt: data.accepted_at,
      ndaTitle: data.nda_title,
      ndaPdfUrl: data.nda_pdf_url,
      ndaSha256: data.nda_sha256,
    }
  } catch (error) {
    console.error('Error getting NDA status:', error)
    return { hasAccepted: false }
  }
}

/**
 * Get current NDA document information
 * This would typically come from a configuration or settings table
 * For now, returning mock data - you can update this based on your setup
 */
export async function getCurrentNDA(): Promise<CurrentNDA> {
  // TODO: Replace with actual NDA configuration from your system
  // This could come from a settings table, environment variables, or Supabase config
  
  return {
    title: 'Non-Disclosure and Use Limitation Agreement',
    pdf_url: '/api/nda/current-document', // This will be updated when we implement storage
    sha256: 'placeholder-sha256-hash', // This will be updated with actual hash
    version: '1.0',
    last_updated: new Date().toISOString(),
  }
}

/**
 * Check if user has platform access (NDA accepted + not revoked)
 */
export async function hasPlatformAccess(): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return false
    }

    // Check if user exists in app_users and access is not revoked
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('access_revoked_at')
      .eq('id', user.id)
      .single()

    if (appUserError || !appUser) {
      return false
    }

    if (appUser.access_revoked_at) {
      return false
    }

    // Check if NDA is accepted
    const ndaStatus = await getNDAStatus()
    return ndaStatus.hasAccepted
  } catch (error) {
    console.error('Error checking platform access:', error)
    return false
  }
}


