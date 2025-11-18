export interface Company {
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

export interface ExtraLink {
  title: string
  url: string
  icon?: string
}

export interface AvailableHours {
  [key: string]: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface Appointment {
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

export interface Employee {
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
  social_links: SocialLinks | null
  profile_image_url: string | null
  extra_links: ExtraLink[] | null
  meeting_link: string | null
  cv_url: string | null
  pdf_url: string | null
  brochure_url: string | null
  presentation_url: string | null
  gallery_images: string[] | null
  available_hours: AvailableHours | null
  default_duration_minutes: number | null
  password_hash: string | null
  created_at: string
}

export interface SocialLinks {
  instagram?: string
  linkedin?: string
  facebook?: string
  youtube?: string
  whatsapp?: string
}

export interface EmployeeFormData {
  first_name: string
  last_name: string
  job_title: string
  department: string
  phone: string
  email: string
  about: string
  social_links: SocialLinks
  available_hours?: AvailableHours
  default_duration_minutes?: number
  password?: string
}

export type CRMLeadStatus = 'Yeni' | 'Görüşüldü' | 'Satış Yapıldı' | 'Reddedildi' | 'Takipte'

export interface CRMLead {
  id: string
  company_id: string
  employee_id: string | null
  customer_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  notes: string | null
  follow_up_date: string | null
  status: CRMLeadStatus
  created_at: string
  updated_at: string
}

export interface CRMLeadFormData {
  customer_name: string
  contact_name?: string
  phone?: string
  email?: string
  notes?: string
  follow_up_date?: string
  status: CRMLeadStatus
  employee_id?: string | null
}

export interface CRMStats {
  total: number
  today_follow_ups: number
  sales_completed: number
  in_follow_up: number
}

