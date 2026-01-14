import {supabase} from './supabase';
import type {Quote, QuoteStatus} from '../types';

export interface QuoteFormData {
  employee_id: string;
  customer_id?: string | null;
  customer_name: string;
  product_service?: string;
  description?: string;
  price: number;
  tax_rate?: number;
  validity_date?: string;
  status?: QuoteStatus;
  notes?: string;
  attachments?: any[];
}

export async function getQuotes(
  companyId?: string,
  employeeId?: string,
  customerId?: string,
): Promise<Quote[]> {
  try {
    let query = supabase.from('quotes').select('*').order('created_at', {ascending: false});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting quotes:', error);
    return [];
  }
}

export async function getQuoteById(quoteId: string): Promise<Quote | null> {
  try {
    const {data, error} = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting quote:', error);
    return null;
  }
}

export async function createQuote(
  companyId: string,
  quoteData: QuoteFormData,
): Promise<Quote | null> {
  try {
    // Calculate tax_amount and total_amount
    const price = quoteData.price || 0;
    const taxRate = quoteData.tax_rate || 20;
    const taxAmount = price * (taxRate / 100);
    const totalAmount = price + taxAmount;

    const {data, error} = await supabase
      .from('quotes')
      .insert({
        company_id: companyId,
        employee_id: quoteData.employee_id,
        customer_id: quoteData.customer_id || null,
        customer_name: quoteData.customer_name,
        product_service: quoteData.product_service || null,
        description: quoteData.description || null,
        price: price,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        validity_date: quoteData.validity_date || null,
        status: quoteData.status || 'draft',
        notes: quoteData.notes || null,
        attachments: quoteData.attachments || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quote:', error);
    return null;
  }
}

export async function updateQuote(
  quoteId: string,
  quoteData: Partial<QuoteFormData>,
): Promise<Quote | null> {
  try {
    const updateData: any = {...quoteData};

    // Recalculate tax_amount and total_amount if price or tax_rate changed
    if (quoteData.price !== undefined || quoteData.tax_rate !== undefined) {
      // Get current quote to use existing values if not provided
      const currentQuote = await getQuoteById(quoteId);
      if (currentQuote) {
        const price = quoteData.price !== undefined ? quoteData.price : currentQuote.price;
        const taxRate = quoteData.tax_rate !== undefined ? quoteData.tax_rate : currentQuote.tax_rate;
        const taxAmount = price * (taxRate / 100);
        const totalAmount = price + taxAmount;
        updateData.tax_amount = taxAmount;
        updateData.total_amount = totalAmount;
      }
    }

    // Remove employee_id from updateData (it shouldn't be updated)
    delete updateData.employee_id;

    const {data, error} = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quote:', error);
    return null;
  }
}

export async function deleteQuote(quoteId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('quotes').delete().eq('id', quoteId);
    return !error;
  } catch (error) {
    console.error('Error deleting quote:', error);
    return false;
  }
}

export async function updateQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('quotes')
      .update({status})
      .eq('id', quoteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating quote status:', error);
    return false;
  }
}

export async function getQuoteStats(
  companyId?: string,
  employeeId?: string,
): Promise<{
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
}> {
  try {
    let query = supabase.from('quotes').select('status, validity_date');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;

    const quotes = data || [];
    const now = new Date();

    return {
      total: quotes.length,
      draft: quotes.filter((q: any) => q.status === 'draft').length,
      sent: quotes.filter((q: any) => q.status === 'sent').length,
      accepted: quotes.filter((q: any) => q.status === 'accepted').length,
      rejected: quotes.filter((q: any) => q.status === 'rejected').length,
      expired: quotes.filter((q: any) => {
        if (q.status === 'expired') return true;
        if (q.validity_date && new Date(q.validity_date) < now && q.status !== 'accepted' && q.status !== 'rejected') {
          return true;
        }
        return false;
      }).length,
    };
  } catch (error) {
    console.error('Error fetching quote stats:', error);
    return {
      total: 0,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    };
  }
}
