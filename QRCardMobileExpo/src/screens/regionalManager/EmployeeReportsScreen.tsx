import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getEmployeesByRegion } from "../../services/employeeService";
import { getTaskStats } from "../../services/taskService";
import { getQuotes } from "../../services/quoteService";
import { getLeads } from "../../services/crmService";
import type { Employee } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface EmployeeStats {
  employee: Employee;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
  quotes: {
    total: number;
    sent: number;
    accepted: number;
    rejected: number;
  };
  customers: {
    total: number;
    new: number;
    in_follow_up: number;
    sold: number;
  };
}

export default function RegionalManagerEmployeeReportsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (employee && employee.region_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.region_id) return;

    setLoading(true);
    try {
      // Load all employees in the region
      const employeesData = await getEmployeesByRegion(employee.region_id);
      setEmployees(employeesData);

      // Load stats for each employee
      const statsPromises = employeesData.map(async (emp) => {
        const [taskStats, quotes, leads] = await Promise.all([
          getTaskStats(employee.company_id, emp.id),
          getQuotes(employee.company_id, emp.id),
          getLeads(employee.company_id, emp.id),
        ]);

        return {
          employee: emp,
          tasks: {
            total: taskStats.total,
            completed: taskStats.completed,
            pending: taskStats.pending,
            in_progress: taskStats.in_progress,
          },
          quotes: {
            total: quotes.length,
            sent: quotes.filter((q) => q.status === "sent").length,
            accepted: quotes.filter((q) => q.status === "accepted").length,
            rejected: quotes.filter((q) => q.status === "rejected").length,
          },
          customers: {
            total: leads.length,
            new: leads.filter((l) => l.status === "Yeni").length,
            in_follow_up: leads.filter((l) => l.status === "Takipte").length,
            sold: leads.filter((l) => l.status === "Satış Yapıldı").length,
          },
        };
      });

      const stats = await Promise.all(statsPromises);
      setEmployeeStats(stats);
    } catch (error) {
      console.error("Error loading employee reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployeeStats = employeeStats.filter((stat) => {
    const fullName = `${stat.employee.first_name} ${stat.employee.last_name}`.toLowerCase();
    const jobTitle = stat.employee.job_title?.toLowerCase() || "";
    const department = stat.employee.department?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || jobTitle.includes(query) || department.includes(query);
  });

  const renderEmployeeCard = ({ item }: { item: EmployeeStats }) => (
    <TouchableOpacity
      style={[styles.employeeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
      onPress={() => setSelectedEmployee(item)}
    >
      <View style={styles.employeeCardHeader}>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: theme.colors.text }]}>
            {item.employee.first_name} {item.employee.last_name}
          </Text>
          {item.employee.job_title && (
            <Text style={[styles.employeeTitle, { color: theme.colors.textSecondary }]}>
              {item.employee.job_title}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.gray500} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={20} color={theme.colors.success || "#10B981"} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {item.tasks.completed}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Görev</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="description" size={20} color={theme.colors.info || "#3B82F6"} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {item.quotes.sent}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Teklif</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="check" size={20} color={theme.colors.success || "#10B981"} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {item.quotes.accepted}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Anlaşma</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="people" size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {item.customers.total}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Müşteri</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedEmployee) return null;

    return (
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.gray200 }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Personel Detayı</Text>
            <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {selectedEmployee.employee.first_name} {selectedEmployee.employee.last_name}
              </Text>
              {selectedEmployee.employee.job_title && (
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  {selectedEmployee.employee.job_title}
                </Text>
              )}
            </View>

            {/* Tasks Section */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Görevler</Text>
              <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Toplam Görev:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.tasks.total}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Tamamlanan:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success || "#10B981" }]}>
                    {selectedEmployee.tasks.completed}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Beklemede:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.tasks.pending}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Devam Eden:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.tasks.in_progress}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quotes Section */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Teklifler</Text>
              <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Toplam Teklif:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.quotes.total}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Gönderilen:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.info || "#3B82F6" }]}>
                    {selectedEmployee.quotes.sent}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Kabul Edilen:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success || "#10B981" }]}>
                    {selectedEmployee.quotes.accepted}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Reddedilen:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.error || "#EF4444" }]}>
                    {selectedEmployee.quotes.rejected}
                  </Text>
                </View>
              </View>
            </View>

            {/* Customers Section */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Müşteriler</Text>
              <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Toplam Müşteri:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.customers.total}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Yeni:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {selectedEmployee.customers.new}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Takipte:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.warning || "#F59E0B" }]}>
                    {selectedEmployee.customers.in_follow_up}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Satış Yapılan:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success || "#10B981" }]}>
                    {selectedEmployee.customers.sold}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["left", "right", "top"]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.gray200,
            paddingTop: 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Personel Analizi</Text>
        <View style={styles.backButton} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <Icon name="search" size={20} color={theme.colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
          placeholder="Personel ara..."
          placeholderTextColor={theme.colors.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredEmployeeStats}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.employee.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {loading
                ? "Yükleniyor..."
                : searchQuery
                ? "Personel bulunamadı"
                : "Henüz personel yok"}
            </Text>
          </View>
        }
      />

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  employeeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeeTitle: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});
