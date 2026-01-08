import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
} from '@/services/taskService'
import type { Task, TaskFormData, TaskStatus, TaskPriority, Employee } from '@/types'
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
import { Plus, Edit, Trash2, Filter, AlertCircle } from 'lucide-react'

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export default function Tasks() {
  const { user } = useAuth()
  useLanguage() // Language context
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [employees, setEmployees] = useState<Employee[]>([])

  const [formData, setFormData] = useState<TaskFormData>({
    employee_id: '',
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  })

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadTasks()
      loadStats()
      loadEmployees()
    }
  }, [companyId, statusFilter, priorityFilter])

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

  const loadTasks = async () => {
    if (!companyId) return
    const tasksData = await getTasks(companyId)
    setTasks(tasksData)
  }

  const loadStats = async () => {
    if (!companyId) return
    const statsData = await getTaskStats(companyId)
    setStats(statsData)
  }

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setFormData({
        employee_id: task.employee_id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      })
    } else {
      setEditingTask(null)
      setFormData({
        employee_id: '',
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTask(null)
    setFormData({
      employee_id: '',
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
    })
  }

  const handleSave = async () => {
    if (!companyId || !formData.title || !formData.employee_id) return

    if (editingTask) {
      const updated = await updateTask(editingTask.id, formData)
      if (updated) {
        await loadTasks()
        await loadStats()
        handleCloseDialog()
      }
    } else {
      const created = await createTask(companyId, formData)
      if (created) {
        await loadTasks()
        await loadStats()
        handleCloseDialog()
      }
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return

    const success = await deleteTask(taskId)
    if (success) {
      await loadTasks()
      await loadStats()
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus)
    if (success) {
      await loadTasks()
      await loadStats()
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
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
          <h1 className="text-3xl font-bold">Görev Yönetimi</h1>
          <p className="text-muted-foreground">Çalışanlara görev atayın ve takip edin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Görev
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Beklemede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Devam Ediyor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlandı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gecikmiş</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">Görev bulunamadı</p>
            <p className="text-sm text-muted-foreground mb-4">Yeni görev ekleyerek başlayın</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Görev
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
            const employee = employees.find((e) => e.id === task.employee_id)
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
            
            return (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[task.status]}`}>
                          {task.status === 'pending' ? 'Beklemede' :
                           task.status === 'in_progress' ? 'Devam Ediyor' :
                           task.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority === 'low' ? 'Düşük' :
                           task.priority === 'medium' ? 'Orta' :
                           task.priority === 'high' ? 'Yüksek' : 'Acil'}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Gecikmiş
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {employee && (
                          <span>Çalışan: {employee.first_name} {employee.last_name}</span>
                        )}
                        {task.due_date && (
                          <span>
                            Son Tarih: {new Date(task.due_date).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                        {task.completed_at && (
                          <span>
                            Tamamlandı: {new Date(task.completed_at).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="in_progress">Devam Ediyor</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
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

      {/* Task Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? 'Görev bilgilerini düzenleyin' : 'Yeni görev ekleyin'}
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
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Durum</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">Beklemede</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Öncelik</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="due_date">Son Tarih</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.title || !formData.employee_id}>
                Kaydet
              </Button>
            </div>
            {editingTask && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingTask.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Görevi Sil
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


