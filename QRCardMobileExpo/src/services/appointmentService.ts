import {supabase} from './supabase';
import type {Appointment} from '../types';

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

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export async function getAppointmentsByEmployee(employeeId: string): Promise<Appointment[]> {
  try {
    const {data, error} = await supabase
      .from('appointments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('appointment_date', {ascending: true});

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('appointments')
      .update({status} as any)
      .eq('id', appointmentId);

    if (error) {
      console.error('Error updating appointment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return false;
  }
}

export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('appointments').delete().eq('id', appointmentId);

    if (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
}
