import { supabase } from '@/supabase/client'
import type { PerformanceGoal, GoalFormData } from '@/types'

export async function createGoal(
  companyId: string,
  goalData: GoalFormData
): Promise<PerformanceGoal | null> {
  try {
    const { data, error } = await supabase
      .from('performance_goals')
      .insert({
        company_id: companyId,
        employee_id: goalData.employee_id,
        goal_type: goalData.goal_type,
        target_value: goalData.target_value,
        current_value: 0,
        period_type: goalData.period_type,
        period_start: goalData.period_start,
        period_end: goalData.period_end,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating goal:', error)
    return null
  }
}

export async function getGoals(companyId?: string, employeeId?: string): Promise<PerformanceGoal[]> {
  try {
    let query = supabase
      .from('performance_goals')
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
    console.error('Error fetching goals:', error)
    return []
  }
}

export async function getGoalById(goalId: string): Promise<PerformanceGoal | null> {
  try {
    const { data, error } = await supabase
      .from('performance_goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching goal:', error)
    return null
  }
}

export async function updateGoal(
  goalId: string,
  goalData: Partial<GoalFormData>
): Promise<PerformanceGoal | null> {
  try {
    const updateData: any = {}
    
    if (goalData.goal_type !== undefined) updateData.goal_type = goalData.goal_type
    if (goalData.target_value !== undefined) updateData.target_value = goalData.target_value
    if (goalData.period_type !== undefined) updateData.period_type = goalData.period_type
    if (goalData.period_start !== undefined) updateData.period_start = goalData.period_start
    if (goalData.period_end !== undefined) updateData.period_end = goalData.period_end

    const { data, error } = await supabase
      .from('performance_goals')
      // @ts-ignore - Supabase type inference issue
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating goal:', error)
    return null
  }
}

export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('performance_goals')
      // @ts-ignore - Supabase type inference issue
      .update({ current_value: currentValue })
      .eq('id', goalId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating goal progress:', error)
    return false
  }
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('performance_goals')
      .delete()
      .eq('id', goalId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting goal:', error)
    return false
  }
}

export async function calculateGoalProgress(
  goal: PerformanceGoal,
  companyId: string
): Promise<number> {
  try {
    const now = new Date()
    const periodStart = new Date(goal.period_start)
    const periodEnd = new Date(goal.period_end)

    // Only calculate if we're in the period
    if (now < periodStart || now > periodEnd) {
      return goal.current_value
    }

    let currentValue = 0

    switch (goal.goal_type) {
      case 'sales':
        // Count completed CRM leads with status 'Satış Yapıldı'
        const { count: salesCount } = await supabase
          .from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('employee_id', goal.employee_id)
          .eq('status', 'Satış Yapıldı')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString())
        currentValue = salesCount || 0
        break

      case 'leads':
        // Count all CRM leads
        const { count: leadsCount } = await supabase
          .from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('employee_id', goal.employee_id)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString())
        currentValue = leadsCount || 0
        break

      case 'appointments':
        // Count completed appointments
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('employee_id', goal.employee_id)
          .eq('status', 'completed')
          .gte('appointment_date', periodStart.toISOString())
          .lte('appointment_date', periodEnd.toISOString())
        currentValue = appointmentsCount || 0
        break

      case 'revenue':
        // Sum income transactions
        const { data: revenueData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('company_id', companyId)
          .eq('employee_id', goal.employee_id)
          .eq('transaction_type', 'income')
          .gte('transaction_date', periodStart.toISOString().split('T')[0])
          .lte('transaction_date', periodEnd.toISOString().split('T')[0])
        
        currentValue = (revenueData as any)?.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0
        break
    }

    // Update the goal with calculated value
    await updateGoalProgress(goal.id, currentValue)

    return currentValue
  } catch (error) {
    console.error('Error calculating goal progress:', error)
    return goal.current_value
  }
}


