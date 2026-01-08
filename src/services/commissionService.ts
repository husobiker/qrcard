import { supabase } from '@/supabase/client'
import type {
  CommissionSetting,
  CommissionSettingFormData,
  CommissionPayment,
  CommissionPaymentFormData,
  PaymentStatus,
} from '@/types'

export async function createCommissionSetting(
  companyId: string,
  settingData: CommissionSettingFormData
): Promise<CommissionSetting | null> {
  try {
    const { data, error } = await supabase
      .from('commission_settings')
      .insert({
        company_id: companyId,
        employee_id: settingData.employee_id,
        commission_type: settingData.commission_type,
        commission_rate: settingData.commission_rate,
        min_sales_amount: settingData.min_sales_amount || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating commission setting:', error)
    return null
  }
}

export async function getCommissionSettings(
  companyId?: string,
  employeeId?: string
): Promise<CommissionSetting[]> {
  try {
    let query = supabase
      .from('commission_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching commission settings:', error)
    return []
  }
}

export async function getCommissionSettingById(settingId: string): Promise<CommissionSetting | null> {
  try {
    const { data, error } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('id', settingId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching commission setting:', error)
    return null
  }
}

export async function getCommissionSettingByEmployee(
  companyId: string,
  employeeId: string
): Promise<CommissionSetting | null> {
  try {
    const { data, error } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('company_id', companyId)
      .eq('employee_id', employeeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error('Error fetching commission setting by employee:', error)
    return null
  }
}

export async function updateCommissionSetting(
  settingId: string,
  settingData: Partial<CommissionSettingFormData>
): Promise<CommissionSetting | null> {
  try {
    const updateData: any = {}
    
    if (settingData.commission_type !== undefined) updateData.commission_type = settingData.commission_type
    if (settingData.commission_rate !== undefined) updateData.commission_rate = settingData.commission_rate
    if (settingData.min_sales_amount !== undefined) updateData.min_sales_amount = settingData.min_sales_amount || null

    const { data, error } = await supabase
      .from('commission_settings')
      .update(updateData as any)
      .eq('id', settingId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating commission setting:', error)
    return null
  }
}

export async function deleteCommissionSetting(settingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('commission_settings')
      .delete()
      .eq('id', settingId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting commission setting:', error)
    return false
  }
}

export async function calculateCommission(
  companyId: string,
  employeeId: string,
  transactionAmount: number
): Promise<number> {
  try {
    const setting = await getCommissionSettingByEmployee(companyId, employeeId)
    
    if (!setting) {
      return 0
    }

    // Check minimum sales amount
    if (setting.min_sales_amount && transactionAmount < setting.min_sales_amount) {
      return 0
    }

    if (setting.commission_type === 'percentage') {
      return (transactionAmount * setting.commission_rate) / 100
    } else {
      // Fixed commission
      return setting.commission_rate
    }
  } catch (error) {
    console.error('Error calculating commission:', error)
    return 0
  }
}

export async function createCommissionPayment(
  companyId: string,
  paymentData: CommissionPaymentFormData
): Promise<CommissionPayment | null> {
  try {
    const { data, error } = await supabase
      .from('commission_payments')
      .insert({
        company_id: companyId,
        employee_id: paymentData.employee_id,
        transaction_id: paymentData.transaction_id || null,
        commission_amount: paymentData.commission_amount,
        payment_status: paymentData.payment_status,
        payment_date: paymentData.payment_date || null,
        notes: paymentData.notes || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating commission payment:', error)
    return null
  }
}

export async function getCommissionPayments(
  companyId?: string,
  employeeId?: string
): Promise<CommissionPayment[]> {
  try {
    let query = supabase
      .from('commission_payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching commission payments:', error)
    return []
  }
}

export async function updateCommissionPayment(
  paymentId: string,
  paymentData: Partial<CommissionPaymentFormData>
): Promise<CommissionPayment | null> {
  try {
    const updateData: any = {}
    
    if (paymentData.payment_status !== undefined) updateData.payment_status = paymentData.payment_status
    if (paymentData.payment_date !== undefined) updateData.payment_date = paymentData.payment_date || null
    if (paymentData.notes !== undefined) updateData.notes = paymentData.notes || null

    const { data, error } = await supabase
      .from('commission_payments')
      .update(updateData as any)
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating commission payment:', error)
    return null
  }
}

export async function deleteCommissionPayment(paymentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('commission_payments')
      .delete()
      .eq('id', paymentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting commission payment:', error)
    return false
  }
}

export async function getCommissionStats(
  companyId?: string,
  employeeId?: string
): Promise<{
  total_commission: number
  paid_commission: number
  pending_commission: number
  payment_count: number
}> {
  try {
    let query = supabase.from('commission_payments').select('commission_amount, payment_status')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    const payments = data || []
    const paid = payments.filter((p: any) => p.payment_status === 'paid')
    const pending = payments.filter((p: any) => p.payment_status === 'pending')

    return {
      total_commission: payments.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      paid_commission: paid.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      pending_commission: pending.reduce((sum: number, p: any) => sum + Number(p.commission_amount), 0),
      payment_count: payments.length,
    }
  } catch (error) {
    console.error('Error fetching commission stats:', error)
    return {
      total_commission: 0,
      paid_commission: 0,
      pending_commission: 0,
      payment_count: 0,
    }
  }
}


