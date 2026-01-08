import { supabase } from '@/supabase/client'
import type { Transaction, TransactionFormData } from '@/types'

export async function createTransaction(
  companyId: string,
  transactionData: TransactionFormData
): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        company_id: companyId,
        employee_id: transactionData.employee_id || null,
        transaction_type: transactionData.transaction_type,
        category: transactionData.category,
        amount: transactionData.amount,
        currency: transactionData.currency || 'TRY',
        payment_method: transactionData.payment_method || null,
        description: transactionData.description || null,
        transaction_date: transactionData.transaction_date || new Date().toISOString().split('T')[0],
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating transaction:', error)
    return null
  }
}

export async function getTransactions(
  companyId?: string,
  employeeId?: string,
  startDate?: string,
  endDate?: string
): Promise<Transaction[]> {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return null
  }
}

export async function updateTransaction(
  transactionId: string,
  transactionData: Partial<TransactionFormData>
): Promise<Transaction | null> {
  try {
    const updateData: any = {}
    
    if (transactionData.transaction_type !== undefined) updateData.transaction_type = transactionData.transaction_type
    if (transactionData.category !== undefined) updateData.category = transactionData.category
    if (transactionData.amount !== undefined) updateData.amount = transactionData.amount
    if (transactionData.currency !== undefined) updateData.currency = transactionData.currency
    if (transactionData.payment_method !== undefined) updateData.payment_method = transactionData.payment_method || null
    if (transactionData.description !== undefined) updateData.description = transactionData.description || null
    if (transactionData.transaction_date !== undefined) updateData.transaction_date = transactionData.transaction_date
    if (transactionData.employee_id !== undefined) updateData.employee_id = transactionData.employee_id || null

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData as any)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating transaction:', error)
    return null
  }
}

export async function deleteTransaction(transactionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return false
  }
}

export async function getTransactionStats(
  companyId?: string,
  employeeId?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total_income: number
  total_expense: number
  net_amount: number
  income_count: number
  expense_count: number
}> {
  try {
    let query = supabase.from('transactions').select('transaction_type, amount')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const transactions = data || []
    const income = transactions.filter((t: any) => t.transaction_type === 'income')
    const expense = transactions.filter((t: any) => t.transaction_type === 'expense')

    const total_income = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0)
    const total_expense = expense.reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    return {
      total_income,
      total_expense,
      net_amount: total_income - total_expense,
      income_count: income.length,
      expense_count: expense.length,
    }
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    return {
      total_income: 0,
      total_expense: 0,
      net_amount: 0,
      income_count: 0,
      expense_count: 0,
    }
  }
}


