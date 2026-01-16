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
import { getEmployeesByRegion } from "../../services/employeeService";
import { getTasks } from "../../services/taskService";
import { getLeads } from "../../services/crmService";
import { getRegionById } from "../../services/regionService";
import { getCompanyById } from "../../services/companyService";
import { getEmployeePublicUrl } from "../../utils/url";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { Employee, Task, CRMLead, Region, Company } from "../../types";
import { FIXED_ROLES } from "../../types";

export default function RegionalManagerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const employee = user as Employee;
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalLeads: 0,
    activeLeads: 0,
  });

  useEffect(() => {
    if (employee && employee.region_id) {
      loadData();
    } else if (employee && !employee.region_id) {
      // Employee has no region assigned
      setLoading(false);
      Alert.alert(
        "Bölge Atanmamış",
        "Size henüz bir bölge atanmamış. Lütfen şirket yöneticisi ile iletişime geçin."
      );
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee) {
      setLoading(false);
      return;
    }

    console.log('RegionalManager Dashboard: Employee data:', {
      id: employee.id,
      region_id: employee.region_id,
      role: employee.role,
    });

    if (!employee.region_id) {
      Alert.alert(
        "Bölge Atanmamış",
        "Size henüz bir bölge atanmamış. Lütfen şirket yöneticisi ile iletişime geçin."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load region info
      console.log('RegionalManager Dashboard: Loading region with ID:', employee.region_id);
      const regionData = await getRegionById(employee.region_id);
      console.log('RegionalManager Dashboard: Region data:', regionData);
      
      if (!regionData) {
        console.error('RegionalManager Dashboard: Region not found for ID:', employee.region_id);
        // Region not found - show error and stop loading
        Alert.alert(
          "Hata",
          "Bölge bilgisi bulunamadı. Lütfen şirket yöneticisi ile iletişime geçin.",
          [{ text: "Tamam" }]
        );
        setRegion(null);
        setEmployees([]);
        setTasks([]);
        setLeads([]);
        setStats({
          totalEmployees: 0,
          totalTasks: 0,
          pendingTasks: 0,
          completedTasks: 0,
          totalLeads: 0,
          activeLeads: 0,
        });
        setLoading(false);
        return;
      }
      
      setRegion(regionData);

      // Load company data
      const companyData = await getCompanyById(employee.company_id);
      if (companyData) {
        setCompany(companyData);
      }

      // Load employees in region
      const employeesData = await getEmployeesByRegion(employee.region_id);
      setEmployees(employeesData);

      // Load tasks in region
      const tasksData = await getTasks(
        employee.company_id,
        undefined,
        employee.region_id
      );
      setTasks(tasksData);

      // Load leads in region
      const leadsData = await getLeads(
        employee.company_id,
        undefined,
        employee.region_id
      );
      setLeads(leadsData);

      // Calculate stats
      const pendingTasks = tasksData.filter((t) => t.status === "pending").length;
      const completedTasks = tasksData.filter((t) => t.status === "completed").length;
      const activeLeads = leadsData.filter(
        (l) => l.status === "new" || l.status === "contacted"
      ).length;

      setStats({
        totalEmployees: employeesData.length,
        totalTasks: tasksData.length,
        pendingTasks,
        completedTasks,
        totalLeads: leadsData.length,
        activeLeads,
      });
    } catch (error) {
      console.error("Error loading data:", error);
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
    value: string | number;
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
      <View style={styles.statCardContent}>
        <View
          style={[
            styles.statIconContainer,
            {
              backgroundColor: color + "15",
              borderColor: color + "30",
            },
          ]}
        >
          <Icon name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.statCardMain}>
          <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {value}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({
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
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Bölge Yönetimi
            </Text>
            {region ? (
              <Text
                style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
              >
                {region.name}
              </Text>
            ) : (
              <Text
                style={[styles.headerSubtitle, { color: theme.colors.error || "#EF4444" }]}
              >
                Bölge bilgisi bulunamadı
              </Text>
            )}
          </View>
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.profileInitials}>
              {employee?.first_name?.charAt(0) || ""}
              {employee?.last_name?.charAt(0) || ""}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Bölge Personeli"
            value={stats.totalEmployees}
            icon="people"
            color={theme.colors.primary}
            onPress={() => navigation.navigate("RegionalEmployees")}
          />
          <View style={styles.twoCardsRow}>
            <StatCard
              title="Toplam Görev"
              value={stats.totalTasks}
              icon="check-circle"
              color={theme.colors.secondary || "#10B981"}
              onPress={() => navigation.navigate("RegionalTasks")}
              style={{ width: "48%" }}
            />
            <StatCard
              title="Bekleyen"
              value={stats.pendingTasks}
              icon="schedule"
              color={theme.colors.warning || "#F59E0B"}
              onPress={() => navigation.navigate("RegionalTasks")}
              style={{ width: "48%" }}
            />
          </View>
          <View style={styles.twoCardsRow}>
            <StatCard
              title="Tamamlanan"
              value={stats.completedTasks}
              icon="done"
              color={theme.colors.success || "#10B981"}
              onPress={() => navigation.navigate("RegionalTasks")}
              style={{ width: "48%" }}
            />
            <StatCard
              title="Müşteri Kayıtları"
              value={stats.totalLeads}
              icon="person-add"
              color={theme.colors.info || "#3B82F6"}
              onPress={() => navigation.navigate("RegionalCRM")}
              style={{ width: "48%" }}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickAccessSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text }]}
          >
            Hızlı Erişim
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Personeller"
              icon="people"
              onPress={() => navigation.navigate("RegionalEmployees")}
            />
            <QuickAction
              title="Görevler"
              icon="check-circle"
              onPress={() => navigation.navigate("RegionalTasks")}
            />
            <QuickAction
              title="Görevlerim"
              icon="assignment"
              onPress={() => navigation.navigate("RegionalManagerMyTasks")}
            />
            <QuickAction
              title="Müşteri Kayıtları"
              icon="person-add"
              onPress={() => navigation.navigate("RegionalCRM")}
            />
            <QuickAction
              title="Raporlar"
              icon="bar-chart"
              onPress={() => navigation.navigate("RegionalReports")}
            />
            <QuickAction
              title="Personel Analizi"
              icon="analytics"
              onPress={() => navigation.navigate("RegionalManagerEmployeeReports")}
            />
            <QuickAction
              title="Teklifler"
              icon="description"
              onPress={() => navigation.navigate("RegionalQuotes")}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  statsContainer: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  twoCardsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statCardMain: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  quickAccessSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
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
