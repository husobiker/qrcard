import { supabase } from '@/supabase/client'
import type { Employee } from '@/types'

/**
 * Authenticate an employee by username and password
 * Returns the employee data if authentication is successful
 */
export async function authenticateEmployee(username: string, password: string): Promise<Employee | null> {
  try {
    console.log('Attempting to authenticate employee:', { username })
    const { data, error } = await supabase.rpc('authenticate_employee', {
      emp_username: username,
      emp_password: password
    } as any)

    if (error) {
      console.error('Error authenticating employee:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return null
    }

    console.log('Authentication response:', { dataLength: (data as any)?.length, hasData: !!data })

    // RPC returns a table, so data is an array
    if (!data || (data as any).length === 0) {
      console.log('No employee found or password incorrect')
      return null
    }

    // Convert the result to Employee type
    const employeeData = data[0] as any
    return {
      id: employeeData.id,
      company_id: employeeData.company_id,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      username: employeeData.username,
      job_title: employeeData.job_title,
      department: employeeData.department,
      phone: employeeData.phone,
      email: employeeData.email,
      about: employeeData.about,
      social_links: employeeData.social_links,
      profile_image_url: employeeData.profile_image_url,
      extra_links: employeeData.extra_links,
      meeting_link: employeeData.meeting_link,
      cv_url: employeeData.cv_url,
      pdf_url: employeeData.pdf_url,
      brochure_url: employeeData.brochure_url,
      presentation_url: employeeData.presentation_url,
      gallery_images: employeeData.gallery_images,
      available_hours: employeeData.available_hours,
      default_duration_minutes: employeeData.default_duration_minutes,
      password_hash: null, // Never return password hash
      created_at: employeeData.created_at,
    } as Employee
  } catch (error) {
    console.error('Error authenticating employee:', error)
    return null
  }
}

/**
 * Store employee session in localStorage
 */
export function setEmployeeSession(employee: Employee): void {
  localStorage.setItem('employee_session', JSON.stringify({
    employee,
    timestamp: Date.now()
  }))
}

/**
 * Get employee session from localStorage
 */
export function getEmployeeSession(): Employee | null {
  try {
    const sessionData = localStorage.getItem('employee_session')
    if (!sessionData) return null

    const session = JSON.parse(sessionData)
    // Check if session is still valid (24 hours)
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      clearEmployeeSession()
      return null
    }

    return session.employee as Employee
  } catch (error) {
    console.error('Error getting employee session:', error)
    return null
  }
}

/**
 * Clear employee session
 */
export function clearEmployeeSession(): void {
  localStorage.removeItem('employee_session')
}

