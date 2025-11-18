import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getEmployeeSession } from '@/services/employeeAuthService'
import { getEmployeeReports, type ReportsData } from '@/services/reportsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, Eye, MousePointerClick, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'

export default function EmployeeReports() {
  const { t } = useLanguage()
  const [reports, setReports] = useState<Omit<ReportsData, 'employee_performance'> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const employee = getEmployeeSession()
    if (!employee) {
      setLoading(false)
      return
    }

    try {
      const reportsData = await getEmployeeReports(employee.id, employee.company_id)
      setReports(reportsData)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Default empty reports if none loaded
  const displayReports = reports || {
    crm_stats: { total: 0, today_follow_ups: 0, sales_completed: 0, in_follow_up: 0 },
    appointment_stats: { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0, thisMonth: 0, thisWeek: 0 },
    analytics_stats: { total_views: 0, total_clicks: 0, employees_with_views: 0 },
    monthly_crm_trend: [],
    monthly_appointments_trend: [],
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('employee.nav.reports') || 'Raporlar'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('reports.subtitle') || 'Detaylı raporlar ve analizler'}
        </p>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('reports.crm.total') || 'Toplam Lead'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.crm_stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('reports.crm.sales') || 'Satış Yapılan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayReports.crm_stats.sales_completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('reports.crm.followUp') || 'Takipte'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{displayReports.crm_stats.in_follow_up}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('reports.crm.today') || 'Bugün Görüşülecek'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{displayReports.crm_stats.today_follow_ups}</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('reports.appointments.total') || 'Toplam Randevu'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.appointment_stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('reports.appointments.confirmed') || 'Onaylanan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayReports.appointment_stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('reports.appointments.pending') || 'Beklemede'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{displayReports.appointment_stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('reports.appointments.thisMonth') || 'Bu Ay'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.appointment_stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('reports.analytics.views') || 'Toplam Görüntülenme'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.analytics_stats.total_views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              {t('reports.analytics.clicks') || 'Toplam Tıklama'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.analytics_stats.total_clicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {reports.monthly_crm_trend && reports.monthly_crm_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.trends.crm') || 'CRM Trendi (Son 6 Ay)'}</CardTitle>
            <CardDescription>
              {t('reports.trends.crmDesc') || 'Aylık lead oluşturma trendi'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.monthly_crm_trend.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.count / Math.max(...reports.monthly_crm_trend!.map(m => m.count), 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reports.monthly_appointments_trend && reports.monthly_appointments_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.trends.appointments') || 'Randevu Trendi (Son 6 Ay)'}</CardTitle>
            <CardDescription>
              {t('reports.trends.appointmentsDesc') || 'Aylık randevu oluşturma trendi'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.monthly_appointments_trend.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.count / Math.max(...reports.monthly_appointments_trend!.map(m => m.count), 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
