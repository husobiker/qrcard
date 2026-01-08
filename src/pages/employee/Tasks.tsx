import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getTasks,
  updateTaskStatus,
} from '@/services/taskService'
import type { Task, TaskStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

export default function EmployeeTasks() {
  useLanguage() // Language context
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employee) {
      loadTasks()
    }
  }, [employee, statusFilter])

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession()
    if (sessionEmployee) {
      setEmployee(sessionEmployee)
    }
    setLoading(false)
  }

  const loadTasks = async () => {
    if (!employee) return
    const tasksData = await getTasks(undefined, employee.id)
    setTasks(tasksData)
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus)
    if (success) {
      await loadTasks()
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
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
      <div>
        <h1 className="text-3xl font-bold">Görevlerim</h1>
        <p className="text-muted-foreground">Size atanan görevleri görüntüleyin ve yönetin</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
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

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">Görev bulunamadı</p>
            <p className="text-sm text-muted-foreground">Size atanan görev bulunmamaktadır</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
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
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
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
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


