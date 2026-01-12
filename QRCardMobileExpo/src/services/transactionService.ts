import {supabase} from './supabase';

export async function getTransactionStats(
  companyId?: string,
  employeeId?: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  total_income: number;
  total_expense: number;
  net_amount: number;
  income_count: number;
  expense_count: number;
}> {
  try {
    let query = supabase.from('transactions').select('transaction_type, amount');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const {data, error} = await query;

    if (error) throw error;

    const transactions = data || [];
    const income = transactions.filter((t: any) => t.transaction_type === 'income');
    const expense = transactions.filter((t: any) => t.transaction_type === 'expense');

    const total_income = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const total_expense = expense.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    return {
      total_income,
      total_expense,
      net_amount: total_income - total_expense,
      income_count: income.length,
      expense_count: expense.length,
    };
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return {
      total_income: 0,
      total_expense: 0,
      net_amount: 0,
      income_count: 0,
      expense_count: 0,
    };
  }
}
