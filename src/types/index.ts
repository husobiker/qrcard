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

// Task Management Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  company_id: string
  employee_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  assigned_by: string
  created_at: string
  updated_at: string
}

export interface TaskFormData {
  employee_id: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
}

// Performance Goals Types
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

export interface GoalFormData {
  employee_id: string
  goal_type: GoalType
  target_value: number
  period_type: PeriodType
  period_start: string
  period_end: string
}

// Financial Transactions Types
export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  company_id: string
  employee_id: string | null
  transaction_type: TransactionType
  category: string
  amount: number
  currency: string
  payment_method: string | null
  description: string | null
  transaction_date: string
  created_at: string
}

export interface TransactionFormData {
  employee_id?: string | null
  transaction_type: TransactionType
  category: string
  amount: number
  currency?: string
  payment_method?: string
  description?: string
  transaction_date?: string
}

// Customer Communication Types
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

export interface CommunicationFormData {
  employee_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  communication_type: CommunicationType
  subject?: string
  notes?: string
  attachments?: string[]
  communication_date?: string
}

// Commission Types
export type CommissionType = 'percentage' | 'fixed'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled'

export interface CommissionSetting {
  id: string
  company_id: string
  employee_id: string
  commission_type: CommissionType
  commission_rate: number
  min_sales_amount: number | null
  created_at: string
  updated_at: string
}

export interface CommissionSettingFormData {
  employee_id: string
  commission_type: CommissionType
  commission_rate: number
  min_sales_amount?: number | null
}

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

export interface CommissionPaymentFormData {
  employee_id: string
  transaction_id?: string | null
  commission_amount: number
  payment_status: PaymentStatus
  payment_date?: string
  notes?: string
}

// Call Log Types
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

export interface CallLogFormData {
  employee_id: string
  call_type: CallType
  phone_number: string
  customer_name?: string
  customer_id?: string | null
  call_duration?: number
  call_status?: CallStatus
  recording_url?: string
  notes?: string
  call_start_time: string
  call_end_time?: string
}

// SIP Settings Types
export interface EmployeeSipSettings {
  id: string
  company_id: string
  employee_id: string
  sip_username: string
  sip_password: string
  extension: string | null
  sip_server: string | null
  sip_port: number | null
  webrtc_enabled: boolean
  api_endpoint: string | null
  santral_id: string | null
  api_key: string | null
  api_secret: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeSipSettingsFormData {
  employee_id: string
  sip_username: string
  sip_password: string
  extension?: string
  sip_server?: string
  sip_port?: number
  webrtc_enabled?: boolean
  api_endpoint?: string
  santral_id?: string
  api_key?: string
  api_secret?: string
}

export interface CompanySipSettings {
  id: string
  company_id: string
  sip_server: string
  sip_port: number
  sip_domain: string | null
  sip_protocol: 'udp' | 'tcp' | 'tls' | 'wss'
  webrtc_gateway_url: string | null
  created_at: string
  updated_at: string
}

export interface CompanySipSettingsFormData {
  sip_server: string
  sip_port?: number
  sip_domain?: string
  sip_protocol?: 'udp' | 'tcp' | 'tls' | 'wss'
  webrtc_gateway_url?: string
}
