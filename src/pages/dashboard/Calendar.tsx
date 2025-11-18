import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import { getAppointmentsByCompany } from '@/services/appointmentService'
import type { Appointment, Employee } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Calendar() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadAppointments()
    }
  }, [companyId, currentDate])

  const loadData = async () => {
    if (!user) return

    const company = await getCompanyByUserId(user.id)
    if (company) {
      setCompanyId(company.id)
      const employeesData = await getEmployeesByCompany(company.id)
      setEmployees(employeesData)
    }
    setLoading(false)
  }

  const loadAppointments = async () => {
    if (!companyId) return

    const appointmentsData = await getAppointmentsByCompany(companyId)
    setAppointments(appointmentsData)
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
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date)
      const aptDateStr = aptDate.toISOString().split('T')[0]
      return aptDateStr === dateStr
    })
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            {t('calendar.today')}
          </Button>
          <Button variant="outline" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {monthNames[month]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
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
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday
                      ? 'bg-blue-50 border-blue-300 border-2'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5 overflow-y-auto max-h-[100px]">
                    {dayAppointments.slice(0, 5).map((apt) => {
                      const aptDate = new Date(apt.appointment_date)
                      const timeStr = aptDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      return (
                        <div
                          key={apt.id}
                          className={`text-[10px] px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${statusColors[apt.status]}`}
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setDialogOpen(true)
                          }}
                          title={`${getEmployeeName(apt.employee_id)} - ${timeStr} - ${apt.customer_name}`}
                        >
                          <div className="font-semibold truncate leading-tight">
                            {timeStr}
                          </div>
                          <div className="truncate text-[9px] font-medium leading-tight">
                            {getEmployeeName(apt.employee_id)}
                          </div>
                          <div className="truncate text-[9px] leading-tight">
                            {apt.customer_name}
                          </div>
                        </div>
                      )
                    })}
                    {dayAppointments.length > 5 && (
                      <div className="text-[9px] text-muted-foreground text-center py-0.5">
                        +{dayAppointments.length - 5} {t('calendar.more')}
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
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
          <span>{t('calendar.status.pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span>{t('calendar.status.confirmed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span>{t('calendar.status.cancelled')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span>{t('calendar.status.completed')}</span>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t('calendar.detail.title')}</DialogTitle>
            <DialogDescription>
              {t('calendar.detail.subtitle')}
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
                  <span className="text-sm font-medium text-muted-foreground">{t('calendar.detail.employee')}:</span>
                  <p className="text-base font-semibold">{getEmployeeName(selectedAppointment.employee_id)}</p>
                </div>
                
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

