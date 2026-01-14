import {supabase} from './supabase';

export interface CustomerCommunication {
  id: string;
  company_id: string;
  employee_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  communication_type: 'email' | 'phone' | 'meeting' | 'sms';
  subject: string | null;
  notes: string | null;
  attachments: any[];
  communication_date: string;
  created_at: string;
}

export interface CommunicationFormData {
  employee_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  communication_type: 'email' | 'phone' | 'meeting' | 'sms';
  subject?: string;
  notes?: string;
  attachments?: any[];
  communication_date?: string;
}

export async function getCommunications(
  companyId?: string,
  employeeId?: string,
  communicationType?: 'email' | 'phone' | 'meeting' | 'sms',
): Promise<CustomerCommunication[]> {
  try {
    let query = supabase
      .from('customer_communications')
      .select('*')
      .order('communication_date', {ascending: false});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (communicationType) {
      query = query.eq('communication_type', communicationType);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting communications:', error);
    return [];
  }
}

export async function getCustomerMeetings(
  companyId: string,
  employeeId: string,
): Promise<CustomerCommunication[]> {
  return getCommunications(companyId, employeeId, 'meeting');
}

export async function createCommunication(
  companyId: string,
  communicationData: CommunicationFormData,
): Promise<CustomerCommunication | null> {
  try {
    const {data, error} = await supabase
      .from('customer_communications')
      .insert({
        company_id: companyId,
        employee_id: communicationData.employee_id,
        customer_name: communicationData.customer_name,
        customer_email: communicationData.customer_email || null,
        customer_phone: communicationData.customer_phone || null,
        communication_type: communicationData.communication_type,
        subject: communicationData.subject || null,
        notes: communicationData.notes || null,
        attachments: communicationData.attachments || [],
        communication_date: communicationData.communication_date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating communication:', error);
    return null;
  }
}

export async function updateCommunication(
  communicationId: string,
  communicationData: Partial<CommunicationFormData>,
): Promise<CustomerCommunication | null> {
  try {
    const {data, error} = await supabase
      .from('customer_communications')
      .update(communicationData)
      .eq('id', communicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating communication:', error);
    return null;
  }
}

export async function deleteCommunication(communicationId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('customer_communications')
      .delete()
      .eq('id', communicationId);
    return !error;
  } catch (error) {
    console.error('Error deleting communication:', error);
    return false;
  }
}

export async function getCommunicationStats(
  companyId?: string,
  employeeId?: string,
): Promise<{
  total: number;
  email: number;
  phone: number;
  meeting: number;
  sms: number;
}> {
  try {
    let query = supabase.from('customer_communications').select('communication_type');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;

    const communications = data || [];

    return {
      total: communications.length,
      email: communications.filter((c: any) => c.communication_type === 'email').length,
      phone: communications.filter((c: any) => c.communication_type === 'phone').length,
      meeting: communications.filter((c: any) => c.communication_type === 'meeting').length,
      sms: communications.filter((c: any) => c.communication_type === 'sms').length,
    };
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    return {
      total: 0,
      email: 0,
      phone: 0,
      meeting: 0,
      sms: 0,
    };
  }
}
