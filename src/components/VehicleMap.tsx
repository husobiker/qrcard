import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

// Custom vehicle icon
const createVehicleIcon = (color: string = 'blue') => {
  return L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Component to handle map updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

interface VehicleLocation {
  id: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  battery_level: number | null
  timestamp: string
}

interface VehicleMapProps {
  center: [number, number]
  zoom: number
  vehicleLocations: Array<{
    id: string
    name: string
    plate_number: string | null
    location?: VehicleLocation | null
  }>
  locationHistory: Array<{ lat: number; lng: number }>
}

export default function VehicleMap({
  center,
  zoom,
  vehicleLocations,
  locationHistory,
}: VehicleMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Harita yükleniyor...</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} />
      {vehicleLocations.map((vehicle) => {
        if (!vehicle.location) return null
        const lat = Number(vehicle.location.latitude)
        const lng = Number(vehicle.location.longitude)
        return (
          <Marker
            key={vehicle.id}
            position={[lat, lng]}
            icon={createVehicleIcon('blue')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{vehicle.name}</h3>
                {vehicle.plate_number && (
                  <p className="text-sm text-muted-foreground">{vehicle.plate_number}</p>
                )}
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <strong>Hız:</strong> {Number(vehicle.location.speed || 0).toFixed(0)} km/h
                  </p>
                  {vehicle.location.heading && (
                    <p>
                      <strong>Yön:</strong> {Number(vehicle.location.heading).toFixed(0)}°
                    </p>
                  )}
                  {vehicle.location.battery_level !== null && (
                    <p>
                      <strong>Batarya:</strong> %{vehicle.location.battery_level}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(vehicle.location.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
      {locationHistory.length > 1 && (
        <Polyline
          positions={locationHistory}
          color="blue"
          weight={3}
          opacity={0.5}
        />
      )}
    </MapContainer>
  )
}


