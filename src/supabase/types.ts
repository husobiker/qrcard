export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          website: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          company_id: string
          first_name: string
          last_name: string
          job_title: string | null
          department: string | null
          phone: string | null
          email: string | null
          about: string | null
          social_links: Json | null
          profile_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          first_name: string
          last_name: string
          job_title?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          about?: string | null
          social_links?: Json | null
          profile_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          first_name?: string
          last_name?: string
          job_title?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          about?: string | null
          social_links?: Json | null
          profile_image_url?: string | null
          created_at?: string
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

