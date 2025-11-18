import { supabase } from '@/supabase/client'

export interface AnalyticsData {
  view_count: number
  click_count: number
}

export async function trackView(employeeId: string) {
  try {
    const { error } = await supabase.from('analytics').insert({
      employee_id: employeeId,
      event_type: 'view',
      event_data: {},
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    } as any)

    if (error) {
      console.error('Error tracking view:', error)
    }
  } catch (error) {
    console.error('Error tracking view:', error)
  }
}

export async function trackClick(employeeId: string, clickData: Record<string, any> = {}) {
  try {
    const { error } = await supabase.from('analytics').insert({
      employee_id: employeeId,
      event_type: 'click',
      event_data: clickData,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    } as any)

    if (error) {
      console.error('Error tracking click:', error)
    }
  } catch (error) {
    console.error('Error tracking click:', error)
  }
}

export async function getEmployeeAnalytics(employeeId: string): Promise<AnalyticsData> {
  try {
    const { data: views, error: viewsError } = await supabase
      .from('analytics')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('event_type', 'view')

    const { data: clicks, error: clicksError } = await supabase
      .from('analytics')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('event_type', 'click')

    if (viewsError || clicksError) {
      console.error('Error fetching analytics:', viewsError || clicksError)
      return { view_count: 0, click_count: 0 }
    }

    return {
      view_count: views?.length || 0,
      click_count: clicks?.length || 0,
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return { view_count: 0, click_count: 0 }
  }
}

