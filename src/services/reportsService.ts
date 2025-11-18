import { supabase } from '@/supabase/client'
import { getCRMStats } from './crmService'
import { getAppointmentsByCompany, getAppointmentsByEmployee } from './appointmentService'
import { getEmployeeAnalytics } from './analyticsService'
import { getEmployeesByCompany } from './employeeService'

export interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  completed: number
  thisMonth: number
  thisWeek: number
}

export interface AnalyticsStats {
  total_views: number
  total_clicks: number
  employees_with_views: number
}

export interface EmployeePerformance {
  employee_id: string
  employee_name: string
  appointments_count: number
  crm_leads_count: number
  views_count: number
  clicks_count: number
}

export interface ReportsData {
  crm_stats: {
    total: number
    today_follow_ups: number
    sales_completed: number
    in_follow_up: number
  }
  appointment_stats: AppointmentStats
  analytics_stats: AnalyticsStats
  employee_performance?: EmployeePerformance[]
  monthly_crm_trend?: { month: string; count: number }[]
  monthly_appointments_trend?: { month: string; count: number }[]
}

export async function getCompanyReports(companyId: string): Promise<ReportsData> {
  try {
    // Get CRM stats
    const crm_stats = await getCRMStats(companyId)

    // Get appointments
    const appointments = await getAppointmentsByCompany(companyId)
    
    // Calculate appointment stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    const appointment_stats: AppointmentStats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      thisMonth: appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= startOfMonth
      }).length,
      thisWeek: appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= startOfWeek
      }).length,
    }

    // Get all employees for analytics
    const employees = await getEmployeesByCompany(companyId)
    
    let total_views = 0
    let total_clicks = 0
    let employees_with_views = 0
    const employee_performance: EmployeePerformance[] = []

    for (const employee of employees) {
      const analytics = await getEmployeeAnalytics(employee.id)
      total_views += analytics.view_count
      total_clicks += analytics.click_count
      
      if (analytics.view_count > 0) {
        employees_with_views++
      }

      // Get employee's appointments and CRM leads
      const employeeAppointments = appointments.filter(a => a.employee_id === employee.id)
      const { data: employeeLeads } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('company_id', companyId)
        .eq('employee_id', employee.id)

      employee_performance.push({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        appointments_count: employeeAppointments.length,
        crm_leads_count: employeeLeads?.length || 0,
        views_count: analytics.view_count,
        clicks_count: analytics.click_count,
      })
    }

    const analytics_stats: AnalyticsStats = {
      total_views,
      total_clicks,
      employees_with_views,
    }

    // Monthly CRM trend (last 6 months)
    const monthly_crm_trend: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const { count } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      monthly_crm_trend.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        count: count || 0,
      })
    }

    // Monthly appointments trend (last 6 months)
    const monthly_appointments_trend: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthAppointments = appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= monthStart && aptDate <= monthEnd
      })

      monthly_appointments_trend.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        count: monthAppointments.length,
      })
    }

    return {
      crm_stats,
      appointment_stats,
      analytics_stats,
      employee_performance,
      monthly_crm_trend,
      monthly_appointments_trend,
    }
  } catch (error) {
    console.error('Error fetching company reports:', error)
    return {
      crm_stats: { total: 0, today_follow_ups: 0, sales_completed: 0, in_follow_up: 0 },
      appointment_stats: { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0, thisMonth: 0, thisWeek: 0 },
      analytics_stats: { total_views: 0, total_clicks: 0, employees_with_views: 0 },
      employee_performance: [],
      monthly_crm_trend: [],
      monthly_appointments_trend: [],
    }
  }
}

export async function getEmployeeReports(employeeId: string, companyId: string): Promise<Omit<ReportsData, 'employee_performance'>> {
  try {
    // Get CRM stats
    const crm_stats = await getCRMStats(companyId, employeeId)

    // Get appointments
    const appointments = await getAppointmentsByEmployee(employeeId)
    
    // Calculate appointment stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    const appointment_stats: AppointmentStats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      thisMonth: appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= startOfMonth
      }).length,
      thisWeek: appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= startOfWeek
      }).length,
    }

    // Get analytics
    const analytics = await getEmployeeAnalytics(employeeId)
    const analytics_stats: AnalyticsStats = {
      total_views: analytics.view_count,
      total_clicks: analytics.click_count,
      employees_with_views: analytics.view_count > 0 ? 1 : 0,
    }

    // Monthly CRM trend (last 6 months)
    const monthly_crm_trend: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const { count } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('employee_id', employeeId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      monthly_crm_trend.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        count: count || 0,
      })
    }

    // Monthly appointments trend (last 6 months)
    const monthly_appointments_trend: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthAppointments = appointments.filter(a => {
        const aptDate = new Date(a.appointment_date)
        return aptDate >= monthStart && aptDate <= monthEnd
      })

      monthly_appointments_trend.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        count: monthAppointments.length,
      })
    }

    return {
      crm_stats,
      appointment_stats,
      analytics_stats,
      monthly_crm_trend,
      monthly_appointments_trend,
    }
  } catch (error) {
    console.error('Error fetching employee reports:', error)
    return {
      crm_stats: { total: 0, today_follow_ups: 0, sales_completed: 0, in_follow_up: 0 },
      appointment_stats: { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0, thisMonth: 0, thisWeek: 0 },
      analytics_stats: { total_views: 0, total_clicks: 0, employees_with_views: 0 },
      monthly_crm_trend: [],
      monthly_appointments_trend: [],
    }
  }
}

