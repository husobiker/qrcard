import { supabase } from '@/supabase/client'
import type { Employee, EmployeeFormData, SocialLinks } from '@/types'

export async function getEmployeesByCompany(companyId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return data || []
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

export async function getEmployeeByCompanyAndId(companyId: string, employeeId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .eq('company_id', companyId)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

export async function createEmployee(companyId: string, employeeData: EmployeeFormData): Promise<Employee | null> {
  // Generate unique username
  let generatedUsername: string | null = null
  try {
    const { data: usernameData, error: usernameError } = await supabase.rpc('generate_username', {
      first_name: employeeData.first_name,
      last_name: employeeData.last_name
    })
    
    if (!usernameError && usernameData) {
      generatedUsername = usernameData
    } else {
      console.warn('Error generating username:', usernameError)
      // Fallback: generate simple username
      const baseUsername = (employeeData.first_name.charAt(0) + employeeData.last_name).toLowerCase().replace(/[^a-z0-9]/g, '')
      generatedUsername = baseUsername + Math.floor(Math.random() * 1000)
    }
  } catch (error) {
    console.warn('Error generating username:', error)
    // Fallback: generate simple username
    const baseUsername = (employeeData.first_name.charAt(0) + employeeData.last_name).toLowerCase().replace(/[^a-z0-9]/g, '')
    generatedUsername = baseUsername + Math.floor(Math.random() * 1000)
  }

  // Hash password if provided
  let passwordHash = null
  if (employeeData.password && employeeData.password.trim() !== '') {
    try {
      const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
        plain_password: employeeData.password
      })
      
      if (hashError) {
        console.error('Password hashing error:', hashError)
        throw new Error(`Password hashing failed: ${hashError.message}`)
      }
      
      if (hashData) {
        passwordHash = hashData
        console.log('Password hashed successfully')
      } else {
        console.error('Password hashing returned null')
        throw new Error('Password hashing returned null')
      }
    } catch (error) {
      console.error('Error in password hashing:', error)
      throw error
    }
  } else {
    console.warn('No password provided for employee')
  }

  const { data, error } = await supabase
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
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating employee:', error)
    return null
  }

  return data
}

export async function updateEmployee(
  id: string,
  employeeData: Partial<EmployeeFormData> & { profile_image_url?: string | null }
): Promise<Employee | null> {
  const updateData: any = {}
  
  if (employeeData.first_name !== undefined) updateData.first_name = employeeData.first_name
  if (employeeData.last_name !== undefined) updateData.last_name = employeeData.last_name
  if (employeeData.job_title !== undefined) updateData.job_title = employeeData.job_title || null
  if (employeeData.department !== undefined) updateData.department = employeeData.department || null
  if (employeeData.phone !== undefined) updateData.phone = employeeData.phone || null
  if (employeeData.email !== undefined) updateData.email = employeeData.email || null
  if (employeeData.about !== undefined) updateData.about = employeeData.about || null
  if (employeeData.social_links !== undefined) updateData.social_links = employeeData.social_links as SocialLinks
  if (employeeData.profile_image_url !== undefined) updateData.profile_image_url = employeeData.profile_image_url
  if (employeeData.available_hours !== undefined) updateData.available_hours = employeeData.available_hours
  if (employeeData.default_duration_minutes !== undefined) updateData.default_duration_minutes = employeeData.default_duration_minutes
  
  // Hash password if provided
  if (employeeData.password && employeeData.password.trim() !== '') {
    try {
      const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
        plain_password: employeeData.password
      })
      
      if (!hashError && hashData) {
        updateData.password_hash = hashData
      } else {
        console.warn('Password hashing RPC not available:', hashError)
        // If RPC doesn't exist, skip password update
      }
    } catch (error) {
      console.warn('Error hashing password:', error)
      // Skip password update if hashing fails
    }
  }

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating employee:', error)
    return null
  }

  return data
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting employee:', error)
    return false
  }

  return true
}

export async function uploadEmployeePhoto(file: File, employeeId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${employeeId}-${Math.random()}.${fileExt}`
  const filePath = `employee-photos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading photo:', uploadError)
    return null
  }

  const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath)
  return data.publicUrl
}

