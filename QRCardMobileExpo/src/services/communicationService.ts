import {supabase} from './supabase';

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
