import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getEmployeesByCompany } from '@/services/employeeService'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  calculateGoalProgress,
} from '@/services/goalService'
import type { PerformanceGoal, GoalFormData, GoalType, PeriodType, Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Target } from 'lucide-react'

export default function Goals() {
  const { user } = useAuth()
  useLanguage() // Language context
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [goals, setGoals] = useState<PerformanceGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])

  const [formData, setFormData] = useState<GoalFormData>({
    employee_id: '',
    goal_type: 'sales',
    target_value: 0,
    period_type: 'monthly',
    period_start: '',
    period_end: '',
  })

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (companyId) {
      loadGoals()
      loadEmployees()
    }
  }, [companyId])

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

  const loadGoals = async () => {
    if (!companyId) return
    const goalsData = await getGoals(companyId)
    setGoals(goalsData)
    
    // Calculate progress for all goals
    for (const goal of goalsData) {
      await calculateGoalProgress(goal, companyId)
    }
    
    // Reload to get updated values
    const updatedGoals = await getGoals(companyId)
    setGoals(updatedGoals)
  }

  const handleOpenDialog = (goal?: PerformanceGoal) => {
    if (goal) {
      setEditingGoal(goal)
      setFormData({
        employee_id: goal.employee_id,
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        period_type: goal.period_type,
        period_start: goal.period_start.split('T')[0],
        period_end: goal.period_end.split('T')[0],
      })
    } else {
      setEditingGoal(null)
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      setFormData({
        employee_id: '',
        goal_type: 'sales',
        target_value: 0,
        period_type: 'monthly',
        period_start: monthStart.toISOString().split('T')[0],
        period_end: monthEnd.toISOString().split('T')[0],
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingGoal(null)
  }

  const handleSave = async () => {
    if (!companyId || !formData.employee_id || formData.target_value <= 0) return

    if (editingGoal) {
      const updated = await updateGoal(editingGoal.id, formData)
      if (updated) {
        await loadGoals()
        handleCloseDialog()
      }
    } else {
      const created = await createGoal(companyId, formData)
      if (created) {
        await loadGoals()
        handleCloseDialog()
      }
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!window.confirm('Bu hedefi silmek istediğinize emin misiniz?')) return

    const success = await deleteGoal(goalId)
    if (success) {
      await loadGoals()
    }
  }

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case 'sales': return 'Satış'
      case 'leads': return 'Lead'
      case 'appointments': return 'Randevu'
      case 'revenue': return 'Gelir'
      default: return type
    }
  }

  const getProgressPercentage = (goal: PerformanceGoal) => {
    if (goal.target_value === 0) return 0
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
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
          <h1 className="text-3xl font-bold">Performans Hedefleri</h1>
          <p className="text-muted-foreground">Çalışanlar için hedefler belirleyin ve takip edin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Hedef
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">Hedef bulunamadı</p>
            <p className="text-sm text-muted-foreground mb-4">Yeni hedef ekleyerek başlayın</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hedef
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const employee = employees.find((e) => e.id === goal.employee_id)
            const progress = getProgressPercentage(goal)
            const isCompleted = goal.current_value >= goal.target_value
            
            return (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {getGoalTypeLabel(goal.goal_type)} - {goal.period_type === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </h3>
                        {employee && (
                          <span className="text-sm text-muted-foreground">
                            {employee.first_name} {employee.last_name}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hedef</span>
                          <span className="font-semibold">{goal.target_value.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Gerçekleşen</span>
                          <span className={`font-semibold ${isCompleted ? 'text-green-600' : ''}`}>
                            {goal.current_value.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>%{progress.toFixed(1)} tamamlandı</span>
                          <span>
                            {new Date(goal.period_start).toLocaleDateString('tr-TR')} - {new Date(goal.period_end).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
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

      {/* Goal Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Hedef bilgilerini düzenleyin' : 'Yeni performans hedefi ekleyin'}
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
              <Label htmlFor="goal_type">Hedef Tipi *</Label>
              <select
                id="goal_type"
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="sales">Satış</option>
                <option value="leads">Lead</option>
                <option value="appointments">Randevu</option>
                <option value="revenue">Gelir</option>
              </select>
            </div>
            <div>
              <Label htmlFor="target_value">Hedef Değer *</Label>
              <Input
                id="target_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="period_type">Dönem Tipi *</Label>
              <select
                id="period_type"
                value={formData.period_type}
                onChange={(e) => {
                  const periodType = e.target.value as PeriodType
                  const today = new Date()
                  let periodStart: Date
                  let periodEnd: Date
                  
                  if (periodType === 'monthly') {
                    periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
                    periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                  } else {
                    periodStart = new Date(today.getFullYear(), 0, 1)
                    periodEnd = new Date(today.getFullYear(), 11, 31)
                  }
                  
                  setFormData({
                    ...formData,
                    period_type: periodType,
                    period_start: periodStart.toISOString().split('T')[0],
                    period_end: periodEnd.toISOString().split('T')[0],
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period_start">Başlangıç Tarihi *</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="period_end">Bitiş Tarihi *</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.employee_id || formData.target_value <= 0}>
                Kaydet
              </Button>
            </div>
            {editingGoal && (
              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingGoal.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hedefi Sil
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


