import { supabase } from '@/supabase/client'
import type { Appointment } from '@/types'

export async function createAppointment(appointment: {
  employee_id: string
  company_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  appointment_date: string
  duration_minutes?: number
  notes?: string
}): Promise<Appointment | null> {
  try {
    console.log('Creating appointment with data:', {
      employee_id: appointment.employee_id,
      company_id: appointment.company_id,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      appointment_date: appointment.appointment_date,
    });

    // @ts-ignore - Supabase types not properly inferred
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error hint:', error.hint)
      return null
    }

    console.log('Appointment created successfully:', data)
    return data
  } catch (error: any) {
    console.error('Error creating appointment (catch):', error)
    console.error('Error stack:', error?.stack)
    return null
  }
}

export async function getAppointmentsByEmployee(employeeId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return []
  }
}

export async function getAppointmentsByCompany(companyId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return []
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  employeeId?: string
): Promise<boolean> {
  try {
    // If employeeId is provided, use RPC function (for employee updates)
    if (employeeId) {
      const { data, error } = await supabase.rpc('update_appointment_status_by_employee', {
        appointment_id: appointmentId,
        employee_id_param: employeeId,
        new_status: status
      } as any)

      if (error) {
        console.error('Error updating appointment via RPC:', error)
        return false
      }

      return data === true
    }

    // Otherwise, use direct update (for company updates)
    // @ts-ignore - Supabase types not properly inferred
    const { error } = await supabase
      .from('appointments')
      // @ts-ignore
      .update({ status } as any)
      .eq('id', appointmentId)

    if (error) {
      console.error('Error updating appointment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating appointment:', error)
    return false
  }
}

export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)

    if (error) {
      console.error('Error deleting appointment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return false
  }
}

export async function getAvailableTimeSlots(
  employeeId: string,
  date: string
): Promise<string[]> {
  try {
    // Get employee's available hours
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('available_hours, default_duration_minutes')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return []
    }

    // Get existing appointments for the date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date, duration_minutes')
      .eq('employee_id', employeeId)
      .gte('appointment_date', startOfDay.toISOString())
      .lte('appointment_date', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed'])

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(date)
    const dayIndex = dateObj.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[dayIndex]
    
    // If available_hours is null, use default schedule (Mon-Fri 9-17)
    const defaultHours = {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' },
    }
    
    const daySchedule = (employee as any).available_hours?.[dayOfWeek] || defaultHours[dayOfWeek as keyof typeof defaultHours]

    if (!daySchedule || !daySchedule.enabled) {
      return []
    }

    // Generate available time slots
    const slots: string[] = []
    const [startHour, startMinute] = daySchedule.start.split(':').map(Number)
    const [endHour, endMinute] = daySchedule.end.split(':').map(Number)
    const duration = (employee as any).default_duration_minutes || 30

    const startTime = new Date(date)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(endHour, endMinute, 0, 0)

    // Create booked time ranges
    const bookedRanges = (appointments || []).map((apt) => {
      const aptStart = new Date((apt as any).appointment_date)
      const aptEnd = new Date(aptStart.getTime() + ((apt as any).duration_minutes || duration) * 60000)
      return { start: aptStart, end: aptEnd }
    })

    let currentTime = new Date(startTime)
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000)

      // Check if slot overlaps with any booked appointment
      const isBooked = bookedRanges.some((booked) => {
        return (
          (currentTime >= booked.start && currentTime < booked.end) ||
          (slotEnd > booked.start && slotEnd <= booked.end) ||
          (currentTime <= booked.start && slotEnd >= booked.end)
        )
      })

      if (slotEnd <= endTime && !isBooked) {
        slots.push(currentTime.toISOString())
      }

      currentTime = new Date(currentTime.getTime() + duration * 60000)
    }

    return slots
  } catch (error) {
    console.error('Error getting available time slots:', error)
    return []
  }
}

