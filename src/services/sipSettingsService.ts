import { supabase } from '@/supabase/client'
import type {
  EmployeeSipSettings,
  EmployeeSipSettingsFormData,
  CompanySipSettings,
  CompanySipSettingsFormData,
} from '@/types'

// Employee SIP Settings
export async function getEmployeeSipSettings(
  employeeId: string
): Promise<EmployeeSipSettings | null> {
  try {
    console.log('Fetching employee SIP settings for:', employeeId)
    const { data, error } = await supabase
      .from('employee_sip_settings')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching employee SIP settings:', error)
      return null
    }
    console.log('Employee SIP settings found:', !!data)
    return data
  } catch (error) {
    console.error('Error fetching employee SIP settings:', error)
    return null
  }
}

export async function createEmployeeSipSettings(
  companyId: string,
  settingsData: EmployeeSipSettingsFormData
): Promise<EmployeeSipSettings | null> {
  try {
    const { data, error } = await supabase
      .from('employee_sip_settings')
      .insert({
        company_id: companyId,
        employee_id: settingsData.employee_id,
        sip_username: settingsData.sip_username,
        sip_password: settingsData.sip_password,
        extension: settingsData.extension || null,
        sip_server: settingsData.sip_server || null,
        sip_port: settingsData.sip_port || 5060,
        webrtc_enabled: settingsData.webrtc_enabled || false,
        api_endpoint: settingsData.api_endpoint || null,
        santral_id: settingsData.santral_id || null,
        api_key: settingsData.api_key || null,
        api_secret: settingsData.api_secret || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating employee SIP settings:', error)
    return null
  }
}

export async function updateEmployeeSipSettings(
  employeeId: string,
  settingsData: Partial<EmployeeSipSettingsFormData>
): Promise<EmployeeSipSettings | null> {
  try {
    const updateData: any = {}

    if (settingsData.sip_username !== undefined) updateData.sip_username = settingsData.sip_username
    if (settingsData.sip_password !== undefined) updateData.sip_password = settingsData.sip_password
    if (settingsData.extension !== undefined) updateData.extension = settingsData.extension || null
    if (settingsData.sip_server !== undefined) updateData.sip_server = settingsData.sip_server || null
    if (settingsData.sip_port !== undefined) updateData.sip_port = settingsData.sip_port
    if (settingsData.webrtc_enabled !== undefined) updateData.webrtc_enabled = settingsData.webrtc_enabled
    if (settingsData.api_endpoint !== undefined) updateData.api_endpoint = settingsData.api_endpoint || null
    if (settingsData.santral_id !== undefined) updateData.santral_id = settingsData.santral_id || null
    if (settingsData.api_key !== undefined) updateData.api_key = settingsData.api_key || null
    if (settingsData.api_secret !== undefined) updateData.api_secret = settingsData.api_secret || null

    const { data, error } = await supabase
      .from('employee_sip_settings')
      .update(updateData as any)
      .eq('employee_id', employeeId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating employee SIP settings:', error)
    return null
  }
}

export async function deleteEmployeeSipSettings(employeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('employee_sip_settings')
      .delete()
      .eq('employee_id', employeeId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting employee SIP settings:', error)
    return false
  }
}

// Company SIP Settings
export async function getCompanySipSettings(
  companyId: string
): Promise<CompanySipSettings | null> {
  try {
    console.log('Fetching company SIP settings for:', companyId)
    // Use .select() instead of .maybeSingle() to avoid 406 errors with RLS
    const { data, error } = await supabase
      .from('company_sip_settings')
      .select('*')
      .eq('company_id', companyId)
      .limit(1)

    if (error) {
      console.error('Error fetching company SIP settings:', error)
      return null
    }
    
    // Return first result or null
    const result = data && data.length > 0 ? data[0] : null
    console.log('Company SIP settings found:', !!result)
    return result
  } catch (error) {
    console.error('Error fetching company SIP settings:', error)
    return null
  }
}

export async function createCompanySipSettings(
  companyId: string,
  settingsData: CompanySipSettingsFormData
): Promise<CompanySipSettings | null> {
  try {
    const { data, error } = await supabase
      .from('company_sip_settings')
      .insert({
        company_id: companyId,
        sip_server: settingsData.sip_server,
        sip_port: settingsData.sip_port || 5060,
        sip_domain: settingsData.sip_domain || null,
        sip_protocol: settingsData.sip_protocol || 'udp',
        webrtc_gateway_url: settingsData.webrtc_gateway_url || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating company SIP settings:', error)
    return null
  }
}

export async function updateCompanySipSettings(
  companyId: string,
  settingsData: Partial<CompanySipSettingsFormData>
): Promise<CompanySipSettings | null> {
  try {
    const updateData: any = {}

    if (settingsData.sip_server !== undefined) updateData.sip_server = settingsData.sip_server
    if (settingsData.sip_port !== undefined) updateData.sip_port = settingsData.sip_port
    if (settingsData.sip_domain !== undefined) updateData.sip_domain = settingsData.sip_domain || null
    if (settingsData.sip_protocol !== undefined) updateData.sip_protocol = settingsData.sip_protocol
    if (settingsData.webrtc_gateway_url !== undefined)
      updateData.webrtc_gateway_url = settingsData.webrtc_gateway_url || null

    const { data, error } = await supabase
      .from('company_sip_settings')
      .update(updateData as any)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating company SIP settings:', error)
    return null
  }
}

export async function deleteCompanySipSettings(companyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_sip_settings')
      .delete()
      .eq('company_id', companyId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting company SIP settings:', error)
    return false
  }
}

