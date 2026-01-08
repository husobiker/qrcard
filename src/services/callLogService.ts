import { supabase } from '@/supabase/client'
import type { CallLog, CallLogFormData } from '@/types'

export async function createCallLog(
  companyId: string,
  callData: CallLogFormData
): Promise<CallLog | null> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        company_id: companyId,
        employee_id: callData.employee_id,
        call_type: callData.call_type,
        phone_number: callData.phone_number,
        customer_name: callData.customer_name || null,
        customer_id: callData.customer_id || null,
        call_duration: callData.call_duration || 0,
        call_status: callData.call_status || 'completed',
        recording_url: callData.recording_url || null,
        notes: callData.notes || null,
        call_start_time: callData.call_start_time,
        call_end_time: callData.call_end_time || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating call log:', error)
    return null
  }
}

export async function getCallLogs(
  companyId?: string,
  employeeId?: string
): Promise<CallLog[]> {
  try {
    let query = supabase
      .from('call_logs')
      .select('*')
      .order('call_start_time', { ascending: false })

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
    console.error('Error fetching call logs:', error)
    return []
  }
}

export async function getCallLogById(callLogId: string): Promise<CallLog | null> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', callLogId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching call log:', error)
    return null
  }
}

export async function updateCallLog(
  callLogId: string,
  callData: Partial<CallLogFormData>
): Promise<CallLog | null> {
  try {
    const updateData: any = {}

    if (callData.call_type !== undefined) updateData.call_type = callData.call_type
    if (callData.phone_number !== undefined) updateData.phone_number = callData.phone_number
    if (callData.customer_name !== undefined) updateData.customer_name = callData.customer_name || null
    if (callData.customer_id !== undefined) updateData.customer_id = callData.customer_id || null
    if (callData.call_duration !== undefined) updateData.call_duration = callData.call_duration
    if (callData.call_status !== undefined) updateData.call_status = callData.call_status
    if (callData.recording_url !== undefined) updateData.recording_url = callData.recording_url || null
    if (callData.notes !== undefined) updateData.notes = callData.notes || null
    if (callData.call_start_time !== undefined) updateData.call_start_time = callData.call_start_time
    if (callData.call_end_time !== undefined) updateData.call_end_time = callData.call_end_time || null

    const { data, error } = await supabase
      .from('call_logs')
      .update(updateData as any)
      .eq('id', callLogId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating call log:', error)
    return null
  }
}

export async function deleteCallLog(callLogId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('id', callLogId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting call log:', error)
    return false
  }
}

export async function getCallLogStats(
  companyId?: string,
  employeeId?: string
): Promise<{
  total: number
  outgoing: number
  incoming: number
  missed: number
  total_duration: number
  average_duration: number
}> {
  try {
    let query = supabase.from('call_logs').select('call_type, call_duration')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    const logs = data || []
    const totalDuration = logs.reduce((sum: number, log: any) => sum + (log.call_duration || 0), 0)

    return {
      total: logs.length,
      outgoing: logs.filter((log: any) => log.call_type === 'outgoing').length,
      incoming: logs.filter((log: any) => log.call_type === 'incoming').length,
      missed: logs.filter((log: any) => log.call_type === 'missed').length,
      total_duration: totalDuration,
      average_duration: logs.length > 0 ? Math.round(totalDuration / logs.length) : 0,
    }
  } catch (error) {
    console.error('Error fetching call log stats:', error)
    return {
      total: 0,
      outgoing: 0,
      incoming: 0,
      missed: 0,
      total_duration: 0,
      average_duration: 0,
    }
  }
}


