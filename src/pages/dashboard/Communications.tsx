import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import {
  getCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getCommunicationStats,
} from '@/services/communicationService'
import type { CustomerCommunication, CommunicationFormData, CommunicationType, Employee } from '@/types'
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
import { Plus, Edit, Trash2, Mail, Phone, Users, MessageSquare } from 'lucide-react'

const communicationTypeIcons: Record<CommunicationType, any> = {
  email: Mail,
  phone: Phone,
  meeting: Users,
  sms: MessageSquare,
}

const communicationTypeLabels: Record<CommunicationType, string> = {
  email: 'E-posta',
  phone: 'Telefon',
  meeting: 'Toplantı',
  sms: 'SMS',
}

export default function Communications() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [communications, setCommunications] = useState<CustomerCommunication[]>([])
  const [stats, setStats] = useState({
    total: 0,
    email: 0,
    phone: 0,
    meeting: 0,
    sms: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<CustomerCommunication | null>(null)
  const [typeFilter, setTypeFilter] = useState<CommunicationType | 'all'>('all')
  const [employees, setEmployees] = useState<Employee[]>([])

  const [formData, setFormData] = useState<CommunicationFormData>({
    employee_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    communication_type: 'email',
    subject: '',
    notes: '',
    communication_date: new Date().toISOString(),
  })

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadCommunications()
      loadStats()
      loadEmployees()
    }
  }, [companyId, typeFilter])

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

  const loadCommunications = async () => {
    if (!companyId) return
    const communicationsData = await getCommunications(companyId)
    setCommunications(communicationsData)
  }

  const loadStats = async () => {
    if (!companyId) return
    const statsData = await getCommunicationStats(companyId)
    setStats(statsData)
  }

  const handleOpenDialog = (communication?: CustomerCommunication) => {
    if (communication) {
      setEditingCommunication(communication)
      setFormData({
        employee_id: communication.employee_id,
        customer_name: communication.customer_name,
        customer_email: communication.customer_email || '',
        customer_phone: communication.customer_phone || '',
        communication_type: communication.communication_type,
        subject: communication.subject || '',
        notes: communication.notes || '',
        communication_date: communication.communication_date,
      })
    } else {
      setEditingCommunication(null)
      setFormData({
        employee_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        communication_type: 'email',
        subject: '',
        notes: '',
        communication_date: new Date().toISOString(),
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCommunication(null)
  }

  const handleSave = async () => {
    if (!companyId || !formData.customer_name || !formData.employee_id) return

    if (editingCommunication) {
      const updated = await updateCommunication(editingCommunication.id, formData)
      if (updated) {
        await loadCommunications()
        await loadStats()
        handleCloseDialog()
      }
    } else {
      const created = await createCommunication(companyId, formData)
      if (created) {
        await loadCommunications()
        await loadStats()
        handleCloseDialog()
      }
    }
  }

  const handleDelete = async (communicationId: string) => {
    if (!window.confirm('Bu iletişimi silmek istediğinize emin misiniz?')) return

    const success = await deleteCommunication(communicationId)
    if (success) {
      await loadCommunications()
      await loadStats()
    }
  }

  const filteredCommunications = communications.filter((communication) => {
    if (typeFilter !== 'all' && communication.communication_type !== typeFilter) return false
    return true
  })

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
          <h1 className="text-3xl font-bold">Müşteri İletişim Geçmişi</h1>
          <p className="text-muted-foreground">Müşterilerle yapılan iletişimleri kaydedin ve takip edin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni İletişim
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-posta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.phone}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplantı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meeting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sms}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CommunicationType | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">Tüm İletişimler</option>
          <option value="email">E-posta</option>
          <option value="phone">Telefon</option>
          <option value="meeting">Toplantı</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      {/* Communications List */}
      {filteredCommunications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">İletişim bulunamadı</p>
            <p className="text-sm text-muted-foreground mb-4">Yeni iletişim ekleyerek başlayın</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni İletişim
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCommunications.map((communication) => {
            const employee = employees.find((e) => e.id === communication.employee_id)
            const Icon = communicationTypeIcons[communication.communication_type]
            
            return (
              <Card key={communication.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{communication.customer_name}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {communicationTypeLabels[communication.communication_type]}
                        </span>
                      </div>
                      {communication.subject && (
                        <p className="text-sm font-medium mb-1">{communication.subject}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        {employee && (
                          <span>Çalışan: {employee.first_name} {employee.last_name}</span>
                        )}
                        {communication.customer_email && (
                          <span>E-posta: {communication.customer_email}</span>
                        )}
                        {communication.customer_phone && (
                          <span>Telefon: {communication.customer_phone}</span>
                        )}
                        <span>
                          Tarih: {new Date(communication.communication_date).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {communication.notes && (
                        <p className="text-sm text-muted-foreground">{communication.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(communication)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(communication.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Communication Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingCommunication ? 'İletişimi Düzenle' : 'Yeni İletişim Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingCommunication ? 'İletişim bilgilerini düzenleyin' : 'Yeni müşteri iletişimi ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee_id">Çalışan *</Label>
              <select
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Çalışan Seçin</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="customer_name">Müşteri Adı *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_email">E-posta</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Telefon</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="communication_type">İletişim Tipi *</Label>
              <select
                id="communication_type"
                value={formData.communication_type}
                onChange={(e) => setFormData({ ...formData, communication_type: e.target.value as CommunicationType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="email">E-posta</option>
                <option value="phone">Telefon</option>
                <option value="meeting">Toplantı</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <Label htmlFor="subject">Konu</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="communication_date">İletişim Tarihi *</Label>
              <Input
                id="communication_date"
                type="datetime-local"
                value={formData.communication_date ? new Date(formData.communication_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, communication_date: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() })}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.customer_name || !formData.employee_id}>
                Kaydet
              </Button>
            </div>
            {editingCommunication && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingCommunication.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  İletişimi Sil
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


