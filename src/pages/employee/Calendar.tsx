import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { getAppointmentsByEmployee, createAppointment, updateAppointmentStatus, deleteAppointment } from '@/services/appointmentService'
import { getEmployeeById } from '@/services/employeeService'
import { getCompanyById } from '@/services/companyService'
import type { Appointment, Employee, Company } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Clock, Plus, Check, X, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'

export default function EmployeeCalendar() {
  const { t } = useLanguage()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employee) {
      loadAppointments()
    }
  }, [employee, currentDate])

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession()
    if (!sessionEmployee) {
      setLoading(false)
      return
    }

    const fullEmployee = await getEmployeeById(sessionEmployee.id)
    if (fullEmployee) {
      setEmployee(fullEmployee)
      const companyData = await getCompanyById(fullEmployee.company_id)
      if (companyData) {
        setCompany(companyData)
      }
    }
    setLoading(false)
  }

  const loadAppointments = async () => {
    if (!employee) return

    const appointmentsData = await getAppointmentsByEmployee(employee.id)
    setAppointments(appointmentsData)
  }

  const handleAddAppointment = async () => {
    if (!employee || !company) return

    if (!newAppointment.customer_name || !newAppointment.customer_email || !newAppointment.appointment_date || !newAppointment.appointment_time) {
      alert(t('employee.calendar.fillAllFields') || 'Please fill in all required fields')
      return
    }

    const dateTime = new Date(`${newAppointment.appointment_date}T${newAppointment.appointment_time}`)
    
    if (isNaN(dateTime.getTime())) {
      alert(t('employee.calendar.invalidDateTime') || 'Invalid date or time')
      return
    }
    
    const appointment = await createAppointment({
      employee_id: employee.id,
      company_id: company.id,
      customer_name: newAppointment.customer_name,
      customer_email: newAppointment.customer_email,
      customer_phone: newAppointment.customer_phone || undefined,
      appointment_date: dateTime.toISOString(),
      duration_minutes: newAppointment.duration_minutes,
      notes: newAppointment.notes || undefined,
    })

    if (appointment) {
      // Reload appointments from server to ensure consistency
      await loadAppointments()
      setAddDialogOpen(false)
      setNewAppointment({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        appointment_date: '',
        appointment_time: '',
        duration_minutes: 30,
        notes: '',
      })
    } else {
      alert(t('employee.calendar.createError') || 'Failed to create appointment. Please try again.')
    }
  }

  const handleUpdateStatus = async (appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    const success = await updateAppointmentStatus(appointmentId, status)
    if (success) {
      // Update local state immediately for better UX
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      ))
      // Also update selected appointment if it's the one being updated
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status })
      }
      // Reload from server to ensure consistency
      await loadAppointments()
      // Close dialog after successful update
      setDialogOpen(false)
    } else {
      alert(t('employee.calendar.updateError') || 'Failed to update appointment status. Please try again.')
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    const confirmMessage = t('employee.calendar.deleteConfirm') || 'Are you sure you want to delete this appointment?'
    if (!window.confirm(confirmMessage)) {
      return
    }

    const success = await deleteAppointment(appointmentId)
    if (success) {
      setAppointments(appointments.filter(apt => apt.id !== appointmentId))
      setDialogOpen(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getAppointmentsForDate = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date)
      // Convert to local date string
      const aptYear = aptDate.getFullYear()
      const aptMonth = aptDate.getMonth()
      const aptDay = aptDate.getDate()
      const aptDateStr = `${aptYear}-${String(aptMonth + 1).padStart(2, '0')}-${String(aptDay).padStart(2, '0')}`
      return aptDateStr === dateStr
    })
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
  }

  const monthNames = [
    t('calendar.january'),
    t('calendar.february'),
    t('calendar.march'),
    t('calendar.april'),
    t('calendar.may'),
    t('calendar.june'),
    t('calendar.july'),
    t('calendar.august'),
    t('calendar.september'),
    t('calendar.october'),
    t('calendar.november'),
    t('calendar.december'),
  ]

  const dayNames = [
    t('calendar.sunday'),
    t('calendar.monday'),
    t('calendar.tuesday'),
    t('calendar.wednesday'),
    t('calendar.thursday'),
    t('calendar.friday'),
    t('calendar.saturday'),
  ]

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('employee.calendar.title') || 'My Calendar'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('employee.calendar.subtitle') || 'View and manage your appointments'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('employee.calendar.addAppointment') || 'Add Appointment'}
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t('calendar.today')}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-center">
            {monthNames[month]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-xs text-muted-foreground py-1.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square min-h-[80px]"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const date = new Date(year, month, day)
              const dayAppointments = getAppointmentsForDate(date)
              const isToday =
                date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={day}
                  className={`aspect-square min-h-[80px] border rounded-md p-1.5 flex flex-col ${
                    isToday
                      ? 'bg-blue-50 border-blue-300 border-2'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-y-auto">
                    {dayAppointments.slice(0, 4).map((apt) => {
                      const aptDate = new Date(apt.appointment_date)
                      const timeStr = aptDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      return (
                        <div
                          key={apt.id}
                          className={`text-[9px] px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${statusColors[apt.status]}`}
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setDialogOpen(true)
                          }}
                          title={`${timeStr} - ${apt.customer_name}`}
                        >
                          <div className="font-semibold truncate leading-tight">
                            {timeStr}
                          </div>
                          <div className="truncate leading-tight">
                            {apt.customer_name}
                          </div>
                        </div>
                      )
                    })}
                    {dayAppointments.length > 4 && (
                      <div className="text-[8px] text-muted-foreground text-center py-0.5">
                        +{dayAppointments.length - 4} {t('calendar.more')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
          <span className="text-muted-foreground">{t('calendar.status.pending')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span className="text-muted-foreground">{t('calendar.status.confirmed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span className="text-muted-foreground">{t('calendar.status.cancelled')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-muted-foreground">{t('calendar.status.completed')}</span>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t('employee.calendar.detail.title') || 'Appointment Details'}</DialogTitle>
            <DialogDescription>
              {t('employee.calendar.detail.subtitle') || 'View and manage appointment details'}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {new Date(selectedAppointment.appointment_date).toLocaleDateString()} {new Date(selectedAppointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedAppointment.status]}`}>
                  {t(`calendar.status.${selectedAppointment.status}`)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.customer')}:</span>
                  <p className="text-base">{selectedAppointment.customer_name}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.email')}:</span>
                  <p className="text-base">{selectedAppointment.customer_email}</p>
                </div>
                
                {selectedAppointment.customer_phone && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.phone')}:</span>
                    <p className="text-base">{selectedAppointment.customer_phone}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.duration')}:</span>
                  <p className="text-base">{selectedAppointment.duration_minutes} {t('calendar.detail.minutes')}</p>
                </div>
                
                {selectedAppointment.notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.notes')}:</span>
                    <p className="text-base whitespace-pre-line">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAppointment.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('employee.calendar.confirm') || 'Confirm'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('employee.calendar.cancel') || 'Cancel'}
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t('employee.calendar.markComplete') || 'Mark Complete'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('employee.calendar.delete') || 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent onClose={() => setAddDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t('employee.calendar.addTitle') || 'Add New Appointment'}</DialogTitle>
            <DialogDescription>
              {t('employee.calendar.addSubtitle') || 'Create a new appointment manually'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{t('employee.calendar.date') || 'Date'}</Label>
                <Input
                  id="date"
                  type="date"
                  value={newAppointment.appointment_date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">{t('employee.calendar.time') || 'Time'}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newAppointment.appointment_time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer_name">{t('calendar.detail.customer')}</Label>
              <Input
                id="customer_name"
                value={newAppointment.customer_name}
                onChange={(e) => setNewAppointment({ ...newAppointment, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_email">{t('calendar.detail.email')}</Label>
              <Input
                id="customer_email"
                type="email"
                value={newAppointment.customer_email}
                onChange={(e) => setNewAppointment({ ...newAppointment, customer_email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">{t('calendar.detail.phone')}</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={newAppointment.customer_phone}
                onChange={(e) => setNewAppointment({ ...newAppointment, customer_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="duration">{t('calendar.detail.duration')}</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={newAppointment.duration_minutes}
                onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('calendar.detail.notes')}</Label>
              <Textarea
                id="notes"
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="flex-1">
                {t('employee.calendar.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleAddAppointment} className="flex-1" disabled={!newAppointment.customer_name || !newAppointment.customer_email || !newAppointment.appointment_date || !newAppointment.appointment_time}>
                {t('employee.calendar.add') || 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

