import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import {
  getCallLogs,
  getCallLogStats,
  updateCallLog,
  deleteCallLog,
} from '@/services/callLogService'
import type { CallLog, CallType, CallStatus, Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Edit, Trash2, Filter } from 'lucide-react'

const callTypeColors: Record<CallType, string> = {
  outgoing: 'bg-blue-100 text-blue-800 border-blue-300',
  incoming: 'bg-green-100 text-green-800 border-green-300',
  missed: 'bg-red-100 text-red-800 border-red-300',
}

const callStatusColors: Record<CallStatus, string> = {
  completed: 'bg-green-100 text-green-800',
  no_answer: 'bg-yellow-100 text-yellow-800',
  busy: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
}

export default function CallLogs() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [stats, setStats] = useState({
    total: 0,
    outgoing: 0,
    incoming: 0,
    missed: 0,
    total_duration: 0,
    average_duration: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCallLog, setEditingCallLog] = useState<CallLog | null>(null)
  const [typeFilter, setTypeFilter] = useState<CallType | 'all'>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadCallLogs()
      loadStats()
      loadEmployees()
    }
  }, [companyId, typeFilter, employeeFilter])

  const loadEmployees = async () => {
    if (!companyId) return
    const employeesData = await getEmployeesByCompany(companyId)
    setEmployees(employeesData)
  }

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const company = await getCompanyByUserId(user.id)
    if (company) {
      setCompanyId(company.id)
    }
    setLoading(false)
  }

  const loadCallLogs = async () => {
    if (!companyId) return

    const logs = await getCallLogs(companyId)
    let filteredLogs = logs

    if (typeFilter !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.call_type === typeFilter)
    }

    if (employeeFilter !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.employee_id === employeeFilter)
    }

    setCallLogs(filteredLogs)
  }

  const loadStats = async () => {
    if (!companyId) return
    const statsData = await getCallLogStats(companyId)
    setStats(statsData)
  }

  const handleEdit = (callLog: CallLog) => {
    setEditingCallLog(callLog)
    setNotes(callLog.notes || '')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingCallLog) return

    await updateCallLog(editingCallLog.id, {
      notes,
    })

    await loadCallLogs()
    setDialogOpen(false)
    setEditingCallLog(null)
    setNotes('')
  }

  const handleDelete = async (callLogId: string) => {
    if (confirm('Bu arama kaydını silmek istediğinize emin misiniz?')) {
      await deleteCallLog(callLogId)
      await loadCallLogs()
      await loadStats()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCallTypeIcon = (type: CallType) => {
    switch (type) {
      case 'outgoing':
        return <PhoneOutgoing className="h-4 w-4" />
      case 'incoming':
        return <PhoneIncoming className="h-4 w-4" />
      case 'missed':
        return <PhoneMissed className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Arama Geçmişi</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Arama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outgoing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gelen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ortalama Süre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.average_duration)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arama Tipi</Label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as CallType | 'all')}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tümü</option>
                <option value="outgoing">Giden</option>
                <option value="incoming">Gelen</option>
                <option value="missed">Cevapsız</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Çalışan</Label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tümü</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Aramalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {callLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Arama kaydı bulunamadı
              </div>
            ) : (
              callLogs.map((log) => {
                const employee = employees.find((e) => e.id === log.employee_id)
                const callDate = new Date(log.call_start_time)

                return (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${callTypeColors[log.call_type]}`}
                          >
                            <span className="flex items-center gap-1">
                              {getCallTypeIcon(log.call_type)}
                              {log.call_type === 'outgoing'
                                ? 'Giden'
                                : log.call_type === 'incoming'
                                ? 'Gelen'
                                : 'Cevapsız'}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${callStatusColors[log.call_status]}`}
                          >
                            {log.call_status === 'completed'
                              ? 'Tamamlandı'
                              : log.call_status === 'no_answer'
                              ? 'Cevapsız'
                              : log.call_status === 'busy'
                              ? 'Meşgul'
                              : 'Başarısız'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {log.customer_name || log.phone_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.phone_number}
                          </p>
                          {employee && (
                            <p className="text-sm text-muted-foreground">
                              Çalışan: {employee.first_name} {employee.last_name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {callDate.toLocaleDateString()}{' '}
                            {callDate.toLocaleTimeString()}
                          </p>
                          {log.call_duration > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Süre: {formatDuration(log.call_duration)}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Not: {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(log)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Not Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arama Notu Ekle/Düzenle</DialogTitle>
            <DialogDescription>
              {editingCallLog?.customer_name || editingCallLog?.phone_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Arama hakkında notlar..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSave}>Kaydet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


