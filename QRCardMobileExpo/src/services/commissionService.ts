import {supabase} from './supabase';

export async function getCommissionStats(
  companyId?: string,
  employeeId?: string,
): Promise<{
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
  payment_count: number;
}> {
  try {
    let query = supabase.from('commission_payments').select('commission_amount, payment_status');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;

    const payments = data || [];
    const paid = payments.filter((p: any) => p.payment_status === 'paid');
    const pending = payments.filter((p: any) => p.payment_status === 'pending');

    return {
      total_commission: payments.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      paid_commission: paid.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      pending_commission: pending.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      payment_count: payments.length,
    };
  } catch (error) {
    console.error('Error fetching commission stats:', error);
    return {
      total_commission: 0,
      paid_commission: 0,
      pending_commission: 0,
      payment_count: 0,
    };
  }
}
