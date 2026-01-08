import { supabase } from '@/supabase/client'

export interface Vehicle {
  id: string
  company_id: string
  name: string
  plate_number: string | null
  device_id: string
  device_name: string | null
  employee_id: string | null
  vehicle_type: 'car' | 'truck' | 'van' | 'motorcycle' | 'other'
  status: 'active' | 'inactive' | 'maintenance'
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface VehicleLocation {
  id: string
  vehicle_id: string
  latitude: number
  longitude: number
  altitude: number | null
  speed: number | null
  heading: number | null
  accuracy: number | null
  satellite_count: number | null
  battery_level: number | null
  signal_strength: number | null
  timestamp: string
  created_at: string
}

export interface VehicleWithLocation extends Vehicle {
  location?: VehicleLocation | null
}

export interface VehicleFormData {
  name: string
  plate_number?: string
  device_id: string
  device_name?: string
  employee_id?: string
  vehicle_type: 'car' | 'truck' | 'van' | 'motorcycle' | 'other'
  status: 'active' | 'inactive' | 'maintenance'
}

// Get all vehicles for a company
export async function getVehicles(companyId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching vehicles:', error)
    return []
  }

  return data || []
}

// Get vehicle by ID
export async function getVehicleById(vehicleId: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    return null
  }

  return data
}

// Create a new vehicle
export async function createVehicle(
  companyId: string,
  vehicleData: VehicleFormData
): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      company_id: companyId,
      ...vehicleData,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating vehicle:', error)
    return null
  }

  return data
}

// Update vehicle
export async function updateVehicle(
  vehicleId: string,
  vehicleData: Partial<VehicleFormData>
): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      ...vehicleData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle:', error)
    return null
  }

  return data
}

// Delete vehicle
export async function deleteVehicle(vehicleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)

  if (error) {
    console.error('Error deleting vehicle:', error)
    return false
  }

  return true
}

// Get latest locations for all vehicles in a company
export async function getLatestVehicleLocations(
  companyId: string
): Promise<VehicleWithLocation[]> {
  const { data, error } = await supabase
    .rpc('get_latest_vehicle_locations', { p_company_id: companyId })

  if (error) {
    console.error('Error fetching vehicle locations:', error)
    return []
  }

  return data || []
}

// Get location history for a vehicle
export async function getVehicleLocationHistory(
  vehicleId: string,
  limit: number = 100
): Promise<VehicleLocation[]> {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching location history:', error)
    return []
  }

  return data || []
}

// Get locations within a time range
export async function getVehicleLocationsByDateRange(
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<VehicleLocation[]> {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error fetching location history:', error)
    return []
  }

  return data || []
}


