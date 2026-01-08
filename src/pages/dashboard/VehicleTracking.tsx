import { useEffect, useState, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getVehicles,
  getLatestVehicleLocations,
  getVehicleLocationHistory,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type VehicleWithLocation,
  type VehicleFormData,
} from '@/services/vehicleService'
import { getEmployeesByCompany } from '@/services/employeeService'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Car, Plus, Edit, Trash2, Navigation, Battery, RefreshCw } from 'lucide-react'
import { supabase } from '@/supabase/client'

// Lazy load map component to avoid SSR issues
const VehicleMap = lazy(() => import('@/components/VehicleMap'))

export default function VehicleTracking() {
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleLocations, setVehicleLocations] = useState<VehicleWithLocation[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [locationHistory, setLocationHistory] = useState<Array<{ lat: number; lng: number }>>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    plate_number: '',
    device_id: '',
    device_name: '',
    employee_id: '',
    vehicle_type: 'car',
    status: 'active',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]) // Istanbul default
  const [mapZoom, setMapZoom] = useState(10)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('vehicle_locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_locations',
        },
        (payload) => {
          console.log('New location update:', payload)
          loadVehicleLocations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId])

  const loadData = async () => {
    if (!user) return

    try {
      // Get company ID
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('id', user.id)
        .single()

      if (companyData && companyData.id) {
        setCompanyId(companyData.id)
        await Promise.all([
          loadVehicles(companyData.id),
          loadVehicleLocations(companyData.id),
          loadEmployees(companyData.id),
        ])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadVehicles = async (cid: string) => {
    const data = await getVehicles(cid)
    setVehicles(data)
  }

  const loadVehicleLocations = async (cid?: string) => {
    const cidToUse = cid || companyId
    if (!cidToUse) return

    const data = await getLatestVehicleLocations(cidToUse)
    setVehicleLocations(data)

    // Update map center to show all vehicles
    if (data.length > 0 && data[0].location) {
      const firstLocation = data[0].location
      setMapCenter([Number(firstLocation.latitude), Number(firstLocation.longitude)])
    }
  }

  const loadEmployees = async (cid: string) => {
    const data = await getEmployeesByCompany(cid)
    setEmployees(data)
  }

  const loadLocationHistory = async (vehicleId: string) => {
    const history = await getVehicleLocationHistory(vehicleId, 100)
    const path = history.map((loc) => ({
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
    }))
    setLocationHistory(path)
  }

  const handleVehicleClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    const location = vehicleLocations.find((vl) => vl.id === vehicle.id)?.location
    if (location) {
      setMapCenter([Number(location.latitude), Number(location.longitude)])
      setMapZoom(15)
      await loadLocationHistory(vehicle.id)
    }
  }

  const handleAddVehicle = () => {
    setIsEditing(false)
    setFormData({
      name: '',
      plate_number: '',
      device_id: '',
      device_name: '',
      employee_id: '',
      vehicle_type: 'car',
      status: 'active',
    })
    setIsDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setIsEditing(true)
    setFormData({
      name: vehicle.name,
      plate_number: vehicle.plate_number || '',
      device_id: vehicle.device_id,
      device_name: vehicle.device_name || '',
      employee_id: vehicle.employee_id || '',
      vehicle_type: vehicle.vehicle_type,
      status: vehicle.status,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveVehicle = async () => {
    if (!companyId) return

    try {
      if (isEditing && selectedVehicle) {
        await updateVehicle(selectedVehicle.id, formData)
      } else {
        await createVehicle(companyId, formData)
      }
      setIsDialogOpen(false)
      await loadVehicles(companyId)
      await loadVehicleLocations(companyId)
    } catch (error) {
      console.error('Error saving vehicle:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return

    try {
      await deleteVehicle(vehicleToDelete.id)
      setIsDeleteDialogOpen(false)
      setVehicleToDelete(null)
      await loadVehicles(companyId!)
      await loadVehicleLocations(companyId!)
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  const getVehicleTypeIcon = () => {
    return <Car className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1920px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Araç Takip</h1>
          <p className="text-muted-foreground mt-1">Araçlarınızın gerçek zamanlı konumlarını görüntüleyin</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadVehicleLocations()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={handleAddVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Araç Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Araçlar ({vehicles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vehicles.map((vehicle) => {
                  const location = vehicleLocations.find((vl) => vl.id === vehicle.id)?.location
                  return (
                    <div
                      key={vehicle.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVehicle?.id === vehicle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getVehicleTypeIcon(vehicle.vehicle_type)}
                            <h3 className="font-semibold">{vehicle.name}</h3>
                          </div>
                          {vehicle.plate_number && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {vehicle.plate_number}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Cihaz ID: {vehicle.device_id}
                          </p>
                          {location && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <Navigation className="h-3 w-3" />
                                <span>
                                  {Number(location.speed || 0).toFixed(0)} km/h
                                </span>
                              </div>
                              {location.battery_level !== null && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Battery className="h-3 w-3" />
                                  <span>%{location.battery_level}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(vehicle.status)}`}
                            >
                              {vehicle.status === 'active' ? 'Aktif' : vehicle.status === 'inactive' ? 'Pasif' : 'Bakımda'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditVehicle(vehicle)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteVehicle(vehicle)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {vehicles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz araç eklenmemiş</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Harita yükleniyor...</p>
                  </div>
                }
              >
                <VehicleMap
                  center={mapCenter}
                  zoom={mapZoom}
                  vehicleLocations={vehicleLocations}
                  locationHistory={locationHistory}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Araç Düzenle' : 'Yeni Araç Ekle'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Araç bilgilerini güncelleyin' : 'Yeni bir araç ve ESP32 cihazı ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Araç Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Araç 1, Kamyon-01"
              />
            </div>
            <div>
              <Label htmlFor="plate_number">Plaka</Label>
              <Input
                id="plate_number"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                placeholder="34 ABC 123"
              />
            </div>
            <div>
              <Label htmlFor="device_id">Cihaz ID (ESP32) *</Label>
              <Input
                id="device_id"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                placeholder="ESP32-001"
                disabled={isEditing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ESP32 kodundaki DEVICE_ID ile aynı olmalı
              </p>
            </div>
            <div>
              <Label htmlFor="device_name">Cihaz Adı</Label>
              <Input
                id="device_name"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                placeholder="ESP32 Cihaz Adı"
              />
            </div>
            <div>
              <Label htmlFor="vehicle_type">Araç Tipi</Label>
              <select
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="car">Otomobil</option>
                <option value="truck">Kamyon</option>
                <option value="van">Minibüs</option>
                <option value="motorcycle">Motosiklet</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div>
              <Label htmlFor="employee_id">Sürücü (Çalışan)</Label>
              <select
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || '' })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Sürücü seçin (opsiyonel)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="maintenance">Bakımda</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveVehicle} disabled={!formData.name || !formData.device_id}>
                {isEditing ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Araç Sil</DialogTitle>
            <DialogDescription>
              {vehicleToDelete?.name} adlı aracı silmek istediğinizden emin misiniz? Bu işlem
              geri alınamaz ve tüm konum geçmişi silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

