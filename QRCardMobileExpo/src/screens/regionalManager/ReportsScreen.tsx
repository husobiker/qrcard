import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
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

interface TotalStats {
  tasks: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
  sales: {
    total_amount: number;
    accepted_quotes: number;
    sold_customers: number;
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
  employees_count: number;
}

export default function RegionalReportsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Load performance data for all employees and aggregate
      const performancePromises = employeesData.map(async (emp) => {
        const [taskStats, quotes, leads] = await Promise.all([
          getTaskStats(employee.company_id, emp.id),
          getQuotes(employee.company_id, emp.id),
          getLeads(employee.company_id, emp.id),
        ]);

        // Calculate sales from accepted quotes
        const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
        const totalSalesAmount = acceptedQuotes.reduce(
          (sum, q) => sum + (q.total_amount || 0),
          0
        );

        // Count sold customers
        const soldCustomers = leads.filter((l) => l.status === "Satış Yapıldı").length;

        return {
          tasks: {
            total: taskStats.total,
            completed: taskStats.completed,
            pending: taskStats.pending,
            in_progress: taskStats.in_progress,
          },
          sales: {
            total_amount: totalSalesAmount,
            accepted_quotes: acceptedQuotes.length,
            sold_customers: soldCustomers,
          },
          quotes: {
            total: quotes.length,
            sent: quotes.filter((q) => q.status === "sent").length,
            accepted: acceptedQuotes.length,
            rejected: quotes.filter((q) => q.status === "rejected").length,
          },
          customers: {
            total: leads.length,
            new: leads.filter((l) => l.status === "Yeni").length,
            in_follow_up: leads.filter((l) => l.status === "Takipte").length,
            sold: soldCustomers,
          },
        };
      });

      const performanceData = await Promise.all(performancePromises);

      // Aggregate all stats
      const aggregated: TotalStats = {
        tasks: {
          total: performanceData.reduce((sum, p) => sum + p.tasks.total, 0),
          completed: performanceData.reduce((sum, p) => sum + p.tasks.completed, 0),
          pending: performanceData.reduce((sum, p) => sum + p.tasks.pending, 0),
          in_progress: performanceData.reduce((sum, p) => sum + p.tasks.in_progress, 0),
        },
        sales: {
          total_amount: performanceData.reduce((sum, p) => sum + p.sales.total_amount, 0),
          accepted_quotes: performanceData.reduce((sum, p) => sum + p.sales.accepted_quotes, 0),
          sold_customers: performanceData.reduce((sum, p) => sum + p.sales.sold_customers, 0),
        },
        quotes: {
          total: performanceData.reduce((sum, p) => sum + p.quotes.total, 0),
          sent: performanceData.reduce((sum, p) => sum + p.quotes.sent, 0),
          accepted: performanceData.reduce((sum, p) => sum + p.quotes.accepted, 0),
          rejected: performanceData.reduce((sum, p) => sum + p.quotes.rejected, 0),
        },
        customers: {
          total: performanceData.reduce((sum, p) => sum + p.customers.total, 0),
          new: performanceData.reduce((sum, p) => sum + p.customers.new, 0),
          in_follow_up: performanceData.reduce((sum, p) => sum + p.customers.in_follow_up, 0),
          sold: performanceData.reduce((sum, p) => sum + p.customers.sold, 0),
        },
        employees_count: employeesData.length,
      };

      setTotalStats(aggregated);
    } catch (error) {
      console.error("Error loading total stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        {/* Header */}
        <View 
          style={[
            styles.header, 
            { 
              borderBottomColor: theme.colors.gray200,
            }
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Personel Performans Raporları
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {!totalStats && !loading ? (
          <View style={styles.emptyContainer}>
            <Icon name="bar-chart" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Henüz veri bulunmuyor
            </Text>
          </View>
        ) : totalStats ? (
          <>
            {/* Tasks Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: (theme.colors.primary || "#3B82F6") + "15" }]}>
                  <Icon name="assignment" size={24} color={theme.colors.primary || "#3B82F6"} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Görevler
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.tasks.completed}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Tamamlanan
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.warning || "#F59E0B" }]}>
                    {totalStats.tasks.in_progress}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Devam Eden
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {totalStats.tasks.pending}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Beklemede
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.primary || "#3B82F6" }]}>
                    {totalStats.tasks.total}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Toplam
                  </Text>
                </View>
              </View>
            </View>

            {/* Sales Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: (theme.colors.success || "#10B981") + "15" }]}>
                  <Icon name="attach-money" size={24} color={theme.colors.success || "#10B981"} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Satışlar
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statItemLarge, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValueLarge, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.sales.total_amount.toFixed(2)} ₺
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Toplam Satış
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.sales.accepted_quotes}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Kabul Edilen Teklif
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.sales.sold_customers}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Satış Yapılan Müşteri
                  </Text>
                </View>
              </View>
            </View>

            {/* Quotes Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: (theme.colors.info || "#3B82F6") + "15" }]}>
                  <Icon name="description" size={24} color={theme.colors.info || "#3B82F6"} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Teklifler
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {totalStats.quotes.total}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Toplam
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.quotes.accepted}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Kabul Edilen
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.info || "#3B82F6" }]}>
                    {totalStats.quotes.sent}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Gönderilen
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.error || "#EF4444" }]}>
                    {totalStats.quotes.rejected}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Reddedilen
                  </Text>
                </View>
              </View>
            </View>

            {/* Customers Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: (theme.colors.warning || "#F59E0B") + "15" }]}>
                  <Icon name="people" size={24} color={theme.colors.warning || "#F59E0B"} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Müşteriler
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {totalStats.customers.total}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Toplam
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.success || "#10B981" }]}>
                    {totalStats.customers.sold}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Satış Yapılan
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.warning || "#F59E0B" }]}>
                    {totalStats.customers.in_follow_up}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Takipte
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {totalStats.customers.new}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Yeni
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.summaryHeader}>
                <Icon name="info" size={20} color={theme.colors.primary || "#3B82F6"} />
                <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
                  Toplam {totalStats.employees_count} personel için istatistikler gösterilmektedir.
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  statItemLarge: {
    width: "100%",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  statValueLarge: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
