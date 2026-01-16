import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { getLeads } from "../../services/crmService";
import { getCallLogs, getCallLogStats } from "../../services/callLogService";
import type { Employee } from "../../types";

export default function CallCenterPerformanceScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const employee = user as Employee;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayCustomers: 0,
    weekCustomers: 0,
    monthCustomers: 0,
    newCustomersToday: 0,
    newCustomersWeek: 0,
    newCustomersMonth: 0,
    totalCalls: 0,
    todayCalls: 0,
    weekCalls: 0,
    monthCalls: 0,
    totalCallDuration: 0,
    averageCallDuration: 0,
    successfulCalls: 0,
    failedCalls: 0,
  });

  useEffect(() => {
    if (employee?.company_id) {
      loadStats();
    }
  }, [employee]);

  const loadStats = async () => {
    if (!employee?.company_id) return;

    setLoading(true);
    try {
      // Load all customers
      const customers = await getLeads(employee.company_id);
      
      // Load call logs
      const callLogs = await getCallLogs(employee.company_id, employee.id);
      const callStats = await getCallLogStats(employee.company_id, employee.id);

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Filter customers by date
      const todayCustomers = customers.filter(
        (c) => new Date(c.created_at) >= today
      );
      const weekCustomers = customers.filter(
        (c) => new Date(c.created_at) >= weekAgo
      );
      const monthCustomers = customers.filter(
        (c) => new Date(c.created_at) >= monthAgo
      );

      // Filter new customers (status = "Yeni")
      const newCustomersToday = todayCustomers.filter((c) => c.status === "Yeni");
      const newCustomersWeek = weekCustomers.filter((c) => c.status === "Yeni");
      const newCustomersMonth = monthCustomers.filter((c) => c.status === "Yeni");

      // Filter call logs by date
      const todayCalls = callLogs.filter(
        (c) => new Date(c.call_start_time) >= today
      );
      const weekCalls = callLogs.filter(
        (c) => new Date(c.call_start_time) >= weekAgo
      );
      const monthCalls = callLogs.filter(
        (c) => new Date(c.call_start_time) >= monthAgo
      );

      // Calculate successful vs failed calls
      const successfulCalls = callLogs.filter(
        (c) => c.call_status === "completed"
      ).length;
      const failedCalls = callLogs.filter(
        (c) => c.call_status === "failed" || c.call_status === "missed"
      ).length;

      setStats({
        totalCustomers: customers.length,
        todayCustomers: todayCustomers.length,
        weekCustomers: weekCustomers.length,
        monthCustomers: monthCustomers.length,
        newCustomersToday: newCustomersToday.length,
        newCustomersWeek: newCustomersWeek.length,
        newCustomersMonth: newCustomersMonth.length,
        totalCalls: callLogs.length,
        todayCalls: todayCalls.length,
        weekCalls: weekCalls.length,
        monthCalls: monthCalls.length,
        totalCallDuration: callStats.total_duration,
        averageCallDuration: callStats.average_duration,
        successfulCalls,
        failedCalls,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} sn`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes} dk ${remainingSeconds} sn`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} sa ${remainingMinutes} dk`;
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
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
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {value}
        </Text>
        <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
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
            Performans İstatistikleri
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Çağrı merkezi performans raporları
          </Text>
        </View>

        {/* Customer Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Müşteri İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Müşteri"
              value={stats.totalCustomers}
              icon="people"
              color="#3B82F6"
            />
            <StatCard
              title="Bugün Eklenen"
              value={stats.todayCustomers}
              icon="person-add"
              color="#10B981"
              subtitle={`Yeni: ${stats.newCustomersToday}`}
            />
            <StatCard
              title="Bu Hafta"
              value={stats.weekCustomers}
              icon="calendar-today"
              color="#F59E0B"
              subtitle={`Yeni: ${stats.newCustomersWeek}`}
            />
            <StatCard
              title="Bu Ay"
              value={stats.monthCustomers}
              icon="event"
              color="#8B5CF6"
              subtitle={`Yeni: ${stats.newCustomersMonth}`}
            />
          </View>
        </View>

        {/* Call Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Arama İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Arama"
              value={stats.totalCalls}
              icon="phone"
              color="#EF4444"
            />
            <StatCard
              title="Bugün"
              value={stats.todayCalls}
              icon="phone-in-talk"
              color="#06B6D4"
            />
            <StatCard
              title="Bu Hafta"
              value={stats.weekCalls}
              icon="call"
              color="#14B8A6"
            />
            <StatCard
              title="Bu Ay"
              value={stats.monthCalls}
              icon="phone-enabled"
              color="#6366F1"
            />
          </View>
        </View>

        {/* Call Duration Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Konuşma Süresi İstatistikleri
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Konuşma"
              value={formatDuration(stats.totalCallDuration)}
              icon="timer"
              color="#F97316"
            />
            <StatCard
              title="Ortalama Süre"
              value={formatDuration(stats.averageCallDuration)}
              icon="schedule"
              color="#EC4899"
            />
            <StatCard
              title="Başarılı"
              value={stats.successfulCalls}
              icon="check-circle"
              color="#10B981"
            />
            <StatCard
              title="Başarısız"
              value={stats.failedCalls}
              icon="cancel"
              color="#EF4444"
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
    flex: 1,
    minWidth: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
