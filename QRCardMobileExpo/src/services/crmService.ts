import {supabase} from './supabase';
import type {CRMLead, CRMLeadStatus} from '../types';

export interface CRMLeadFormData {
  customer_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  follow_up_date?: string;
  status: CRMLeadStatus;
  employee_id?: string | null;
}

export async function getLeads(
  companyId?: string,
  employeeId?: string,
): Promise<CRMLead[]> {
  try {
    let query = supabase.from('crm_leads').select('*').order('created_at', {ascending: false});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leads:', error);
    return [];
  }
}

export async function createLead(
  companyId: string,
  leadData: CRMLeadFormData,
): Promise<CRMLead | null> {
  try {
    const {data, error} = await supabase
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
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lead:', error);
    return null;
  }
}

export async function updateLead(
  leadId: string,
  leadData: Partial<CRMLeadFormData>,
): Promise<CRMLead | null> {
  try {
    const {data, error} = await supabase
      .from('crm_leads')
      .update(leadData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lead:', error);
    return null;
  }
}

export async function deleteLead(leadId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('crm_leads').delete().eq('id', leadId);
    return !error;
  } catch (error) {
    console.error('Error deleting lead:', error);
    return false;
  }
}

