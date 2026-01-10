import {supabase} from './supabase';
import type {Appointment} from '../types';

export interface AppointmentFormData {
  employee_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  appointment_date: string;
  duration_minutes: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export async function getAppointments(
  companyId?: string,
  employeeId?: string,
): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', {ascending: true});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
}

export async function createAppointment(
  companyId: string,
  appointmentData: AppointmentFormData,
): Promise<Appointment | null> {
  try {
    const {data, error} = await supabase
      .from('appointments')
      .insert({
        company_id: companyId,
        employee_id: appointmentData.employee_id,
        customer_name: appointmentData.customer_name,
        customer_email: appointmentData.customer_email,
        customer_phone: appointmentData.customer_phone || null,
        appointment_date: appointmentData.appointment_date,
        duration_minutes: appointmentData.duration_minutes,
        notes: appointmentData.notes || null,
        status: appointmentData.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    return null;
  }
}

export async function updateAppointment(
  appointmentId: string,
  appointmentData: Partial<AppointmentFormData>,
): Promise<Appointment | null> {
  try {
    const {data, error} = await supabase
      .from('appointments')
      .update(appointmentData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return null;
  }
}

export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    return !error;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
}

