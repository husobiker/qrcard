-- Vehicle tracking tables for ESP32 GPS devices
-- Vehicles table: stores vehicle/device information
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Vehicle name/identifier (e.g., "Araç 1", "Kamyon-01")
  plate_number TEXT, -- License plate number
  device_id TEXT UNIQUE NOT NULL, -- ESP32 device unique identifier
  device_name TEXT, -- Device friendly name
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Assigned employee/driver
  vehicle_type TEXT DEFAULT 'car' CHECK (vehicle_type IN ('car', 'truck', 'van', 'motorcycle', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_seen TIMESTAMP WITH TIME ZONE, -- Last location update timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle locations table: stores GPS location data from ESP32
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL, -- GPS latitude
  longitude DECIMAL(11, 8) NOT NULL, -- GPS longitude
  altitude DECIMAL(8, 2), -- Altitude in meters
  speed DECIMAL(5, 2), -- Speed in km/h
  heading DECIMAL(5, 2), -- Direction in degrees (0-360)
  accuracy DECIMAL(5, 2), -- GPS accuracy in meters
  satellite_count INTEGER, -- Number of satellites
  battery_level INTEGER, -- ESP32 battery level (0-100)
  signal_strength INTEGER, -- WiFi/GSM signal strength (0-100)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the location was recorded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_device_id ON vehicles(device_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_employee_id ON vehicles(employee_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp ON vehicle_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_created_at ON vehicle_locations(created_at DESC);
-- Spatial index for location queries (PostGIS extension would be better, but keeping it simple)
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_lat_lng ON vehicle_locations(latitude, longitude);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view their own vehicles
CREATE POLICY "Companies can view own vehicles"
  ON vehicles FOR SELECT
  USING (company_id = auth.uid());

-- RLS Policy: Companies can insert their own vehicles
CREATE POLICY "Companies can insert own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (company_id = auth.uid());

-- RLS Policy: Companies can update their own vehicles
CREATE POLICY "Companies can update own vehicles"
  ON vehicles FOR UPDATE
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- RLS Policy: Companies can delete their own vehicles
CREATE POLICY "Companies can delete own vehicles"
  ON vehicles FOR DELETE
  USING (company_id = auth.uid());

-- RLS Policy: Companies can view locations for their vehicles
CREATE POLICY "Companies can view own vehicle locations"
  ON vehicle_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_locations.vehicle_id
      AND vehicles.company_id = auth.uid()
    )
  );

-- RLS Policy: Allow ESP32 devices to insert location data (using device_id)
-- This will be done via service role key or anon key with special handling
-- For now, we'll allow inserts if the vehicle belongs to the company
CREATE POLICY "Allow vehicle location inserts"
  ON vehicle_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_locations.vehicle_id
      AND vehicles.company_id IN (
        SELECT id FROM companies WHERE id IS NOT NULL
      )
    )
  );

-- Function to update vehicle's last_seen timestamp
CREATE OR REPLACE FUNCTION update_vehicle_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles
  SET last_seen = NEW.timestamp,
      updated_at = NOW()
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_seen when location is inserted
CREATE TRIGGER trigger_update_vehicle_last_seen
  AFTER INSERT ON vehicle_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_last_seen();

-- Function to get vehicle by device_id (for ESP32 authentication)
CREATE OR REPLACE FUNCTION get_vehicle_by_device_id(p_device_id TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  name TEXT,
  plate_number TEXT,
  device_id TEXT,
  device_name TEXT,
  employee_id UUID,
  vehicle_type TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.company_id,
    v.name,
    v.plate_number,
    v.device_id,
    v.device_name,
    v.employee_id,
    v.vehicle_type,
    v.status
  FROM vehicles v
  WHERE v.device_id = p_device_id
  AND v.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest location for each vehicle
CREATE OR REPLACE FUNCTION get_latest_vehicle_locations(p_company_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  plate_number TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE,
  battery_level INTEGER,
  last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.plate_number,
    vl.latitude,
    vl.longitude,
    vl.speed,
    vl.heading,
    vl.timestamp,
    vl.battery_level,
    v.last_seen
  FROM vehicles v
  LEFT JOIN LATERAL (
    SELECT *
    FROM vehicle_locations
    WHERE vehicle_id = v.id
    ORDER BY timestamp DESC
    LIMIT 1
  ) vl ON true
  WHERE v.company_id = p_company_id
  AND v.status = 'active'
  ORDER BY v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

