import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCompanyReports, getEmployeeReports } from "../../services/reportsService";
import type { ReportsData } from "../../services/reportsService";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface Report {
  id: string;
  title: string;
  titleEn: string;
  type: "sales" | "performance" | "commission";
}

export default function ReportsScreen() {
  const { user, userType } = useAuth();
  const { theme, isDark } = useTheme();
  const [reports] = useState<Report[]>([
    { id: "1", title: "Satış Raporu", titleEn: "Sales", type: "sales" },
    { id: "2", title: "Performans Raporu", titleEn: "Performance", type: "performance" },
    { id: "3", title: "Komisyon Raporu", titleEn: "Commission", type: "commission" },
  ]);
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadReportsData();
  }, [user]);

  const loadReportsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (userType === "company") {
        // For company users, user.id is the company_id
        const data = await getCompanyReports(user.id);
        setReportsData(data);
      } else {
        // For employee users, get company_id from user object
        const companyId = (user as any).company_id;
        if (companyId) {
          const data = await getEmployeeReports(user.id, companyId);
          setReportsData(data as ReportsData);
        }
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      // Set empty data on error
      setReportsData({
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
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportPress = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[
        styles.reportCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
      ]}
      onPress={() => handleReportPress(item)}
    >
      <View style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: theme.colors.primary }]}>
          <Icon name="bar-chart" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.reportInfo}>
          <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.reportType, { color: theme.colors.textSecondary }]}>
            {item.titleEn}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.gray400} />
      </View>
    </TouchableOpacity>
  );

  const renderReportDetails = () => {
    if (!selectedReport || !reportsData) return null;

    switch (selectedReport.type) {
      case "sales":
        return (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
              Satış İstatistikleri
            </Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Toplam Lead
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.crm_stats.total}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Satış Yapılan
                </Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  {reportsData.crm_stats.sales_completed}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Takipte
                </Text>
                <Text style={[styles.statValue, { color: "#8B5CF6" }]}>
                  {reportsData.crm_stats.in_follow_up}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Bugün Görüşülecek
                </Text>
                <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                  {reportsData.crm_stats.today_follow_ups}
                </Text>
              </View>
            </View>
            {reportsData.transaction_stats && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Gelir/Gider Özeti
                </Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Toplam Gelir
                    </Text>
                    <Text style={[styles.statValue, { color: "#10B981" }]}>
                      ₺{reportsData.transaction_stats.total_income.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Toplam Gider
                    </Text>
                    <Text style={[styles.statValue, { color: "#EF4444" }]}>
                      ₺{reportsData.transaction_stats.total_expense.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Net Tutar
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color:
                            reportsData.transaction_stats.net_amount >= 0
                              ? "#10B981"
                              : "#EF4444",
                        },
                      ]}
                    >
                      ₺{reportsData.transaction_stats.net_amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        );

      case "performance":
        return (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
              Performans İstatistikleri
            </Text>

            {/* Randevu İstatistikleri */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Randevu İstatistikleri
            </Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Toplam
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.appointment_stats.total}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Onaylanan
                </Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  {reportsData.appointment_stats.confirmed}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Beklemede
                </Text>
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                  {reportsData.appointment_stats.pending}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Tamamlanan
                </Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  {reportsData.appointment_stats.completed}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  İptal Edilen
                </Text>
                <Text style={[styles.statValue, { color: "#EF4444" }]}>
                  {reportsData.appointment_stats.cancelled}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Bu Ay
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.appointment_stats.thisMonth}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Bu Hafta
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.appointment_stats.thisWeek}
                </Text>
              </View>
            </View>

            {/* Analitik İstatistikleri */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Analitik İstatistikleri
            </Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Toplam Görüntülenme
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.analytics_stats.total_views}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Toplam Tıklama
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.analytics_stats.total_clicks}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Görüntülenen Personel
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportsData.analytics_stats.employees_with_views}
                </Text>
              </View>
            </View>

            {/* Görev İstatistikleri */}
            {reportsData.task_stats && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Görev İstatistikleri
                </Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Toplam
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.task_stats.total}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Beklemede
                    </Text>
                    <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                      {reportsData.task_stats.pending}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Devam Ediyor
                    </Text>
                    <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                      {reportsData.task_stats.in_progress}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Tamamlanan
                    </Text>
                    <Text style={[styles.statValue, { color: "#10B981" }]}>
                      {reportsData.task_stats.completed}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Gecikmiş
                    </Text>
                    <Text style={[styles.statValue, { color: "#EF4444" }]}>
                      {reportsData.task_stats.overdue}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* İletişim İstatistikleri */}
            {reportsData.communication_stats && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  İletişim İstatistikleri
                </Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Toplam
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.communication_stats.total}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      E-posta
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.communication_stats.email}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Telefon
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.communication_stats.phone}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Toplantı
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.communication_stats.meeting}
                    </Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      SMS
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {reportsData.communication_stats.sms}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Çalışan Performansı */}
            {reportsData.employee_performance &&
              reportsData.employee_performance.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Çalışan Performansı
                  </Text>
                  <Text
                    style={[
                      styles.sectionDescription,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Çalışanların randevu, lead ve görüntülenme istatistikleri
                  </Text>
                  <View
                    style={[
                      styles.employeeTable,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
                    ]}
                  >
                    {/* Table Header */}
                    <View
                      style={[
                        styles.employeeTableRow,
                        styles.employeeTableHeader,
                        { borderBottomColor: theme.colors.gray200 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.employeeTableHeaderText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Çalışan
                      </Text>
                      <Text
                        style={[
                          styles.employeeTableHeaderText,
                          styles.employeeTableNumber,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Randevu
                      </Text>
                      <Text
                        style={[
                          styles.employeeTableHeaderText,
                          styles.employeeTableNumber,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Lead
                      </Text>
                      <Text
                        style={[
                          styles.employeeTableHeaderText,
                          styles.employeeTableNumber,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Görüntülenme
                      </Text>
                      <Text
                        style={[
                          styles.employeeTableHeaderText,
                          styles.employeeTableNumber,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Tıklama
                      </Text>
                    </View>
                    {/* Table Rows */}
                    {reportsData.employee_performance.map((emp) => (
                      <View
                        key={emp.employee_id}
                        style={[
                          styles.employeeTableRow,
                          { borderBottomColor: theme.colors.gray200 },
                        ]}
                      >
                        <Text
                          style={[styles.employeeTableName, { color: theme.colors.text }]}
                          numberOfLines={1}
                        >
                          {emp.employee_name}
                        </Text>
                        <Text
                          style={[
                            styles.employeeTableValue,
                            styles.employeeTableNumber,
                            { color: theme.colors.text },
                          ]}
                        >
                          {emp.appointments_count}
                        </Text>
                        <Text
                          style={[
                            styles.employeeTableValue,
                            styles.employeeTableNumber,
                            { color: theme.colors.text },
                          ]}
                        >
                          {emp.crm_leads_count}
                        </Text>
                        <Text
                          style={[
                            styles.employeeTableValue,
                            styles.employeeTableNumber,
                            { color: theme.colors.text },
                          ]}
                        >
                          {emp.views_count}
                        </Text>
                        <Text
                          style={[
                            styles.employeeTableValue,
                            styles.employeeTableNumber,
                            { color: theme.colors.text },
                          ]}
                        >
                          {emp.clicks_count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
          </View>
        );

      case "commission":
        return (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
              Komisyon İstatistikleri
            </Text>
            {reportsData.commission_stats ? (
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Toplam Komisyon
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    ₺{reportsData.commission_stats.total_commission.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Ödenen
                  </Text>
                  <Text style={[styles.statValue, { color: "#10B981" }]}>
                    ₺{reportsData.commission_stats.paid_commission.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Bekleyen
                  </Text>
                  <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                    ₺{reportsData.commission_stats.pending_commission.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Ödeme Sayısı
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {reportsData.commission_stats.payment_count}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Komisyon verisi bulunamadı
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Raporlar</Text>
      </View>
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadReportsData}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Report Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
          edges={["bottom", "left", "right"]}
        >
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.gray200 }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedReport?.title}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.text }}>Yükleniyor...</Text>
              </View>
            ) : (
              renderReportDetails()
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 70,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  reportType: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 70,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailsContainer: {
    gap: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    padding: 32,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  employeeTable: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
  },
  employeeTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  employeeTableHeader: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
  },
  employeeTableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  employeeTableName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 2,
  },
  employeeTableValue: {
    fontSize: 13,
    flex: 1,
  },
  employeeTableNumber: {
    textAlign: "right",
  },
});
