import { supabase } from '@/supabase/client'
import type { CustomerCommunication, CommunicationFormData } from '@/types'

export async function createCommunication(
  companyId: string,
  communicationData: CommunicationFormData
): Promise<CustomerCommunication | null> {
  try {
    const { data, error } = await supabase
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
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating communication:', error)
    return null
  }
}

export async function getCommunications(
  companyId?: string,
  employeeId?: string,
  customerEmail?: string,
  customerPhone?: string
): Promise<CustomerCommunication[]> {
  try {
    let query = supabase
      .from('customer_communications')
      .select('*')
      .order('communication_date', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail)
    }

    if (customerPhone) {
      query = query.eq('customer_phone', customerPhone)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching communications:', error)
    return []
  }
}

export async function getCommunicationById(communicationId: string): Promise<CustomerCommunication | null> {
  try {
    const { data, error } = await supabase
      .from('customer_communications')
      .select('*')
      .eq('id', communicationId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching communication:', error)
    return null
  }
}

export async function updateCommunication(
  communicationId: string,
  communicationData: Partial<CommunicationFormData>
): Promise<CustomerCommunication | null> {
  try {
    const updateData: any = {}
    
    if (communicationData.customer_name !== undefined) updateData.customer_name = communicationData.customer_name
    if (communicationData.customer_email !== undefined) updateData.customer_email = communicationData.customer_email || null
    if (communicationData.customer_phone !== undefined) updateData.customer_phone = communicationData.customer_phone || null
    if (communicationData.communication_type !== undefined) updateData.communication_type = communicationData.communication_type
    if (communicationData.subject !== undefined) updateData.subject = communicationData.subject || null
    if (communicationData.notes !== undefined) updateData.notes = communicationData.notes || null
    if (communicationData.attachments !== undefined) updateData.attachments = communicationData.attachments || []
    if (communicationData.communication_date !== undefined) updateData.communication_date = communicationData.communication_date

    const { data, error } = await supabase
      .from('customer_communications')
      // @ts-ignore - Supabase type inference issue
      .update(updateData)
      .eq('id', communicationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating communication:', error)
    return null
  }
}

export async function deleteCommunication(communicationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_communications')
      .delete()
      .eq('id', communicationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting communication:', error)
    return false
  }
}

export async function getCommunicationStats(
  companyId?: string,
  employeeId?: string
): Promise<{
  total: number
  email: number
  phone: number
  meeting: number
  sms: number
}> {
  try {
    let query = supabase.from('customer_communications').select('communication_type')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    const communications = data || []

    return {
      total: communications.length,
      email: communications.filter((c: any) => c.communication_type === 'email').length,
      phone: communications.filter((c: any) => c.communication_type === 'phone').length,
      meeting: communications.filter((c: any) => c.communication_type === 'meeting').length,
      sms: communications.filter((c: any) => c.communication_type === 'sms').length,
    }
  } catch (error) {
    console.error('Error fetching communication stats:', error)
    return {
      total: 0,
      email: 0,
      phone: 0,
      meeting: 0,
      sms: 0,
    }
  }
}


