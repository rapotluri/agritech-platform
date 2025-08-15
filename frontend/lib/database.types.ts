// Database types matching the Supabase schema
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          type: 'insurer' | 'bank' | 'mfi' | 'aggregator' | 'agent'
          status: 'active' | 'suspended'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'insurer' | 'bank' | 'mfi' | 'aggregator' | 'agent'
          status?: 'active' | 'suspended'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'insurer' | 'bank' | 'mfi' | 'aggregator' | 'agent'
          status?: 'active' | 'suspended'
          created_at?: string
        }
      }
      app_users: {
        Row: {
          id: string
          org_id: string
          role: 'owner' | 'standard'
          email: string
          display_name: string | null
          nda_version: string | null
          nda_accepted_at: string | null
          access_revoked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id: string
          role?: 'owner' | 'standard'
          email: string
          display_name?: string | null
          nda_version?: string | null
          nda_accepted_at?: string | null
          access_revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          role?: 'owner' | 'standard'
          email?: string
          display_name?: string | null
          nda_version?: string | null
          nda_accepted_at?: string | null
          access_revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      farmers: {
        Row: {
          id: string
          created_by_user_id: string
          english_name: string
          sex: 'male' | 'female' | 'other'
          phone: string
          national_id: string
          dob: string | null
          enrolment_date: string
          province: string
          district: string
          commune: string
          village: string | null
          kyc_status: 'pending' | 'verified' | 'rejected'
          bank_account_usd: string | null
          bank_account_khr: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_user_id: string
          english_name: string
          sex: 'male' | 'female' | 'other'
          phone: string
          national_id: string
          dob?: string | null
          enrolment_date: string
          province: string
          district: string
          commune: string
          village?: string | null
          kyc_status?: 'pending' | 'verified' | 'rejected'
          bank_account_usd?: string | null
          bank_account_khr?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_user_id?: string
          english_name?: string
          sex?: 'male' | 'female' | 'other'
          phone?: string
          national_id?: string
          dob?: string | null
          enrolment_date?: string
          province?: string
          district?: string
          commune?: string
          village?: string | null
          kyc_status?: 'pending' | 'verified' | 'rejected'
          bank_account_usd?: string | null
          bank_account_khr?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plots: {
        Row: {
          id: string
          farmer_id: string
          province: string
          district: string
          commune: string
          village: string | null
          location_lat: number | null
          location_long: number | null
          crop: string
          area_ha: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          province: string
          district: string
          commune: string
          village?: string | null
          location_lat?: number | null
          location_long?: number | null
          crop: string
          area_ha: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          province?: string
          district?: string
          commune?: string
          village?: string | null
          location_lat?: number | null
          location_long?: number | null
          crop?: string
          area_ha?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          created_by_user_id: string
          name: string
          crop: string
          region: string | any // jsonb
          status: 'draft' | 'live' | 'archived'
          triggers: any // jsonb
          coverage_window: string
          terms: any // jsonb
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_user_id: string
          name: string
          crop: string
          region: string | any
          status?: 'draft' | 'live' | 'archived'
          triggers: any
          coverage_window: string
          terms: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_user_id?: string
          name?: string
          crop?: string
          region?: string | any
          status?: 'draft' | 'live' | 'archived'
          triggers?: any
          coverage_window?: string
          terms?: any
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          created_by_user_id: string
          farmer_id: string
          plot_id: string | null
          product_id: string
          season: string
          premium: number
          sum_insured: number
          status: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_user_id: string
          farmer_id: string
          plot_id?: string | null
          product_id: string
          season: string
          premium: number
          sum_insured: number
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_user_id?: string
          farmer_id?: string
          plot_id?: string | null
          product_id?: string
          season?: string
          premium?: number
          sum_insured?: number
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Application types derived from database types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type AppUser = Database['public']['Tables']['app_users']['Row']
export type Farmer = Database['public']['Tables']['farmers']['Row']
export type Plot = Database['public']['Tables']['plots']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']

// Insert types
export type FarmerInsert = Database['public']['Tables']['farmers']['Insert']
export type PlotInsert = Database['public']['Tables']['plots']['Insert']

// Update types
export type FarmerUpdate = Database['public']['Tables']['farmers']['Update']
export type PlotUpdate = Database['public']['Tables']['plots']['Update']

// Extended types for UI components
export interface FarmerWithPlots extends Farmer {
  plots?: Plot[]
  plotsCount?: number
  assignedProduct?: string | null
}

export interface FarmerFilters {
  searchQuery?: string
  province?: string
  district?: string
  commune?: string
  kycStatus?: 'all' | 'pending' | 'verified' | 'rejected'
  product?: string
}

// Define sortable farmer columns (exclude virtual/computed fields)
export type SortableFarmerColumn = 
  | 'english_name'
  | 'sex' 
  | 'phone'
  | 'national_id'
  | 'dob'
  | 'enrolment_date'
  | 'province'
  | 'district'
  | 'commune'
  | 'village'
  | 'kyc_status'
  | 'bank_account_usd'
  | 'bank_account_khr'
  | 'created_at'
  | 'updated_at'

export interface FarmerSorting {
  column: SortableFarmerColumn | null
  direction: 'asc' | 'desc'
}

// Create a plot interface for forms (without farmer_id since it's set during submission)
export interface PlotFormData {
  province: string
  district: string
  commune: string
  village?: string | null
  location_lat?: number | null
  location_long?: number | null
  crop: string
  area_ha: number
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface FarmersResponse {
  farmers: FarmerWithPlots[]
  total: number
  page: number
  totalPages: number
}
