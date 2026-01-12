import {supabase} from './supabase';

export interface EmployeeSipSettings {
  id: string;
  company_id: string;
  employee_id: string;
  sip_username: string;
  sip_password: string;
  extension: string | null;
  sip_server: string | null;
  sip_port: number | null;
  webrtc_enabled: boolean;
  api_endpoint: string | null;
  santral_id: string | null;
  api_key: string | null;
  api_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSipSettingsFormData {
  employee_id: string;
  sip_username: string;
  sip_password: string;
  extension?: string;
  sip_server?: string;
  sip_port?: number;
  webrtc_enabled?: boolean;
  api_endpoint?: string;
  santral_id?: string;
  api_key?: string;
  api_secret?: string;
}

export async function getEmployeeSipSettings(
  employeeId: string,
): Promise<EmployeeSipSettings | null> {
  try {
    const {data, error} = await supabase
      .from('employee_sip_settings')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching employee SIP settings:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching employee SIP settings:', error);
    return null;
  }
}

export async function createEmployeeSipSettings(
  companyId: string,
  settingsData: EmployeeSipSettingsFormData,
): Promise<EmployeeSipSettings | null> {
  try {
    const {data, error} = await supabase
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
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating employee SIP settings:', error);
    return null;
  }
}

export async function updateEmployeeSipSettings(
  employeeId: string,
  settingsData: Partial<EmployeeSipSettingsFormData>,
): Promise<EmployeeSipSettings | null> {
  try {
    const updateData: any = {};

    if (settingsData.sip_username !== undefined)
      updateData.sip_username = settingsData.sip_username;
    if (settingsData.sip_password !== undefined)
      updateData.sip_password = settingsData.sip_password;
    if (settingsData.extension !== undefined)
      updateData.extension = settingsData.extension || null;
    if (settingsData.sip_server !== undefined)
      updateData.sip_server = settingsData.sip_server || null;
    if (settingsData.sip_port !== undefined) updateData.sip_port = settingsData.sip_port;
    if (settingsData.webrtc_enabled !== undefined)
      updateData.webrtc_enabled = settingsData.webrtc_enabled;
    if (settingsData.api_endpoint !== undefined)
      updateData.api_endpoint = settingsData.api_endpoint || null;
    if (settingsData.santral_id !== undefined)
      updateData.santral_id = settingsData.santral_id || null;
    if (settingsData.api_key !== undefined)
      updateData.api_key = settingsData.api_key || null;
    if (settingsData.api_secret !== undefined)
      updateData.api_secret = settingsData.api_secret || null;

    const {data, error} = await supabase
      .from('employee_sip_settings')
      .update(updateData as any)
      .eq('employee_id', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating employee SIP settings:', error);
    return null;
  }
}
