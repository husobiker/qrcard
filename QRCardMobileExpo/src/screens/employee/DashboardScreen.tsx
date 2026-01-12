import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { getEmployeeById } from "../../services/employeeService";
import { getCompanyById } from "../../services/companyService";
import { getEmployeeReports } from "../../services/reportsService";
import { getTaskStats } from "../../services/taskService";
import { getTransactionStats } from "../../services/transactionService";
import { getCommunicationStats } from "../../services/communicationService";
import { getCommissionStats } from "../../services/commissionService";
import { getEmployeePublicUrl } from "../../utils/url";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { Employee, Company } from "../../types";

export default function EmployeeDashboardScreen({ navigation }: any) {
  const { user, userType } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
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
    if (user && userType === "employee") {
      loadData();
    }
  }, [user, userType]);

  const loadData = async () => {
    if (!user || userType !== "employee") return;

    setLoading(true);
    try {
      const employeeData = await getEmployeeById(user.id);
      if (employeeData) {
        setEmployee(employeeData);

        // Load company data
        const companyData = await getCompanyById(employeeData.company_id);
        if (companyData) {
          setCompany(companyData);
        }

        // Load all statistics
        const [
          reportsData,
          taskStatsData,
          transactionStatsData,
          communicationStatsData,
          commissionStatsData,
        ] = await Promise.all([
          getEmployeeReports(employeeData.id, employeeData.company_id),
          getTaskStats(undefined, employeeData.id),
          getTransactionStats(undefined, employeeData.id),
          getCommunicationStats(undefined, employeeData.id),
          getCommissionStats(undefined, employeeData.id),
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
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getPublicUrl = () => {
    if (!employee || !company) return "";
    return getEmployeePublicUrl(company.id, employee.id);
  };

  const handleShare = async () => {
    const url = getPublicUrl();
    try {
      await Share.share({
        message: `${employee?.first_name} ${employee?.last_name} - ${company?.name}\n${url}`,
        url: url,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["bottom", "left", "right"]}
      >
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee || !company) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["bottom", "left", "right"]}
      >
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.error }}>Çalışan bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Anasayfa</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Genel bakış ve özet istatistikler
            </Text>
          </View>

          {/* Profile Card */}
          <View
            style={[
              styles.profileCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
            ]}
          >
            <View style={styles.profileHeader}>
              {employee.profile_image_url ? (
                <Image
                  source={{ uri: employee.profile_image_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.gray200 }]}>
                  <Text style={[styles.profileInitials, { color: theme.colors.textSecondary }]}>
                    {employee.first_name.charAt(0)}
                    {employee.last_name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {employee.first_name} {employee.last_name}
                </Text>
                {employee.job_title && (
                  <Text style={[styles.profileJob, { color: theme.colors.textSecondary }]}>
                    {employee.job_title}
                  </Text>
                )}
                {employee.department && (
                  <Text style={[styles.profileDepartment, { color: theme.colors.textSecondary }]}>
                    {employee.department}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
                <Icon name="trending-up" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.crm.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Toplam Lead</Text>
              <Text style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>
                {stats.crm.sales_completed} satış yapıldı
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#10B98120" }]}>
                <Icon name="event" size={24} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.appointments.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Randevular</Text>
              <Text style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>
                {stats.appointments.pending} beklemede
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#8B5CF620" }]}>
                <Icon name="check-circle" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.tasks.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Görevler</Text>
              <Text style={[styles.statSubtext, { color: stats.tasks.overdue > 0 ? theme.colors.error : theme.colors.textSecondary }]}>
                {stats.tasks.overdue > 0 ? `${stats.tasks.overdue} gecikmiş` : `${stats.tasks.pending} beklemede`}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#F59E0B20" }]}>
                <Icon name="percent" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.commissions.total_commission.toLocaleString()} ₺
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Komisyon</Text>
              <Text style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>
                {stats.commissions.pending_commission.toLocaleString()} ₺ bekliyor
              </Text>
            </View>
          </View>

          {/* Quick Access Cards */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hızlı Erişim</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeDashboardTab", { screen: "CRM" })}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#3B82F620" }]}>
                <Icon name="trending-up" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>Satış Takibi</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                {stats.crm.total} lead • {stats.crm.today_follow_ups} bugün görüşülecek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeCalendar")}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#10B98120" }]}>
                <Icon name="event" size={24} color="#10B981" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>Takvim</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                {stats.appointments.total} randevu • {stats.appointments.thisWeek} bu hafta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeTasks")}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#8B5CF620" }]}>
                <Icon name="check-circle" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>Görevlerim</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                {stats.tasks.total} görev • {stats.tasks.in_progress} devam ediyor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeDashboardTab", { screen: "Goals" })}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#F59E0B20" }]}>
                <Icon name="flag" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>Hedeflerim</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                Performans hedeflerini görüntüle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeDashboardTab", { screen: "Transactions" })}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#10B98120" }]}>
                <Icon name="attach-money" size={24} color="#10B981" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>İşlemlerim</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                Net: {stats.transactions.net_amount >= 0 ? "+" : ""}
                {stats.transactions.net_amount.toLocaleString()} ₺
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
              onPress={() => navigation.navigate("EmployeeDashboardTab", { screen: "Communications" })}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: "#6366F120" }]}>
                <Icon name="message" size={24} color="#6366F1" />
              </View>
              <Text style={[styles.quickAccessTitle, { color: theme.colors.text }]}>İletişimlerim</Text>
              <Text style={[styles.quickAccessSubtext, { color: theme.colors.textSecondary }]}>
                {stats.communications.total} iletişim kaydı
              </Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Section */}
          <View
            style={[
              styles.qrSection,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>QR Kodum</Text>
            <QRCodeGenerator
              url={getPublicUrl()}
              employeeName={`${employee.first_name} ${employee.last_name}`}
              employeeId={employee.id}
            />
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.colors.primaryDark }]}
              onPress={handleShare}
            >
              <Icon name="share" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 70,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileJob: {
    fontSize: 16,
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  quickAccessSubtext: {
    fontSize: 11,
  },
  qrSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
