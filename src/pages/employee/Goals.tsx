import { useEffect, useState } from 'react'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getGoals,
  calculateGoalProgress,
} from '@/services/goalService'
import type { PerformanceGoal, GoalType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'

export default function EmployeeGoals() {
  const { t } = useLanguage()
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [goals, setGoals] = useState<PerformanceGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employee) {
      loadGoals()
    }
  }, [employee])

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession()
    if (sessionEmployee) {
      setEmployee(sessionEmployee)
    }
    setLoading(false)
  }

  const loadGoals = async () => {
    if (!employee) return
    const goalsData = await getGoals(undefined, employee.id)
    setGoals(goalsData)
    
    // Calculate progress for all goals
    for (const goal of goalsData) {
      await calculateGoalProgress(goal, employee.company_id)
    }
    
    // Reload to get updated values
    const updatedGoals = await getGoals(undefined, employee.id)
    setGoals(updatedGoals)
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
      <div>
        <h1 className="text-3xl font-bold">Hedeflerim</h1>
        <p className="text-muted-foreground">Size atanan performans hedeflerini görüntüleyin</p>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground mb-2">Hedef bulunamadı</p>
            <p className="text-sm text-muted-foreground">Size atanan hedef bulunmamaktadır</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
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


