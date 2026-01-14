import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getEmployeeReports } from "../../services/reportsService";
import { getQuoteStats } from "../../services/quoteService";
import { getTaskStats } from "../../services/taskService";
import { getCommunicationStats } from "../../services/communicationService";
import type { ReportsData } from "../../services/reportsService";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function MarketingStaffReportsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const employee = user as any;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportsData, setReportsData] = useState<Omit<ReportsData, "employee_performance"> | null>(null);
  const [quoteStats, setQuoteStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
  });
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });
  const [meetingStats, setMeetingStats] = useState({
    total: 0,
    meeting: 0,
  });

  useEffect(() => {
    if (employee && employee.company_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      // Load employee reports
      const reports = await getEmployeeReports(employee.id, employee.company_id);
      setReportsData(reports);

      // Load quote stats
      const quotes = await getQuoteStats(employee.company_id, employee.id);
      setQuoteStats(quotes);

      // Load task stats
      const tasks = await getTaskStats(employee.company_id, employee.id);
      setTaskStats(tasks);

      // Load meeting stats
      const meetings = await getCommunicationStats(employee.company_id, employee.id);
      setMeetingStats({
        total: meetings.total,
        meeting: meetings.meeting,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
    </View>
  );

  if (loading && !reportsData) {
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

  const displayReports = reportsData || {
    crm_stats: { total: 0, today_follow_ups: 0, sales_completed: 0, in_follow_up: 0 },
    appointment_stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      thisMonth: 0,
      thisWeek: 0,
    },
    analytics_stats: { total_views: 0, total_clicks: 0, employees_with_views: 0 },
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Kişisel Raporlar
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quote Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Teklif İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam"
              value={quoteStats.total}
              icon="description"
              color="#3B82F6"
            />
            <StatCard
              title="Taslak"
              value={quoteStats.draft}
              icon="edit"
              color="#6B7280"
            />
            <StatCard
              title="Gönderildi"
              value={quoteStats.sent}
              icon="send"
              color="#3B82F6"
            />
            <StatCard
              title="Kabul Edildi"
              value={quoteStats.accepted}
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
              value={taskStats.total}
              icon="assignment"
              color="#3B82F6"
            />
            <StatCard
              title="Beklemede"
              value={taskStats.pending}
              icon="schedule"
              color="#F59E0B"
            />
            <StatCard
              title="Devam Ediyor"
              value={taskStats.in_progress}
              icon="sync"
              color="#3B82F6"
            />
            <StatCard
              title="Tamamlandı"
              value={taskStats.completed}
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
              title="Toplam Görüşme"
              value={meetingStats.meeting}
              icon="event"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* CRM Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            CRM İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Müşteri"
              value={displayReports.crm_stats.total}
              icon="person"
              color="#3B82F6"
            />
            <StatCard
              title="Takip Edilecek"
              value={displayReports.crm_stats.in_follow_up}
              icon="schedule"
              color="#F59E0B"
            />
            <StatCard
              title="Satış Yapılan"
              value={displayReports.crm_stats.sales_completed}
              icon="check-circle"
              color="#10B981"
            />
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
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
});
