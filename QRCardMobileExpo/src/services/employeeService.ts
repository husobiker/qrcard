import {supabase} from './supabase';
import type {Employee, SocialLinks} from '../types';
import * as FileSystem from 'expo-file-system/legacy';

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  phone?: string;
  email?: string;
  about?: string;
  social_links?: SocialLinks;
  available_hours?: any;
  default_duration_minutes?: number;
  password?: string;
  role?: string | null;
  region_id?: string | null;
}

export async function getEmployeesByCompany(companyId: string): Promise<Employee[]> {
  console.log('getEmployeesByCompany called with companyId:', companyId);
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching employees:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }

  console.log('Employees fetched successfully:', data?.length || 0, 'employees');
  return data || [];
}

export async function getEmployeesByRegion(regionId: string): Promise<Employee[]> {
  try {
    const {data, error} = await supabase
      .from('employees')
      .select('*')
      .eq('region_id', regionId)
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching employees by region:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching employees by region:', error);
    return [];
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data;
}

// Helper function to convert Turkish characters to English
function turkishToEnglish(text: string): string {
  const turkishChars: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };
  
  return text
    .split('')
    .map(char => turkishChars[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function createEmployee(
  companyId: string,
  employeeData: EmployeeFormData,
): Promise<Employee | null> {
  // Generate unique username
  let generatedUsername: string | null = null;
  try {
    // Convert Turkish characters to English before sending to RPC
    const englishFirstName = turkishToEnglish(employeeData.first_name);
    const englishLastName = turkishToEnglish(employeeData.last_name);
    
    // Send English-converted names to RPC to ensure proper handling
    const {data: usernameData, error: usernameError} = await supabase.rpc('generate_username', {
      first_name: englishFirstName,
      last_name: englishLastName,
    } as any);

    if (!usernameError && usernameData) {
      // RPC should return English username, but convert again to be safe
      generatedUsername = turkishToEnglish(usernameData);
    } else {
      // Fallback: generate simple username with Turkish character conversion
      const baseUsername = (englishFirstName.charAt(0) + englishLastName);
      generatedUsername = baseUsername + Math.floor(Math.random() * 1000);
    }
  } catch (error) {
    // Fallback: generate simple username with Turkish character conversion
    const englishFirstName = turkishToEnglish(employeeData.first_name);
    const englishLastName = turkishToEnglish(employeeData.last_name);
    const baseUsername = (englishFirstName.charAt(0) + englishLastName);
    generatedUsername = baseUsername + Math.floor(Math.random() * 1000);
  }

  // Hash password if provided
  let passwordHash = null;
  if (employeeData.password && employeeData.password.trim() !== '') {
    try {
      const {data: hashData, error: hashError} = await supabase.rpc('hash_password', {
        plain_password: employeeData.password,
      } as any);

      if (!hashError && hashData) {
        passwordHash = hashData;
      }
    } catch (error) {
      console.warn('Error hashing password:', error);
    }
  }

  const {data, error} = await supabase
    .from('employees')
    .insert({
      company_id: companyId,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      username: generatedUsername,
      job_title: employeeData.job_title || null,
      department: employeeData.department || null,
      phone: employeeData.phone || null,
      email: employeeData.email || null,
      about: employeeData.about || null,
      social_links: employeeData.social_links as SocialLinks,
      available_hours: employeeData.available_hours || null,
      default_duration_minutes: employeeData.default_duration_minutes || 30,
      password_hash: passwordHash,
      role: employeeData.role || null,
      region_id: employeeData.region_id || null,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating employee:', error);
    return null;
  }

  return data;
}

export async function updateEmployee(
  id: string,
  employeeData: Partial<EmployeeFormData> & {profile_image_url?: string | null},
): Promise<Employee | null> {
  const updateData: any = {};

  if (employeeData.first_name !== undefined) updateData.first_name = employeeData.first_name;
  if (employeeData.last_name !== undefined) updateData.last_name = employeeData.last_name;
  if (employeeData.job_title !== undefined)
    updateData.job_title = employeeData.job_title || null;
  if (employeeData.department !== undefined)
    updateData.department = employeeData.department || null;
  if (employeeData.phone !== undefined) updateData.phone = employeeData.phone || null;
  if (employeeData.email !== undefined) updateData.email = employeeData.email || null;
  if (employeeData.about !== undefined) updateData.about = employeeData.about || null;
  if (employeeData.social_links !== undefined)
    updateData.social_links = employeeData.social_links as SocialLinks;
  if (employeeData.profile_image_url !== undefined)
    updateData.profile_image_url = employeeData.profile_image_url;
  if (employeeData.available_hours !== undefined)
    updateData.available_hours = employeeData.available_hours;
  if (employeeData.default_duration_minutes !== undefined)
    updateData.default_duration_minutes = employeeData.default_duration_minutes;
  if (employeeData.role !== undefined) updateData.role = employeeData.role || null;
  if (employeeData.region_id !== undefined) updateData.region_id = employeeData.region_id || null;

  // Hash password if provided
  if (employeeData.password && employeeData.password.trim() !== '') {
    try {
      const {data: hashData, error: hashError} = await supabase.rpc('hash_password', {
        plain_password: employeeData.password,
      } as any);

      if (!hashError && hashData) {
        updateData.password_hash = hashData;
      }
    } catch (error) {
      console.warn('Error hashing password:', error);
    }
  }

  const {data, error} = await supabase
    .from('employees')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating employee:', error);
    return null;
  }

  return data;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const {error} = await supabase.from('employees').delete().eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    return false;
  }

  return true;
}

export async function uploadEmployeePhoto(
  uri: string,
  employeeId: string,
): Promise<string | null> {
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
    const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
    const filePath = `employee-photos/${fileName}`;

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
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    const {data: urlData} = supabase.storage.from('company-assets').getPublicUrl(filePath);
    // Handle both object and string return types
    let publicUrl: string | null = null;
    if (typeof urlData === 'string') {
      publicUrl = urlData;
    } else if (urlData && typeof urlData === 'object') {
      publicUrl = (urlData as any).publicUrl || null;
    }
    
    if (!publicUrl) {
      console.error('Failed to get public URL for employee photo. urlData:', urlData);
      return null;
    }
    
    console.log('Employee photo uploaded successfully. URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading employee photo:', error);
    return null;
  }
}
