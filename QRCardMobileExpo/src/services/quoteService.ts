import {supabase} from './supabase';
import type {Quote, QuoteStatus} from '../types';
import {updateLead} from './crmService';

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
  customerName?: string,
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

    if (customerName && !customerId) {
      // If customerName is provided but no customerId, filter by customer_name
      query = query.ilike('customer_name', `%${customerName}%`);
    }

    const {data, error} = await query;

    if (error) {
      console.error('Error in getQuotes query:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('getQuotes raw data:', {
      companyId,
      employeeId,
      customerId,
      customerName,
      dataCount: data?.length || 0,
      data: data?.map(q => ({ 
        id: q.id, 
        customer_id: q.customer_id, 
        customer_name: q.customer_name,
        employee_id: q.employee_id,
        company_id: q.company_id,
        status: q.status
      }))
    });
    
    // If no data and we're searching by customerId, try to get all quotes and filter manually
    let quotes = data || [];
    if (quotes.length === 0 && customerId && companyId) {
      console.warn('No quotes found for customerId:', customerId);
      console.warn('Trying to get all quotes for company and filter manually...');
      try {
        const {data: allQuotes, error: allError} = await supabase
          .from('quotes')
          .select('*')
          .eq('company_id', companyId);
        
        if (!allError && allQuotes) {
          console.log('All quotes in company:', {
            count: allQuotes.length,
            quotes: allQuotes.map(q => ({ 
              id: q.id, 
              customer_id: q.customer_id, 
              customer_name: q.customer_name,
              employee_id: q.employee_id
            }))
          });
          
          // Filter by customer_id
          quotes = allQuotes.filter(q => q.customer_id === customerId);
          console.log('Filtered by customer_id:', quotes.length);
        }
      } catch (debugError) {
        console.error('Error getting all quotes:', debugError);
      }
    }
    
    // If no quotes found, try getting all quotes and filtering manually
    // This is a fallback in case RLS is blocking the initial query
    if (quotes.length === 0 && companyId) {
      console.warn('No quotes found with initial query, trying to get all quotes and filter manually...');
      try {
        const {data: allQuotes, error: allError} = await supabase
          .from('quotes')
          .select('*')
          .eq('company_id', companyId);
        
        if (!allError && allQuotes) {
          console.log('All quotes in company for manual filtering:', {
            count: allQuotes.length,
            quotes: allQuotes.map(q => ({ 
              id: q.id, 
              customer_id: q.customer_id, 
              customer_name: q.customer_name,
              employee_id: q.employee_id
            }))
          });
          
          // Filter by customer_id if provided
          if (customerId) {
            quotes = allQuotes.filter(q => q.customer_id === customerId);
            console.log('Filtered by customer_id:', quotes.length, {
              requestedCustomerId: customerId,
              foundQuotes: quotes.map(q => ({
                id: q.id,
                customer_id: q.customer_id,
                customer_name: q.customer_name
              }))
            });
          }
          
          // Filter by customer_name if provided and no quotes found yet
          // This handles cases where customer_id might be null or different
          if (quotes.length === 0 && customerName) {
            const searchName = customerName.toLowerCase().trim().replace(/\s+/g, ' ');
            console.log('Searching by customer_name:', {
              searchName,
              allQuotesCount: allQuotes.length,
              allQuotes: allQuotes.map(q => ({
                id: q.id,
                customer_id: q.customer_id,
                customer_name: q.customer_name
              }))
            });
            
            quotes = allQuotes.filter((q) => {
              const qName = (q.customer_name || '').toLowerCase().trim().replace(/\s+/g, ' ');
              const exactMatch = qName === searchName;
              const containsMatch = qName.includes(searchName) || searchName.includes(qName);
              const normalizedMatch = qName.replace(/[^\w\s]/g, '') === searchName.replace(/[^\w\s]/g, '');
              
              if (exactMatch || containsMatch || normalizedMatch) {
                console.log('Match found by customer_name:', { 
                  quoteId: q.id,
                  quoteName: q.customer_name, 
                  searchName: customerName,
                  quoteCustomerId: q.customer_id,
                  requestedCustomerId: customerId,
                  exactMatch,
                  containsMatch,
                  normalizedMatch
                });
              }
              
              return exactMatch || containsMatch || normalizedMatch;
            });
            console.log('Filtered by customer_name:', quotes.length, quotes.map(q => ({ 
              id: q.id, 
              customer_name: q.customer_name,
              customer_id: q.customer_id 
            })));
          }
          
          // If still no quotes and we have both customerId and customerName,
          // try matching by customer_name only (ignore customer_id)
          if (quotes.length === 0 && customerId && customerName) {
            console.warn('No quotes found with customer_id, trying customer_name only...');
            const searchName = customerName.toLowerCase().trim().replace(/\s+/g, ' ');
            quotes = allQuotes.filter((q) => {
              const qName = (q.customer_name || '').toLowerCase().trim().replace(/\s+/g, ' ');
              return qName === searchName || 
                     qName.includes(searchName) || 
                     searchName.includes(qName);
            });
            console.log('Filtered by customer_name (ignoring customer_id):', quotes.length);
          }
        } else if (allError) {
          console.error('Error getting all quotes:', allError);
        }
      } catch (debugError) {
        console.error('Error in manual filtering:', debugError);
      }
    }
    
    // Additional filtering for customerName if provided
    if (customerName && !customerId && quotes.length > 0) {
      const searchName = customerName.toLowerCase().trim();
      quotes = quotes.filter((q) => {
        const qName = (q.customer_name || '').toLowerCase().trim();
        return qName === searchName || 
               qName.includes(searchName) || 
               searchName.includes(qName) ||
               qName.replace(/\s+/g, ' ') === searchName.replace(/\s+/g, ' ');
      });
    }
    
    console.log('getQuotes filtered quotes:', quotes.length);
    
    return quotes;
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

    const insertData = {
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
    };

    console.log('createQuote - Inserting quote:', {
      company_id: insertData.company_id,
      employee_id: insertData.employee_id,
      customer_id: insertData.customer_id,
      customer_name: insertData.customer_name,
      price: insertData.price,
      status: insertData.status
    });

    const {data, error} = await supabase
      .from('quotes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('createQuote - Error inserting quote:', error);
      throw error;
    }

    console.log('createQuote - Quote created successfully:', {
      id: data?.id,
      customer_id: data?.customer_id,
      customer_name: data?.customer_name,
      company_id: data?.company_id
    });

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

    // If status is being updated to "accepted", update customer status to "Satış Yapıldı"
    if (quoteData.status === 'accepted' && data) {
      await updateCustomerStatusOnQuoteAccepted(data);
    }

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

    // If status is being updated to "accepted", update customer status to "Satış Yapıldı"
    if (status === 'accepted') {
      const quote = await getQuoteById(quoteId);
      if (quote) {
        await updateCustomerStatusOnQuoteAccepted(quote);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating quote status:', error);
    return false;
  }
}

// Helper function to update customer status when quote is accepted
async function updateCustomerStatusOnQuoteAccepted(quote: Quote): Promise<void> {
  try {
    if (!quote.customer_id && !quote.customer_name) {
      console.warn('Quote has no customer_id or customer_name, cannot update customer status');
      return;
    }

    // Find the customer by customer_id or customer_name
    let customerQuery = supabase.from('crm_leads').select('id, status');

    if (quote.customer_id) {
      customerQuery = customerQuery.eq('id', quote.customer_id);
    } else if (quote.customer_name) {
      customerQuery = customerQuery.eq('customer_name', quote.customer_name);
    }

    const {data: customers, error: customerError} = await customerQuery;

    if (customerError) {
      console.error('Error finding customer:', customerError);
      return;
    }

    if (!customers || customers.length === 0) {
      console.warn('Customer not found for quote:', {
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
      });
      return;
    }

    // Update all matching customers to "Satış Yapıldı" status
    for (const customer of customers) {
      // Only update if status is not already "Satış Yapıldı"
      if (customer.status !== 'Satış Yapıldı') {
        const {error: updateError} = await supabase
          .from('crm_leads')
          .update({status: 'Satış Yapıldı'})
          .eq('id', customer.id);

        if (updateError) {
          console.error('Error updating customer status:', updateError);
        } else {
          console.log('Customer status updated to "Satış Yapıldı" for customer:', customer.id);
        }
      }
    }
  } catch (error) {
    console.error('Error in updateCustomerStatusOnQuoteAccepted:', error);
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
