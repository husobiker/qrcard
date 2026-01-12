import {supabase} from './supabase';
import type {Company} from '../types';

export async function getCompanyByUserId(userId: string): Promise<Company | null> {
  const {data, error} = await supabase
    .from('companies')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // If company doesn't exist (PGRST116), that's okay
    if (error.code === 'PGRST116') {
      console.log('Company not found for user:', userId);
      return null;
    }
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const {data, error} = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
  try {
    // Fields that should not be updated (read-only or system fields)
    const readonlyFields = ['id', 'created_at'];

    // Filter out undefined values, readonly fields, and convert empty strings to null for optional fields
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      // Skip readonly fields
      if (readonlyFields.includes(key)) {
        return;
      }

      const value = (updates as any)[key];
      if (value !== undefined) {
        // For optional text fields, convert empty strings to null
        if (
          value === '' &&
          (key === 'api_endpoint' ||
            key === 'santral_id' ||
            key === 'api_key' ||
            key === 'api_secret' ||
            key === 'address' ||
            key === 'phone' ||
            key === 'website' ||
            key === 'tax_number' ||
            key === 'tax_office' ||
            key === 'logo_url' ||
            key === 'background_image_url')
        ) {
          cleanUpdates[key] = null;
        } else {
          cleanUpdates[key] = value;
        }
      }
    });

    console.log('Updating company with data:', JSON.stringify(cleanUpdates, null, 2));

    const {data, error} = await supabase
      .from('companies')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', JSON.stringify(error, null, 2));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in updateCompany:', error);
    return null;
  }
}
