import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  getCRMStats,
} from '@/services/crmService'
import type { CRMLead, CRMLeadFormData, CRMLeadStatus, CRMStats } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Filter, List, LayoutGrid } from 'lucide-react'

const statusColors: Record<CRMLeadStatus, string> = {
  'Yeni': 'bg-blue-100 text-blue-800 border-blue-300',
  'Görüşüldü': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Satış Yapıldı': 'bg-green-100 text-green-800 border-green-300',
  'Reddedildi': 'bg-red-100 text-red-800 border-red-300',
  'Takipte': 'bg-purple-100 text-purple-800 border-purple-300',
}

export default function EmployeeCRM() {
  const { t } = useLanguage()
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [stats, setStats] = useState<CRMStats>({
    total: 0,
    today_follow_ups: 0,
    sales_completed: 0,
    in_follow_up: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  const [statusFilter, setStatusFilter] = useState<CRMLeadStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  const [formData, setFormData] = useState<CRMLeadFormData>({
    customer_name: '',
    contact_name: '',
    phone: '',
    email: '',
    notes: '',
    follow_up_date: '',
    status: 'Yeni',
  })

  useEffect(() => {
    const sessionEmployee = getEmployeeSession()
    if (sessionEmployee) {
      setEmployee(sessionEmployee)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (employee) {
      loadData()
    }
  }, [employee, statusFilter])

  const loadData = async () => {
    if (!employee) {
      setLoading(false)
      return
    }

    try {
      await Promise.all([
        loadLeads(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading CRM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeads = async () => {
    if (!employee) return

    const leadsData = await getLeads(undefined, employee.id)
    setLeads(leadsData)
  }

  const loadStats = async () => {
    if (!employee) return

    const statsData = await getCRMStats(undefined, employee.id)
    setStats(statsData)
  }

  const handleOpenDialog = (lead?: CRMLead) => {
    if (lead) {
      setEditingLead(lead)
      setFormData({
        customer_name: lead.customer_name,
        contact_name: lead.contact_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        notes: lead.notes || '',
        follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
        status: lead.status,
      })
    } else {
      setEditingLead(null)
      setFormData({
        customer_name: '',
        contact_name: '',
        phone: '',
        email: '',
        notes: '',
        follow_up_date: '',
        status: 'Yeni',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingLead(null)
    setFormData({
      customer_name: '',
      contact_name: '',
      phone: '',
      email: '',
      notes: '',
      follow_up_date: '',
      status: 'Yeni',
    })
  }

  const handleSave = async () => {
    if (!employee || !formData.customer_name) return

    if (editingLead) {
      const updated = await updateLead(editingLead.id, formData)
      if (updated) {
        await loadLeads()
        await loadStats()
        handleCloseDialog()
      }
    } else {
      const created = await createLead(employee.company_id, {
        ...formData,
        employee_id: employee.id,
      })
      if (created) {
        await loadLeads()
        await loadStats()
        handleCloseDialog()
      }
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!window.confirm(t('crm.deleteConfirm'))) return

    const success = await deleteLead(leadId)
    if (success) {
      await loadLeads()
      await loadStats()
    }
  }

  const handleDeleteFromDialog = async () => {
    if (!editingLead) return
    if (!window.confirm(t('crm.deleteConfirm'))) return

    const success = await deleteLead(editingLead.id)
    if (success) {
      await loadLeads()
      await loadStats()
      handleCloseDialog()
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: CRMLeadStatus) => {
    const success = await updateLeadStatus(leadId, newStatus)
    if (success) {
      await loadLeads()
      await loadStats()
    }
  }

  const handleDragStart = (e: React.DragEvent, lead: CRMLead) => {
    e.dataTransfer.setData('leadId', lead.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: CRMLeadStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) {
      await handleStatusChange(leadId, targetStatus)
    }
  }

  const filteredLeads = statusFilter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t('employee.dashboard.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('crm.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('crm.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.addLead')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t('crm.stats.total')}
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t('crm.stats.today')}
            </div>
            <div className="text-2xl font-bold">{stats.today_follow_ups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t('crm.stats.sales')}
            </div>
            <div className="text-2xl font-bold">{stats.sales_completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t('crm.stats.followUp')}
            </div>
            <div className="text-2xl font-bold">{stats.in_follow_up}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and View Mode */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CRMLeadStatus | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">{t('crm.filter.all')}</option>
            <option value="Yeni">{t('crm.status.new')}</option>
            <option value="Görüşüldü">{t('crm.status.contacted')}</option>
            <option value="Satış Yapıldı">{t('crm.status.sold')}</option>
            <option value="Reddedildi">{t('crm.status.rejected')}</option>
            <option value="Takipte">{t('crm.status.followUp')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('crm.view.list') || 'Liste'}</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{t('crm.view.kanban') || 'Kanban'}</span>
          </Button>
        </div>
      </div>

      {/* Leads View */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {t('crm.empty')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('crm.emptyDesc')}
            </p>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.addLead')}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{lead.customer_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[lead.status]}`}>
                        {lead.status === 'Yeni' ? t('crm.status.new') :
                         lead.status === 'Görüşüldü' ? t('crm.status.contacted') :
                         lead.status === 'Satış Yapıldı' ? t('crm.status.sold') :
                         lead.status === 'Reddedildi' ? t('crm.status.rejected') :
                         t('crm.status.followUp')}
                      </span>
                    </div>
                    {lead.contact_name && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('crm.contactName')}: {lead.contact_name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {lead.phone && (
                        <span>{t('crm.phone')}: {lead.phone}</span>
                      )}
                      {lead.email && (
                        <span>{t('crm.email')}: {lead.email}</span>
                      )}
                      {lead.follow_up_date && (
                        <span>
                          {t('crm.followUpDate')}: {new Date(lead.follow_up_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{lead.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{t('crm.created')}: {new Date(lead.created_at).toLocaleDateString()}</span>
                      {lead.updated_at !== lead.created_at && (
                        <span>• {t('crm.updated')}: {new Date(lead.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as CRMLeadStatus)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    >
                      <option value="Yeni">{t('crm.status.new')}</option>
                      <option value="Görüşüldü">{t('crm.status.contacted')}</option>
                      <option value="Satış Yapıldı">{t('crm.status.sold')}</option>
                      <option value="Reddedildi">{t('crm.status.rejected')}</option>
                      <option value="Takipte">{t('crm.status.followUp')}</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(lead)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {(['Yeni', 'Görüşüldü', 'Satış Yapıldı', 'Reddedildi', 'Takipte'] as CRMLeadStatus[]).map((status) => {
            const statusLeads = filteredLeads.filter(lead => lead.status === status)
            const statusLabel = status === 'Yeni' ? t('crm.status.new') :
                               status === 'Görüşüldü' ? t('crm.status.contacted') :
                               status === 'Satış Yapıldı' ? t('crm.status.sold') :
                               status === 'Reddedildi' ? t('crm.status.rejected') :
                               t('crm.status.followUp')
            
            return (
              <div key={status} className="flex flex-col min-w-[250px]">
                <div className={`p-3 rounded-t-lg border-b-2 ${statusColors[status]}`}>
                  <h3 className="font-semibold text-sm">{statusLabel}</h3>
                  <span className="text-xs text-muted-foreground">({statusLeads.length})</span>
                </div>
                <div 
                  className="flex-1 bg-gray-50 rounded-b-lg p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {statusLeads.map((lead) => (
                    <Card 
                      key={lead.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      className="cursor-move hover:shadow-md transition-shadow bg-white"
                      onClick={() => handleOpenDialog(lead)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm mb-1">{lead.customer_name}</h4>
                        {lead.contact_name && (
                          <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {statusLeads.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {t('crm.empty')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lead Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingLead ? t('crm.editLead') : t('crm.addLead')}
            </DialogTitle>
            <DialogDescription>
              {editingLead ? 'Lead bilgilerini düzenleyin' : 'Yeni lead ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer_name">{t('crm.customerName')} *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_name">{t('crm.contactName')}</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">{t('crm.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('crm.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="follow_up_date">{t('crm.followUpDate')}</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">{t('crm.status')}</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CRMLeadStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Yeni">{t('crm.status.new')}</option>
                <option value="Görüşüldü">{t('crm.status.contacted')}</option>
                <option value="Satış Yapıldı">{t('crm.status.sold')}</option>
                <option value="Reddedildi">{t('crm.status.rejected')}</option>
                <option value="Takipte">{t('crm.status.followUp')}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">{t('crm.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                {t('crm.cancel')}
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.customer_name}>
                {t('crm.save')}
              </Button>
            </div>
            {editingLead && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={handleDeleteFromDialog}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('crm.deleteLead')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

