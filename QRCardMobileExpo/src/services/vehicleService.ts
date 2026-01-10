import {supabase} from './supabase';
import type {Vehicle, VehicleLocation, VehicleCommand} from '../types';

export async function getVehicles(companyId: string): Promise<Vehicle[]> {
  try {
    const {data, error} = await supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', {ascending: false});

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return [];
  }
}

export async function getLatestVehicleLocations(
  companyId: string,
): Promise<VehicleLocation[]> {
  try {
    const {data, error} = await supabase.rpc('get_latest_vehicle_locations', {
      p_company_id: companyId,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting vehicle locations:', error);
    return [];
  }
}

export async function getVehicleLocationHistory(
  vehicleId: string,
  startDate?: string,
  endDate?: string,
): Promise<VehicleLocation[]> {
  try {
    let query = supabase
      .from('vehicle_locations')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('timestamp', {ascending: false})
      .limit(1000);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting vehicle location history:', error);
    return [];
  }
}

export async function sendVehicleCommand(
  vehicleId: string,
  commandType: 'stop' | 'start' | 'lock' | 'unlock',
  createdBy?: string,
): Promise<VehicleCommand | null> {
  try {
    const {data, error} = await supabase
      .from('vehicle_commands')
      .insert({
        vehicle_id: vehicleId,
        command_type: commandType,
        status: 'pending',
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending vehicle command:', error);
    return null;
  }
}

