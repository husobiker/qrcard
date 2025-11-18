import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyByUserId } from '@/services/companyService'
import { getCompanyReports, type ReportsData } from '@/services/reportsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, Eye, MousePointerClick, Users, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function Reports() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [, setCompanyId] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const company = await getCompanyByUserId(user.id)
      if (company) {
        setCompanyId(company.id)
        const reportsData = await getCompanyReports(company.id)
        setReports(reportsData)
      } else {
        console.error('Company not found')
      }
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
    employee_performance: [],
    monthly_crm_trend: [],
    monthly_appointments_trend: [],
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('common.reports') || 'Raporlar'}</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('reports.analytics.activeEmployees') || 'Aktif Çalışanlar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayReports.analytics_stats.employees_with_views}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {displayReports.monthly_crm_trend && displayReports.monthly_crm_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.trends.crm') || 'CRM Trendi (Son 6 Ay)'}</CardTitle>
            <CardDescription>
              {t('reports.trends.crmDesc') || 'Aylık lead oluşturma trendi'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayReports.monthly_crm_trend.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.count / Math.max(...displayReports.monthly_crm_trend!.map(m => m.count), 1)) * 100, 100)}%`,
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

      {displayReports.monthly_appointments_trend && displayReports.monthly_appointments_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.trends.appointments') || 'Randevu Trendi (Son 6 Ay)'}</CardTitle>
            <CardDescription>
              {t('reports.trends.appointmentsDesc') || 'Aylık randevu oluşturma trendi'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayReports.monthly_appointments_trend.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.count / Math.max(...displayReports.monthly_appointments_trend!.map(m => m.count), 1)) * 100, 100)}%`,
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

      {/* Employee Performance */}
      {displayReports.employee_performance && displayReports.employee_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.employeePerformance') || 'Çalışan Performansı'}</CardTitle>
            <CardDescription>
              {t('reports.employeePerformanceDesc') || 'Çalışanların randevu, lead ve görüntülenme istatistikleri'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">
                      {t('reports.employee') || 'Çalışan'}
                    </th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">
                      {t('reports.appointments') || 'Randevular'}
                    </th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">
                      {t('reports.leads') || 'Leadler'}
                    </th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">
                      {t('reports.views') || 'Görüntülenme'}
                    </th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">
                      {t('reports.clicks') || 'Tıklamalar'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayReports.employee_performance.map((emp) => (
                    <tr key={emp.employee_id} className="border-b">
                      <td className="py-2 px-4">{emp.employee_name}</td>
                      <td className="py-2 px-4 text-right">{emp.appointments_count}</td>
                      <td className="py-2 px-4 text-right">{emp.crm_leads_count}</td>
                      <td className="py-2 px-4 text-right">{emp.views_count}</td>
                      <td className="py-2 px-4 text-right">{emp.clicks_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
