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
          background_image_url: string | null
          language: 'tr' | 'en'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          address?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          background_image_url?: string | null
          language?: 'tr' | 'en'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          background_image_url?: string | null
          language?: 'tr' | 'en'
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          company_id: string
          first_name: string
          last_name: string
          username: string | null
          password_hash: string | null
          job_title: string | null
          department: string | null
          phone: string | null
          email: string | null
          about: string | null
          social_links: Json | null
          profile_image_url: string | null
          extra_links: Json | null
          meeting_link: string | null
          cv_url: string | null
          pdf_url: string | null
          brochure_url: string | null
          presentation_url: string | null
          gallery_images: Json | null
          available_hours: Json | null
          default_duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          first_name: string
          last_name: string
          username?: string | null
          password_hash?: string | null
          job_title?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          about?: string | null
          social_links?: Json | null
          profile_image_url?: string | null
          extra_links?: Json | null
          meeting_link?: string | null
          cv_url?: string | null
          pdf_url?: string | null
          brochure_url?: string | null
          presentation_url?: string | null
          gallery_images?: Json | null
          available_hours?: Json | null
          default_duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          first_name?: string
          last_name?: string
          username?: string | null
          password_hash?: string | null
          job_title?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          about?: string | null
          social_links?: Json | null
          profile_image_url?: string | null
          extra_links?: Json | null
          meeting_link?: string | null
          cv_url?: string | null
          pdf_url?: string | null
          brochure_url?: string | null
          presentation_url?: string | null
          gallery_images?: Json | null
          available_hours?: Json | null
          default_duration_minutes?: number | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          appointment_date: string
          duration_minutes: number
          notes: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          appointment_date: string
          duration_minutes?: number
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          appointment_date?: string
          duration_minutes?: number
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          employee_id: string
          event_type: 'view' | 'click'
          event_data: Json | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          event_type: 'view' | 'click'
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          event_type?: 'view' | 'click'
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
      }
      crm_leads: {
        Row: {
          id: string
          company_id: string
          employee_id: string | null
          customer_name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          notes: string | null
          follow_up_date: string | null
          status: 'Yeni' | 'Görüşüldü' | 'Satış Yapıldı' | 'Reddedildi' | 'Takipte'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id?: string | null
          customer_name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          follow_up_date?: string | null
          status?: 'Yeni' | 'Görüşüldü' | 'Satış Yapıldı' | 'Reddedildi' | 'Takipte'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string | null
          customer_name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          follow_up_date?: string | null
          status?: 'Yeni' | 'Görüşüldü' | 'Satış Yapıldı' | 'Reddedildi' | 'Takipte'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_employee: {
        Args: {
          emp_username: string
          emp_password: string
        }
        Returns: {
          id: string
          company_id: string
          first_name: string
          last_name: string
          username: string | null
          job_title: string | null
          department: string | null
          phone: string | null
          email: string | null
          about: string | null
          social_links: Json | null
          profile_image_url: string | null
          extra_links: Json | null
          meeting_link: string | null
          cv_url: string | null
          pdf_url: string | null
          brochure_url: string | null
          presentation_url: string | null
          gallery_images: Json | null
          available_hours: Json | null
          default_duration_minutes: number | null
          password_hash: string | null
        }[]
      }
      generate_username: {
        Args: {
          first_name: string
          last_name: string
        }
        Returns: string
      }
      hash_password: {
        Args: {
          plain_password: string
        }
        Returns: string
      }
      verify_password: {
        Args: {
          plain_password: string
          hashed_password: string
        }
        Returns: boolean
      }
      get_employee_view_count: {
        Args: {
          emp_id: string
        }
        Returns: number
      }
      get_employee_click_count: {
        Args: {
          emp_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
