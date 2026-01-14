// Types from web app - adapted for mobile
export interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  tax_number: string | null
  tax_office: string | null
  logo_url: string | null
  background_image_url: string | null
  language: 'tr' | 'en'
  api_endpoint: string | null
  santral_id: string | null
  api_key: string | null
  api_secret: string | null
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
  role: string | null
  region_id: string | null
  created_at: string
}

export interface SocialLinks {
  instagram?: string
  linkedin?: string
  facebook?: string
  youtube?: string
  whatsapp?: string
}

export type CRMLeadStatus = 'Yeni' | 'Görüşüldü' | 'Satış Yapıldı' | 'Reddedildi' | 'Takipte'

export interface CRMLead {
  id: string
  company_id: string
  employee_id: string | null
  region_id: string | null
  customer_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  tc_no: string | null
  tax_no: string | null
  notes: string | null
  follow_up_date: string | null
  status: CRMLeadStatus
  created_at: string
  updated_at: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  company_id: string
  employee_id: string
  region_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  assigned_by: string
  checklist_items?: string[]
  checklist_completed?: string[]
  address?: string | null
  attachments?: string[]
  created_at: string
  updated_at: string
}

export type GoalType = 'sales' | 'leads' | 'appointments' | 'revenue'
export type PeriodType = 'monthly' | 'yearly'

export interface PerformanceGoal {
  id: string
  company_id: string
  employee_id: string
  goal_type: GoalType
  target_value: number
  current_value: number
  period_type: PeriodType
  period_start: string
  period_end: string
  created_at: string
  updated_at: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  company_id: string
  employee_id: string | null
  region_id: string | null
  transaction_type: TransactionType
  category: string
  amount: number
  currency: string
  payment_method: string | null
  description: string | null
  transaction_date: string
  created_at: string
}

export type CommunicationType = 'email' | 'phone' | 'meeting' | 'sms'

export interface CustomerCommunication {
  id: string
  company_id: string
  employee_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  communication_type: CommunicationType
  subject: string | null
  notes: string | null
  attachments: string[] | null
  communication_date: string
  created_at: string
}

export type CommissionType = 'percentage' | 'fixed'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled'

export interface CommissionPayment {
  id: string
  company_id: string
  employee_id: string
  transaction_id: string | null
  commission_amount: number
  payment_status: PaymentStatus
  payment_date: string | null
  notes: string | null
  created_at: string
}

export type CallType = 'outgoing' | 'incoming' | 'missed'
export type CallStatus = 'completed' | 'no_answer' | 'busy' | 'failed'

export interface CallLog {
  id: string
  company_id: string
  employee_id: string
  call_type: CallType
  phone_number: string
  customer_name: string | null
  customer_id: string | null
  call_duration: number
  call_status: CallStatus
  recording_url: string | null
  notes: string | null
  call_start_time: string
  call_end_time: string | null
  created_at: string
}

// Vehicle Tracking Types
export interface Vehicle {
  id: string
  company_id: string
  name: string
  plate_number: string | null
  device_id: string
  device_name: string | null
  employee_id: string | null
  region_id: string | null
  vehicle_type: 'car' | 'truck' | 'van' | 'motorcycle' | 'other'
  status: 'active' | 'inactive' | 'maintenance'
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface VehicleLocation {
  id: string
  vehicle_id: string
  latitude: number
  longitude: number
  altitude: number | null
  speed: number | null
  heading: number | null
  accuracy: number | null
  satellite_count: number | null
  battery_level: number | null
  signal_strength: number | null
  timestamp: string
  created_at: string
}

export interface VehicleCommand {
  id: string
  vehicle_id: string
  command_type: 'stop' | 'start' | 'lock' | 'unlock'
  status: 'pending' | 'sent' | 'executed' | 'failed'
  executed_at: string | null
  created_at: string
  created_by: string | null
}

// Role Management Types
export interface Role {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  page_name: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_at: string
}

export interface RoleFormData {
  name: string
  description?: string
  permissions?: RolePermission[]
}

// Region Management Types
export interface Region {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RegionFormData {
  name: string
  description?: string
}

// Quote Types
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: string
  company_id: string
  employee_id: string | null
  customer_id: string | null
  customer_name: string
  product_service: string | null
  description: string | null
  price: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  validity_date: string | null
  status: QuoteStatus
  notes: string | null
  attachments: any[]
  created_at: string
  updated_at: string
}

export interface QuoteFormData {
  employee_id: string
  customer_id?: string | null
  customer_name: string
  product_service?: string
  description?: string
  price: number
  tax_rate?: number
  validity_date?: string
  status?: QuoteStatus
  notes?: string
  attachments?: any[]
}

// Fixed Roles Constants
export const FIXED_ROLES = {
  COMPANY: 'Şirket',
  REGIONAL_MANAGER: 'Bölge Sorumlusu',
  CALL_CENTER: 'Çağrı Merkezi',
  MARKETING_STAFF: 'Pazarlama Personeli',
  CUSTOMER: 'Müşteri'
} as const

export type FixedRole = typeof FIXED_ROLES[keyof typeof FIXED_ROLES]
