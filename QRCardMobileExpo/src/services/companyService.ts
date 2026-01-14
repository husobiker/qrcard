import {supabase} from './supabase';
import type {Company} from '../types';
import * as FileSystem from 'expo-file-system/legacy';

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

  if (data) {
    console.log('Company data retrieved:', JSON.stringify(data, null, 2));
    if (data.logo_url) {
      console.log('Logo URL from database:', data.logo_url);
    }
    if (data.background_image_url) {
      console.log('Background image URL from database:', data.background_image_url);
    }
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
    if (cleanUpdates.logo_url) {
      console.log('Logo URL being saved:', cleanUpdates.logo_url);
    }
    if (cleanUpdates.background_image_url) {
      console.log('Background image URL being saved:', cleanUpdates.background_image_url);
    }

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

    console.log('Company updated successfully. Retrieved data:', JSON.stringify(data, null, 2));
    if (data.logo_url) {
      console.log('Logo URL in database:', data.logo_url);
    }
    if (data.background_image_url) {
      console.log('Background image URL in database:', data.background_image_url);
    }

    return data;
  } catch (error) {
    console.error('Exception in updateCompany:', error);
    return null;
  }
}

export async function uploadCompanyLogo(uri: string, companyId: string): Promise<string | null> {
  try {
    // Read file as base64 using expo-file-system legacy API (more reliable in React Native)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 string to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${companyId}-logo-${Date.now()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`;

    const contentType = 'image/jpeg'; // Default to jpeg

    // Upload Uint8Array directly
    const {error: uploadError} = await supabase.storage
      .from('company-assets')
      .upload(filePath, bytes, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return null;
    }

    const {data: urlData} = supabase.storage.from('company-assets').getPublicUrl(filePath);
    console.log('getPublicUrl response for logo:', JSON.stringify(urlData, null, 2));
    
    // Handle both object and string return types
    let publicUrl: string | null = null;
    if (typeof urlData === 'string') {
      publicUrl = urlData;
    } else if (urlData && typeof urlData === 'object') {
      publicUrl = (urlData as any).publicUrl || null;
    }
    
    if (!publicUrl) {
      console.error('Failed to get public URL for logo. urlData:', urlData);
      return null;
    }
    
    // Test if URL is accessible (for debugging)
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      console.log('Logo URL accessibility test:', testResponse.status, testResponse.ok);
      if (!testResponse.ok) {
        console.warn('Logo URL might not be accessible. Status:', testResponse.status);
      }
    } catch (testError) {
      console.warn('Logo URL accessibility test failed:', testError);
    }
    
    console.log('Logo uploaded successfully. URL:', publicUrl);
    console.log('URL type:', typeof publicUrl, 'URL length:', publicUrl.length);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return null;
  }
}

export async function uploadCompanyBackgroundImage(uri: string, companyId: string): Promise<string | null> {
  try {
    // Read file as base64 using expo-file-system legacy API (more reliable in React Native)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 string to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${companyId}-bg-${Date.now()}.${fileExt}`;
    const filePath = `company-backgrounds/${fileName}`;

    const contentType = 'image/jpeg'; // Default to jpeg

    // Upload Uint8Array directly
    const {error: uploadError} = await supabase.storage
      .from('company-assets')
      .upload(filePath, bytes, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      });

    if (uploadError) {
      console.error('Error uploading background image:', uploadError);
      return null;
    }

    const {data: urlData} = supabase.storage.from('company-assets').getPublicUrl(filePath);
    console.log('getPublicUrl response for background:', JSON.stringify(urlData, null, 2));
    
    // Handle both object and string return types
    let publicUrl: string | null = null;
    if (typeof urlData === 'string') {
      publicUrl = urlData;
    } else if (urlData && typeof urlData === 'object') {
      publicUrl = (urlData as any).publicUrl || null;
    }
    
    if (!publicUrl) {
      console.error('Failed to get public URL for background image. urlData:', urlData);
      return null;
    }
    
    // Test if URL is accessible (for debugging)
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      console.log('Background URL accessibility test:', testResponse.status, testResponse.ok);
      if (!testResponse.ok) {
        console.warn('Background URL might not be accessible. Status:', testResponse.status);
      }
    } catch (testError) {
      console.warn('Background URL accessibility test failed:', testError);
    }
    
    console.log('Background image uploaded successfully. URL:', publicUrl);
    console.log('URL type:', typeof publicUrl, 'URL length:', publicUrl.length);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading company background image:', error);
    return null;
  }
}
