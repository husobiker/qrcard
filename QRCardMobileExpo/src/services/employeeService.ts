import {supabase} from './supabase';
import type {Employee, SocialLinks} from '../types';

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
}

export async function getEmployeesByCompany(companyId: string): Promise<Employee[]> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  return data || [];
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

export async function createEmployee(
  companyId: string,
  employeeData: EmployeeFormData,
): Promise<Employee | null> {
  // Generate unique username
  let generatedUsername: string | null = null;
  try {
    const {data: usernameData, error: usernameError} = await supabase.rpc('generate_username', {
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
    } as any);

    if (!usernameError && usernameData) {
      generatedUsername = usernameData;
    } else {
      // Fallback: generate simple username
      const baseUsername = (employeeData.first_name.charAt(0) + employeeData.last_name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      generatedUsername = baseUsername + Math.floor(Math.random() * 1000);
    }
  } catch (error) {
    // Fallback: generate simple username
    const baseUsername = (employeeData.first_name.charAt(0) + employeeData.last_name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
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
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${employeeId}-${Math.random()}.${fileExt}`;
    const filePath = `employee-photos/${fileName}`;

    const {error: uploadError} = await supabase.storage
      .from('company-assets')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    const {data} = supabase.storage.from('company-assets').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading employee photo:', error);
    return null;
  }
}
