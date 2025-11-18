import { supabase } from '@/supabase/client'
import type { CRMLead, CRMLeadFormData, CRMStats } from '@/types'

export async function createLead(
  companyId: string,
  leadData: CRMLeadFormData
): Promise<CRMLead | null> {
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        company_id: companyId,
        employee_id: leadData.employee_id || null,
        customer_name: leadData.customer_name,
        contact_name: leadData.contact_name || null,
        phone: leadData.phone || null,
        email: leadData.email || null,
        notes: leadData.notes || null,
        follow_up_date: leadData.follow_up_date || null,
        status: leadData.status,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating lead:', error)
    return null
  }
}

export async function getLeads(companyId?: string, employeeId?: string): Promise<CRMLead[]> {
  try {
    let query = supabase
      .from('crm_leads')
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
    console.error('Error fetching leads:', error)
    return []
  }
}

export async function getLeadById(leadId: string): Promise<CRMLead | null> {
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching lead:', error)
    return null
  }
}

export async function updateLead(
  leadId: string,
  leadData: Partial<CRMLeadFormData>
): Promise<CRMLead | null> {
  try {
    const updateData: any = {}
    
    if (leadData.customer_name !== undefined) updateData.customer_name = leadData.customer_name
    if (leadData.contact_name !== undefined) updateData.contact_name = leadData.contact_name
    if (leadData.phone !== undefined) updateData.phone = leadData.phone
    if (leadData.email !== undefined) updateData.email = leadData.email
    if (leadData.notes !== undefined) updateData.notes = leadData.notes
    if (leadData.follow_up_date !== undefined) updateData.follow_up_date = leadData.follow_up_date
    if (leadData.status !== undefined) updateData.status = leadData.status
    if (leadData.employee_id !== undefined) updateData.employee_id = leadData.employee_id

    const { data, error } = await supabase
      .from('crm_leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating lead:', error)
    return null
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: CRMLead['status']
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('crm_leads')
      .update({ status })
      .eq('id', leadId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating lead status:', error)
    return false
  }
}

export async function deleteLead(leadId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', leadId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting lead:', error)
    return false
  }
}

export async function getCRMStats(companyId?: string, employeeId?: string): Promise<CRMStats> {
  try {
    let query = supabase.from('crm_leads').select('status, follow_up_date')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    const leads = data || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats: CRMStats = {
      total: leads.length,
      today_follow_ups: leads.filter((lead) => {
        if (!lead.follow_up_date) return false
        const followUpDate = new Date(lead.follow_up_date)
        followUpDate.setHours(0, 0, 0, 0)
        return followUpDate.getTime() === today.getTime()
      }).length,
      sales_completed: leads.filter((lead) => lead.status === 'Satış Yapıldı').length,
      in_follow_up: leads.filter((lead) => lead.status === 'Takipte').length,
    }

    return stats
  } catch (error) {
    console.error('Error fetching CRM stats:', error)
    return {
      total: 0,
      today_follow_ups: 0,
      sales_completed: 0,
      in_follow_up: 0,
    }
  }
}

