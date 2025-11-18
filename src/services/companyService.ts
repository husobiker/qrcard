import { supabase } from '@/supabase/client'
import type { Company } from '@/types'

export async function getCompanyByUserId(userId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // If company doesn't exist (PGRST116), that's okay
    if (error.code === 'PGRST116') {
      console.log('Company not found for user:', userId)
      return null
    }
    console.error('Error fetching company:', error)
    return null
  }

  return data
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('Error fetching company:', error)
    return null
  }

  return data
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
  // @ts-ignore - Supabase types not properly inferred
  const { data, error } = await supabase
    .from('companies')
    // @ts-ignore
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating company:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return null
  }

  return data
}

export async function uploadCompanyLogo(file: File, companyId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${companyId}-${Math.random()}.${fileExt}`
  const filePath = `company-logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    return null
  }

  const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath)
  return data.publicUrl
}

export async function uploadCompanyBackgroundImage(file: File, companyId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${companyId}-bg-${Math.random()}.${fileExt}`
  const filePath = `company-backgrounds/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading background image:', uploadError)
    return null
  }

  const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath)
  return data.publicUrl
}

