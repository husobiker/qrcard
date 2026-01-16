import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { getTasks, getTaskStats } from "../../services/taskService";
import { getQuotes, getQuoteStats } from "../../services/quoteService";
import { getCustomerMeetings } from "../../services/communicationService";
import { getCompanyById } from "../../services/companyService";
import { getEmployeePublicUrl } from "../../utils/url";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { Employee, Task, Company } from "../../types";

export default function MarketingStaffDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const employee = user as Employee;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    draftQuotes: 0,
    sentQuotes: 0,
    acceptedQuotes: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalMeetings: 0,
  });

  useEffect(() => {
    if (employee) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load company data
      const companyData = await getCompanyById(employee.company_id);
      if (companyData) {
        setCompany(companyData);
      }

      // Load quote stats
      const quoteStats = await getQuoteStats(employee.company_id, employee.id);
      
      // Load task stats
      const taskStats = await getTaskStats(employee.company_id, employee.id);
      
      // Load meetings (this month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const meetings = await getCustomerMeetings(employee.company_id, employee.id);
      const thisMonthMeetings = meetings.filter((m) => {
        const meetingDate = new Date(m.communication_date);
        return meetingDate >= startOfMonth;
      });

      setStats({
        totalQuotes: quoteStats.total,
        draftQuotes: quoteStats.draft,
        sentQuotes: quoteStats.sent,
        acceptedQuotes: quoteStats.accepted,
        totalTasks: taskStats.total,
        pendingTasks: taskStats.pending,
        inProgressTasks: taskStats.in_progress,
        completedTasks: taskStats.completed,
        totalMeetings: thisMonthMeetings.length,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const StatCard = ({
    title,
    value,
    icon,
    color,
    onPress,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const QuickActionButton = ({
    title,
    icon,
    onPress,
  }: {
    title: string;
    icon: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.quickActionButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={24} color={theme.colors.primary} />
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top", "left", "right"]}
      >
        <StatusBar
          barStyle={theme.isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Pazarlama Personeli Paneli
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {employee?.first_name && employee?.last_name
              ? `${employee.first_name} ${employee.last_name}`
              : employee?.username || "Kullanıcı"}
          </Text>
        </View>

        {/* Quote Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Teklif İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam"
              value={stats.totalQuotes}
              icon="description"
              color="#3B82F6"
            />
            <StatCard
              title="Taslak"
              value={stats.draftQuotes}
              icon="edit"
              color="#6B7280"
            />
            <StatCard
              title="Gönderildi"
              value={stats.sentQuotes}
              icon="send"
              color="#3B82F6"
            />
            <StatCard
              title="Kabul Edildi"
              value={stats.acceptedQuotes}
              icon="check-circle"
              color="#10B981"
            />
          </View>
        </View>

        {/* Task Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Görev İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam"
              value={stats.totalTasks}
              icon="assignment"
              color="#3B82F6"
            />
            <StatCard
              title="Beklemede"
              value={stats.pendingTasks}
              icon="schedule"
              color="#F59E0B"
            />
            <StatCard
              title="Devam Ediyor"
              value={stats.inProgressTasks}
              icon="sync"
              color="#3B82F6"
            />
            <StatCard
              title="Tamamlandı"
              value={stats.completedTasks}
              icon="check-circle"
              color="#10B981"
            />
          </View>
        </View>

        {/* Meeting Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Görüşme İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Bu Ay"
              value={stats.totalMeetings}
              icon="event"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Hızlı İşlemler
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title="Yeni Teklif"
              icon="add-circle"
              onPress={() => navigation.navigate("MarketingStaffQuotes")}
            />
            <QuickActionButton
              title="Müşterilerim"
              icon="people"
              onPress={() => navigation.navigate("MarketingStaffCustomers")}
            />
            <QuickActionButton
              title="Görevlerim"
              icon="check-circle"
              onPress={() => navigation.navigate("MarketingStaffTasks")}
            />
            <QuickActionButton
              title="Görüşmeler"
              icon="event"
              onPress={() => navigation.navigate("MarketingStaffMeetings")}
            />
          </View>
        </View>

        {/* QR Code Section */}
        {employee && company && (
          <View style={styles.section}>
            <View
              style={[
                styles.qrSection,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>QR Kodum</Text>
              <QRCodeGenerator
                url={getPublicUrl()}
                employeeName={`${employee?.first_name || ""} ${employee?.last_name || ""}`}
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
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
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
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
