import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEmployeeSession } from "@/services/employeeAuthService";
import { getEmployeeById } from "@/services/employeeService";
import { getCompanyById } from "@/services/companyService";
import { getEmployeeReports } from "@/services/reportsService";
import { getTaskStats } from "@/services/taskService";
import { getTransactionStats } from "@/services/transactionService";
import { getCommunicationStats } from "@/services/communicationService";
import { getCommissionStats } from "@/services/commissionService";
import { getEmployeeSipSettings, getCompanySipSettings } from "@/services/sipSettingsService";
import CallButton from "@/components/CallButton";
import type { Employee, Company, EmployeeSipSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  MessageCircle,
  Building2,
  Share2,
  MapPin,
  Globe,
  ExternalLink,
  TrendingUp,
  Calendar,
  CheckSquare,
  Target,
  DollarSign,
  MessageSquare,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MousePointerClick,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEmployeePublicUrl } from "@/utils/url";
import { Button } from "@/components/ui/button";

export default function EmployeeDashboard() {
  const { t } = useLanguage();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [employeeSipSettings, setEmployeeSipSettings] = useState<EmployeeSipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    crm: { total: 0, sales_completed: 0, in_follow_up: 0, today_follow_ups: 0 },
    appointments: { total: 0, pending: 0, confirmed: 0, thisWeek: 0 },
    tasks: { total: 0, pending: 0, in_progress: 0, overdue: 0 },
    transactions: { total_income: 0, total_expense: 0, net_amount: 0 },
    communications: { total: 0 },
    commissions: { total_commission: 0, pending_commission: 0 },
    analytics: { total_views: 0, total_clicks: 0 },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sessionEmployee = getEmployeeSession();
    if (!sessionEmployee) {
      setLoading(false);
      return;
    }

    try {
      // Load full employee data
      const fullEmployee = await getEmployeeById(sessionEmployee.id);
      if (fullEmployee) {
        setEmployee(fullEmployee);
        
        // Load company data
        const companyData = await getCompanyById(fullEmployee.company_id);
        if (companyData) {
          setCompany(companyData);
          
          // Load SIP settings
          const empSip = await getEmployeeSipSettings(sessionEmployee.id);
          
          console.log('SIP Settings Loaded:', {
            employeeId: sessionEmployee.id,
            employeeSip: empSip,
            hasEmployeeSip: !!empSip,
          });
          
          setEmployeeSipSettings(empSip);
          
          // Log if settings are missing (for debugging)
          if (!empSip) {
            console.warn('⚠️ SIP Settings Missing:', {
              employeeId: sessionEmployee.id,
              hasEmployeeSip: !!empSip,
            });
          } else {
            console.log('✅ SIP settings loaded successfully');
          }
        }

        // Load all statistics
        const [
          reportsData,
          taskStatsData,
          transactionStatsData,
          communicationStatsData,
          commissionStatsData,
        ] = await Promise.all([
          getEmployeeReports(sessionEmployee.id, sessionEmployee.company_id),
          getTaskStats(undefined, sessionEmployee.id),
          getTransactionStats(undefined, sessionEmployee.id),
          getCommunicationStats(undefined, sessionEmployee.id),
          getCommissionStats(undefined, sessionEmployee.id),
        ]);

        setStats({
          crm: reportsData.crm_stats,
          appointments: reportsData.appointment_stats,
          analytics: reportsData.analytics_stats,
          tasks: taskStatsData,
          transactions: transactionStatsData,
          communications: communicationStatsData,
          commissions: commissionStatsData,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = () => {
    if (!employee || !company) return "";
    return getEmployeePublicUrl(company.id, employee.id);
  };

  const handleShare = async () => {
    const url = getPublicUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${employee?.first_name} ${employee?.last_name}`,
          text: `${employee?.first_name} ${employee?.last_name} - ${company?.name}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!employee || !company) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">
          {t("employee.dashboard.notFound") || "Employee not found"}
        </div>
      </div>
    );
  }

  const publicUrl = getPublicUrl();
  const socialLinks = employee.social_links || {};

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anasayfa</h1>
          <p className="text-muted-foreground">Genel bakış ve özet istatistikler</p>
        </div>
        {employeeSipSettings ? (
          <CallButton
            employeeSipSettings={employeeSipSettings}
            company={company}
            companyId={employee.company_id}
            employeeId={employee.id}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            SIP ayarları eksik
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CRM Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Toplam Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.crm.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.crm.sales_completed} satış yapıldı
            </div>
          </CardContent>
        </Card>

        {/* Appointments Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Randevular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointments.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.appointments.pending} beklemede
            </div>
          </CardContent>
        </Card>

        {/* Tasks Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Görevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.tasks.overdue > 0 && (
                <span className="text-red-600">{stats.tasks.overdue} gecikmiş</span>
              )}
              {stats.tasks.overdue === 0 && `${stats.tasks.pending} beklemede`}
            </div>
          </CardContent>
        </Card>

        {/* Commissions Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Komisyon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.commissions.total_commission.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.commissions.pending_commission.toLocaleString('tr-TR')} ₺ bekliyor
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/employee/crm">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Satış Takibi</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.crm.total} lead • {stats.crm.today_follow_ups} bugün görüşülecek
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employee/calendar">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Takvim</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.appointments.total} randevu • {stats.appointments.thisWeek} bu hafta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employee/tasks">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Görevlerim</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.tasks.total} görev • {stats.tasks.in_progress} devam ediyor
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employee/goals">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Hedeflerim</h3>
                  <p className="text-sm text-muted-foreground">Performans hedeflerini görüntüle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employee/transactions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">İşlemlerim</h3>
                  <p className="text-sm text-muted-foreground">
                    Net: {stats.transactions.net_amount >= 0 ? '+' : ''}{stats.transactions.net_amount.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employee/communications">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">İletişimlerim</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.communications.total} iletişim kaydı
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profilim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {employee?.profile_image_url ? (
                <img
                  src={employee.profile_image_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">
                    {employee?.first_name.charAt(0)}
                    {employee?.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {employee?.first_name} {employee?.last_name}
              </h2>
              {employee?.job_title && (
                <p className="text-lg text-gray-600 mt-1">{employee.job_title}</p>
              )}
              {employee?.department && (
                <p className="text-sm text-gray-500 mt-1">{employee.department}</p>
              )}

              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                {employee?.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                      {employee.phone}
                    </a>
                  </div>
                )}
                {employee?.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                      {employee.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {employee?.social_links && (
                (employee.social_links.instagram ||
                  employee.social_links.linkedin ||
                  employee.social_links.facebook ||
                  employee.social_links.youtube ||
                  employee.social_links.whatsapp) && (
                  <div className="mt-4 flex gap-2">
                    {employee.social_links.instagram && (
                      <a
                        href={employee.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {employee.social_links.linkedin && (
                      <a
                        href={employee.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {employee.social_links.facebook && (
                      <a
                        href={employee.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {employee.social_links.youtube && (
                      <a
                        href={employee.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                    {employee.social_links.whatsapp && (
                      <a
                        href={`https://wa.me/${employee.social_links.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* About Section */}
          {employee?.about && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hakkımda</h3>
              <p className="text-gray-700 whitespace-pre-line">{employee.about}</p>
            </div>
          )}

          {/* Company Info */}
          {company && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              </div>
              {company.address && (
                <div className="flex items-start gap-2 text-gray-600 mt-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{company.address}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  <Phone className="h-4 w-4" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  <Globe className="h-4 w-4" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* QR Code */}
          {employee && company && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Kodum</h3>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCode value={getPublicUrl()} size={200} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    QR kodunuzu paylaşarak dijital kartvizitinize erişim sağlayın
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 mb-1">Public URL:</p>
                    <p className="text-sm text-gray-900 break-all">{getPublicUrl()}</p>
                  </div>
                  <Button onClick={handleShare} className="w-full md:w-auto">
                    <Share2 className="h-4 w-4 mr-2" />
                    Paylaş
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

