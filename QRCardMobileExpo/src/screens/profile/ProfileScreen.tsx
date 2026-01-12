import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCompanyByUserId, updateCompany, getCompanyById } from "../../services/companyService";
import { getCompanyReports, getEmployeeReports } from "../../services/reportsService";
import { getEmployeeById } from "../../services/employeeService";
import type { Company, Employee } from "../../types";
import type { ReportsData } from "../../services/reportsService";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

export default function ProfileScreen({ navigation }: any) {
  const { user, userType, signOut } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [reports] = useState([
    { id: "1", title: "Satış Raporu", titleEn: "Sales", type: "sales" },
    { id: "2", title: "Performans Raporu", titleEn: "Performance", type: "performance" },
    { id: "3", title: "Komisyon Raporu", titleEn: "Commission", type: "commission" },
  ]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [selectedReport, setSelectedReport] = useState<{
    id: string;
    title: string;
    titleEn: string;
    type: "sales" | "performance" | "commission";
  } | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    tax_number: "",
    tax_office: "",
    api_endpoint: "",
    santral_id: "",
    api_key: "",
    api_secret: "",
  });

  useEffect(() => {
    if (user) {
      if (userType === "company") {
        loadCompany();
      } else if (userType === "employee") {
        loadEmployee();
      }
      loadReportsData();
    }
  }, [user]);

  const loadCompany = async () => {
    if (!user || userType !== "company") return;

    try {
      const companyData = await getCompanyByUserId(user.id);
      if (companyData) {
        setCompany(companyData);
        setFormData({
          name: companyData.name || "",
          address: companyData.address || "",
          phone: companyData.phone || "",
          website: companyData.website || "",
          tax_number: companyData.tax_number || "",
          tax_office: companyData.tax_office || "",
          api_endpoint: companyData.api_endpoint || "",
          santral_id: companyData.santral_id || "",
          api_key: companyData.api_key || "",
          api_secret: companyData.api_secret || "",
        });
      }
    } catch (error) {
      console.error("Error loading company:", error);
    }
  };

  const loadEmployee = async () => {
    if (!user || userType !== "employee") return;

    try {
      const employeeData = await getEmployeeById(user.id);
      if (employeeData) {
        setEmployee(employeeData);
        // Load company data for employee
        const companyData = await getCompanyById(employeeData.company_id);
        if (companyData) {
          setCompany(companyData);
        }
      }
    } catch (error) {
      console.error("Error loading employee:", error);
    }
  };

  const loadReportsData = async () => {
    if (!user) return;

    setLoadingReports(true);
    try {
      if (userType === "company") {
        const data = await getCompanyReports(user.id);
        setReportsData(data);
      } else {
        const companyId = (user as any).company_id;
        if (companyId) {
          const data = await getEmployeeReports(user.id, companyId);
          setReportsData(data as ReportsData);
        }
      }
    } catch (error) {
      console.error("Error loading reports:", error);
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
      setLoadingReports(false);
    }
  };

  const handleReportPress = (report: {
    id: string;
    title: string;
    titleEn: string;
    type: "sales" | "performance" | "commission";
  }) => {
    setSelectedReport(report);
    setReportModalVisible(true);
  };

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

  const handleSaveCompany = async () => {
    if (!user || userType !== "company" || !company) return;

    setSaving(true);
    try {
      const updated = await updateCompany(company.id, formData);
      if (updated) {
        setCompany(updated);
        Alert.alert("Başarılı", "Profil bilgileri güncellendi");
        setShowEditForm(false);
      } else {
        Alert.alert("Hata", "Profil bilgileri güncellenemedi");
      }
    } catch (error) {
      console.error("Error saving company:", error);
      Alert.alert("Hata", "Profil bilgileri güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCompany}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Profil
            </Text>
            {userType === "company" && (
              <TouchableOpacity
                style={[
                  styles.editButton,
                  { backgroundColor: theme.colors.primaryDark },
                ]}
                onPress={() => setShowEditForm(!showEditForm)}
              >
                <Icon
                  name={showEditForm ? "close" : "edit"}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.editButtonText}>
                  {showEditForm ? "İptal" : "Profilimi Düzenle"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Info - Company */}
          {userType === "company" && company && (
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              {!showEditForm ? (
                <>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Şirket Adı
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.name || "-"}
                    </Text>
                  </View>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Telefon
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.phone || "-"}
                    </Text>
                  </View>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Adres
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.address || "-"}
                    </Text>
                  </View>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Website
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.website || "-"}
                    </Text>
                  </View>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Vergi Numarası
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.tax_number || "-"}
                    </Text>
                  </View>
                  <View style={styles.profileItem}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Vergi Dairesi
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {company.tax_office || "-"}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Şirket Adı *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, name: text })
                      }
                      placeholder="Şirket Adı"
                      placeholderTextColor={theme.colors.gray500}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Telefon
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData({ ...formData, phone: text })
                      }
                      placeholder="Telefon"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Adres
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.address}
                      onChangeText={(text) =>
                        setFormData({ ...formData, address: text })
                      }
                      placeholder="Adres"
                      placeholderTextColor={theme.colors.gray500}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Website
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.website}
                      onChangeText={(text) =>
                        setFormData({ ...formData, website: text })
                      }
                      placeholder="https://example.com"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="url"
                    />
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, marginTop: 16 },
                    ]}
                  >
                    Vergi Bilgileri
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Vergi Numarası
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.tax_number}
                      onChangeText={(text) =>
                        setFormData({ ...formData, tax_number: text })
                      }
                      placeholder="Vergi Numarası"
                      placeholderTextColor={theme.colors.gray500}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Vergi Dairesi
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.tax_office}
                      onChangeText={(text) =>
                        setFormData({ ...formData, tax_office: text })
                      }
                      placeholder="Vergi Dairesi"
                      placeholderTextColor={theme.colors.gray500}
                    />
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text, marginTop: 16 },
                    ]}
                  >
                    Sanal Santral API Ayarları
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      API Endpoint
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.api_endpoint}
                      onChangeText={(text) =>
                        setFormData({ ...formData, api_endpoint: text })
                      }
                      placeholder="https://api.sanal.link"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="url"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Santral ID
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.santral_id}
                      onChangeText={(text) =>
                        setFormData({ ...formData, santral_id: text })
                      }
                      placeholder="8390"
                      placeholderTextColor={theme.colors.gray500}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      API Key
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.api_key}
                      onChangeText={(text) =>
                        setFormData({ ...formData, api_key: text })
                      }
                      placeholder="API Key"
                      placeholderTextColor={theme.colors.gray500}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      API Secret (Opsiyonel)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.api_secret}
                      onChangeText={(text) =>
                        setFormData({ ...formData, api_secret: text })
                      }
                      placeholder="API Secret"
                      placeholderTextColor={theme.colors.gray500}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: theme.colors.primaryDark },
                    ]}
                    onPress={handleSaveCompany}
                    disabled={saving}
                  >
                    <Icon name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Profile Info - Employee */}
          {userType === "employee" && employee && (
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={styles.profileItem}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Ad Soyad
                </Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>
                  {employee.first_name} {employee.last_name}
                </Text>
              </View>
              {employee.job_title && (
                <View style={styles.profileItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Pozisyon
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>
                    {employee.job_title}
                  </Text>
                </View>
              )}
              {employee.department && (
                <View style={styles.profileItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Departman
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>
                    {employee.department}
                  </Text>
                </View>
              )}
              {employee.phone && (
                <View style={styles.profileItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Telefon
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>
                    {employee.phone}
                  </Text>
                </View>
              )}
              {employee.email && (
                <View style={styles.profileItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    E-posta
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>
                    {employee.email}
                  </Text>
                </View>
              )}
              {company && (
                <View style={styles.profileItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Şirket
                  </Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>
                    {company.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Reports Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Raporlar
            </Text>
            {loadingReports ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.text }}>Yükleniyor...</Text>
              </View>
            ) : reports.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="assessment" size={64} color={theme.colors.gray400} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Henüz rapor yok
                </Text>
              </View>
            ) : (
              <View>
                {reports.map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    style={[
                      styles.reportCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray200,
                      },
                    ]}
                    onPress={() => handleReportPress(report)}
                  >
                    <View style={styles.reportHeader}>
                      <View style={[styles.reportIcon, { backgroundColor: theme.colors.primary }]}>
                        <Icon name="bar-chart" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.reportInfo}>
                        <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
                          {report.title}
                        </Text>
                        <Text style={[styles.reportType, { color: theme.colors.textSecondary }]}>
                          {report.titleEn}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={24} color={theme.colors.gray400} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={async () => {
              Alert.alert(
                "Çıkış Yap",
                "Çıkış yapmak istediğinize emin misiniz?",
                [
                  { text: "İptal", style: "cancel" },
                  {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: async () => {
                      await signOut();
                    },
                  },
                ]
              );
            }}
          >
            <Icon name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report Details Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
          edges={["bottom", "left", "right"]}
        >
          <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.gray200 }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedReport?.title}
            </Text>
            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {loadingReports ? (
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 70,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
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
    textTransform: "capitalize",
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
  },
  modalContentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    padding: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
