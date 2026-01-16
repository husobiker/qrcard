import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  type CRMLeadFormData,
} from "../../services/crmService";
import { getEmployeesByRole, getEmployeesByCompany } from "../../services/employeeService";
import { getRegionsByCompany } from "../../services/regionService";
import { getEmployeeSipSettings } from "../../services/sipSettingsService";
import { getCompanyById } from "../../services/companyService";
import CallInterface from "../../components/CallInterface";
import type { CRMLead, Employee, CRMLeadStatus, Region, EmployeeSipSettings, Company } from "../../types";
import { FIXED_ROLES } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const statusOptions: CRMLeadStatus[] = [
  "Yeni",
  "Görüşüldü",
  "Satış Yapıldı",
  "Reddedildi",
  "Takipte",
];

const getStatusColor = (status: CRMLeadStatus) => {
  switch (status) {
    case "Satış Yapıldı":
      return "#10B981";
    case "Takipte":
      return "#F59E0B";
    case "Reddedildi":
      return "#EF4444";
    case "Görüşüldü":
      return "#3B82F6";
    default:
      return "#6B7280";
  }
};

export default function CallCenterCRMScreen({ route }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [viewingLead, setViewingLead] = useState<CRMLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [regionSearchQuery, setRegionSearchQuery] = useState("");
  const [employeeSipSettings, setEmployeeSipSettings] = useState<EmployeeSipSettings | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [showCallInterface, setShowCallInterface] = useState(false);

  const [formData, setFormData] = useState<CRMLeadFormData>({
    customer_name: "",
    contact_name: "",
    phone: "",
    email: "",
    tc_no: "",
    tax_no: "",
    address: "",
    notes: "",
    follow_up_date: "",
    status: "Yeni",
    employee_id: null,
    region_id: null,
  });

  useEffect(() => {
    if (employee && employee.company_id) {
      loadData();
      loadSipSettings();
      loadCompany();
      // Check if we should open new customer modal
      if (route?.params?.openNewCustomerModal) {
        handleAddLead();
      }
    }
  }, [employee, route]);

  const loadData = async () => {
    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      // Load all company leads (Call Center can see all)
      const leadsData = await getLeads(employee.company_id);
      setLeads(leadsData);

      // Load all marketing staff employees
      const marketingEmployees = await getEmployeesByRole(
        employee.company_id,
        FIXED_ROLES.MARKETING_STAFF,
      );
      setEmployees(marketingEmployees);

      // Load all regions
      const regionsData = await getRegionsByCompany(employee.company_id);
      setRegions(regionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSipSettings = async () => {
    if (!employee) return;
    try {
      const settings = await getEmployeeSipSettings(employee.id);
      setEmployeeSipSettings(settings);
    } catch (error) {
      console.error("Error loading SIP settings:", error);
    }
  };

  const loadCompany = async () => {
    if (!employee || !employee.company_id) return;
    try {
      const companyData = await getCompanyById(employee.company_id);
      setCompany(companyData);
    } catch (error) {
      console.error("Error loading company:", error);
    }
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setViewingLead(null);
    setFormData({
      customer_name: "",
      contact_name: "",
      phone: "",
      email: "",
      tc_no: "",
      tax_no: "",
      address: "",
      notes: "",
      follow_up_date: "",
      status: "Yeni",
      employee_id: null,
      region_id: null, // Must be selected
    });
    setModalVisible(true);
  };

  const handleViewLead = (lead: CRMLead) => {
    setViewingLead(lead);
    setEditingLead(null);
    setFormData({
      customer_name: lead.customer_name,
      contact_name: lead.contact_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      tc_no: lead.tc_no || "",
      tax_no: lead.tax_no || "",
      address: lead.address || "",
      notes: lead.notes || "",
      follow_up_date: lead.follow_up_date || "",
      status: lead.status,
      employee_id: lead.employee_id || null,
      region_id: lead.region_id || null,
    });
    setModalVisible(true);
  };

  const handleEditLead = (lead: CRMLead) => {
    setEditingLead(lead);
    setViewingLead(null);
    setFormData({
      customer_name: lead.customer_name,
      contact_name: lead.contact_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      tc_no: lead.tc_no || "",
      tax_no: lead.tax_no || "",
      address: lead.address || "",
      notes: lead.notes || "",
      follow_up_date: lead.follow_up_date || "",
      status: lead.status,
      employee_id: lead.employee_id || null,
      region_id: lead.region_id || null,
    });
    setModalVisible(true);
  };

  const handleSaveLead = async () => {
    if (!employee || !employee.company_id) return;

    if (!formData.customer_name.trim()) {
      Alert.alert("Hata", "Lütfen müşteri adını girin");
      return;
    }
    if (!formData.phone || formData.phone.length === 0) {
      Alert.alert("Hata", "Lütfen telefon numarasını girin");
      return;
    }
    // TC No veya Vergi No'dan en az biri doldurulmalı
    if (
      (!formData.tc_no || formData.tc_no.length === 0) &&
      (!formData.tax_no || formData.tax_no.length === 0)
    ) {
      Alert.alert("Hata", "Lütfen TC No veya Vergi No'dan birini girin");
      return;
    }
    // Region is mandatory for Call Center
    if (!formData.region_id) {
      Alert.alert("Hata", "Lütfen bölge seçin");
      return;
    }

    try {
      if (editingLead) {
        const updated = await updateLead(editingLead.id, formData);
        if (updated) {
          await loadData();
          setModalVisible(false);
          Alert.alert("Başarılı", "Müşteri kaydı güncellendi");
        }
      } else {
        const newLead = await createLead(employee.company_id, formData);
        if (newLead) {
          await loadData();
          setModalVisible(false);
          Alert.alert("Başarılı", "Müşteri kaydı eklendi");
        }
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      Alert.alert("Hata", "Müşteri kaydı kaydedilemedi");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    Alert.alert(
      "Müşteri Kaydı Sil",
      "Bu müşteri kaydını silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteLead(leadId);
            if (success) {
              await loadData();
            } else {
              Alert.alert("Hata", "Müşteri kaydı silinemedi");
            }
          },
        },
      ],
    );
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchQuery) return true;
    const searchLower = employeeSearchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredRegions = regions.filter((region) => {
    if (!regionSearchQuery) return true;
    const searchLower = regionSearchQuery.toLowerCase();
    return region.name?.toLowerCase().includes(searchLower);
  });

  const renderLead = ({ item }: { item: CRMLead }) => {
    const assignedEmployee = employees.find((e) => e.id === item.employee_id);
    const assignedRegion = regions.find((r) => r.id === item.region_id);
    return (
      <View
        style={[
          styles.leadCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}>
        <TouchableOpacity
          onPress={() => handleViewLead(item)}
          activeOpacity={0.7}
          style={styles.leadCardContent}>
          <View style={styles.leadHeader}>
            <Text style={[styles.leadName, { color: theme.colors.text }]}>
              {item.customer_name}
            </Text>
            <View style={styles.leadHeaderRight}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(item.status) + "20",
                  },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}>
                  {item.status}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButtonInline}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteLead(item.id);
                }}
                activeOpacity={0.7}>
                <Icon name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        {item.phone && (
          <View style={styles.leadInfo}>
            <Icon name="phone" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}>
              {item.phone}
            </Text>
          </View>
        )}
        {assignedEmployee && (
          <View style={styles.leadInfo}>
            <Icon name="person" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}>
              {assignedEmployee.first_name} {assignedEmployee.last_name}
            </Text>
          </View>
        )}
        {assignedRegion && (
          <View style={styles.leadInfo}>
            <Icon name="location-on" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}>
              {assignedRegion.name}
            </Text>
          </View>
        )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Müşteri Kayıtları
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}>
            Tüm şirket müşteri kayıtları
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddLead}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon
          name="search"
          size={20}
          color={theme.colors.gray500}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Müşteri ara..."
          placeholderTextColor={theme.colors.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Kayıtlar yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="person-outline"
                size={64}
                color={theme.colors.gray400}
              />
              <Text
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Henüz müşteri kaydı bulunmuyor
              </Text>
            </View>
          }
        />
      )}

      {/* Lead Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setViewingLead(null);
          setEditingLead(null);
        }}
        presentationStyle="fullScreen">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
          edges={["left", "right", "bottom"]}>
          <View
            style={[
              styles.modalHeader,
              { 
                borderBottomColor: theme.colors.gray200,
                paddingTop: insets.top,
              },
            ]}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setModalVisible(false);
                setViewingLead(null);
                setEditingLead(null);
              }}>
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {viewingLead
                ? "Müşteri Detayı"
                : editingLead
                ? "Müşteri Düzenle"
                : "Yeni Müşteri"}
            </Text>
            {viewingLead && (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setViewingLead(null);
                }}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalContent}>
            {viewingLead ? (
              // View Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri Adı
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingLead.customer_name}
                  </Text>
                </View>

                {viewingLead.contact_name && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      İletişim Kişisi
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingLead.contact_name}
                    </Text>
                  </View>
                )}

                {viewingLead.phone && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Telefon
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingLead.phone}
                    </Text>
                  </View>
                )}

                {viewingLead.email && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      E-posta
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingLead.email}
                    </Text>
                  </View>
                )}

                {viewingLead.address && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Adres
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingLead.address}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Durum
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(viewingLead.status) + "20",
                        alignSelf: "flex-start",
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(viewingLead.status) },
                      ]}>
                      {viewingLead.status}
                    </Text>
                  </View>
                </View>

                {viewingLead.region_id && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Bölge
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {regions.find((r) => r.id === viewingLead.region_id)?.name ||
                        "Bilinmiyor"}
                    </Text>
                  </View>
                )}

                {viewingLead.employee_id && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Atanan Personel
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {employees.find((e) => e.id === viewingLead.employee_id)
                        ? `${employees.find((e) => e.id === viewingLead.employee_id)?.first_name} ${employees.find((e) => e.id === viewingLead.employee_id)?.last_name}`
                        : "Atanmamış"}
                    </Text>
                  </View>
                )}

                {viewingLead.notes && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Notlar
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingLead.notes}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Edit/Create Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri Adı *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.customer_name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, customer_name: text })
                    }
                    placeholder="Müşteri adı"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    İletişim Kişisi
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.contact_name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contact_name: text })
                    }
                    placeholder="İletişim kişisi adı"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Telefon *
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
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, "").slice(0, 11);
                        setFormData({ ...formData, phone: numericText });
                      }}
                      placeholder="5xx xxx xx xx"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      E-posta
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text })
                      }
                      placeholder="musteri@email.com"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      TC No <Text style={{ color: theme.colors.gray500, fontSize: 12 }}>(TC No veya Vergi No zorunlu)</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.tc_no}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, "").slice(0, 11);
                        setFormData({ ...formData, tc_no: numericText });
                      }}
                      placeholder="TC Kimlik No"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="number-pad"
                      maxLength={11}
                    />
                  </View>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Vergi No <Text style={{ color: theme.colors.gray500, fontSize: 12 }}>(TC No veya Vergi No zorunlu)</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.tax_no}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, "").slice(0, 11);
                        setFormData({ ...formData, tax_no: numericText });
                      }}
                      placeholder="Vergi No"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="number-pad"
                      maxLength={11}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Adres
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.address}
                    onChangeText={(text) =>
                      setFormData({ ...formData, address: text })
                    }
                    placeholder="Müşteri adresi"
                    placeholderTextColor={theme.colors.gray500}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Durum
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Durum Seç",
                        "Müşteri durumunu seçin",
                        statusOptions.map((status) => ({
                          text: status,
                          onPress: () => setFormData({ ...formData, status }),
                        })),
                      );
                    }}>
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.status
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}>
                      {formData.status || "Durum seçin"}
                    </Text>
                    <Icon
                      name="arrow-drop-down"
                      size={24}
                      color={theme.colors.gray500}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Bölge *
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: formData.region_id
                          ? theme.colors.gray300
                          : theme.colors.error,
                      },
                    ]}
                    onPress={() => setRegionModalVisible(true)}>
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.region_id
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}>
                      {formData.region_id
                        ? regions.find((r) => r.id === formData.region_id)?.name ||
                          "Bölge seçin"
                        : "Bölge seçin *"}
                    </Text>
                    <Icon
                      name="arrow-drop-down"
                      size={24}
                      color={theme.colors.gray500}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Pazarlama Personeli (Opsiyonel)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={() => setEmployeeModalVisible(true)}>
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.employee_id
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}>
                      {formData.employee_id
                        ? employees.find((e) => e.id === formData.employee_id)
                            ? `${employees.find((e) => e.id === formData.employee_id)?.first_name} ${employees.find((e) => e.id === formData.employee_id)?.last_name}`
                            : "Personel seçin"
                        : "Personel seçin (opsiyonel)"}
                    </Text>
                    <Icon
                      name="arrow-drop-down"
                      size={24}
                      color={theme.colors.gray500}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Notlar
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.notes}
                    onChangeText={(text) =>
                      setFormData({ ...formData, notes: text })
                    }
                    placeholder="Müşteri hakkında notlar"
                    placeholderTextColor={theme.colors.gray500}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </ScrollView>

          {viewingLead ? (
            // View Mode - Show edit and call buttons
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}>
              {viewingLead.phone && (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: theme.colors.success,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 0,
                      paddingHorizontal: 20,
                    },
                  ]}
                  onPress={() => {
                    if (employeeSipSettings && employee && company) {
                      // Use CallInterface if SIP settings are available
                      setShowCallInterface(true);
                    } else {
                      // Fallback to tel: link
                      if (viewingLead.phone) {
                        Linking.openURL(`tel:${viewingLead.phone}`).catch((err) => {
                          console.error("Error opening phone dialer:", err);
                          Alert.alert("Hata", "Telefon uygulaması açılamadı");
                        });
                      }
                    }
                  }}>
                  <Icon name="phone" size={18} color="#FFFFFF" />
                  <Text style={[styles.modalButtonTextWhite, { marginLeft: 8 }]}>
                    Ara
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.colors.primaryDark,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  },
                ]}
                onPress={() => {
                  if (viewingLead) {
                    handleEditLead(viewingLead);
                  }
                }}>
                <Icon name="edit" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonTextWhite, { marginLeft: 8 }]}>
                  Düzenle
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Edit/Create Mode - Show cancel and save buttons
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.gray200 },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setViewingLead(null);
                  setEditingLead(null);
                }}>
                <Text
                  style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primaryDark },
                ]}
                onPress={handleSaveLead}>
                <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Region Selection Modal */}
          {regionModalVisible && (
            <View style={styles.employeeModalWrapper}>
              <View style={styles.employeeModalBackdrop} />
              <View
                style={[
                  styles.employeeModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}>
                <View
                  style={[
                    styles.employeeModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}>
                  <TextInput
                    style={[
                      styles.employeeSearchInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder="Bölge ara..."
                    placeholderTextColor={theme.colors.gray500}
                    value={regionSearchQuery}
                    onChangeText={setRegionSearchQuery}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setRegionModalVisible(false);
                      setRegionSearchQuery("");
                    }}>
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredRegions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.employeeOption,
                        {
                          backgroundColor:
                            formData.region_id === item.id
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            formData.region_id === item.id
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, region_id: item.id });
                        setRegionModalVisible(false);
                        setRegionSearchQuery("");
                      }}>
                      <View style={styles.employeeOptionContent}>
                        <Text
                          style={[
                            styles.employeeOptionText,
                            {
                              color:
                                formData.region_id === item.id
                                  ? theme.colors.primary
                                  : theme.colors.text,
                            },
                          ]}>
                          {item.name}
                        </Text>
                        {item.description && (
                          <Text
                            style={[
                              styles.employeeOptionJob,
                              { color: theme.colors.textSecondary },
                            ]}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      {formData.region_id === item.id && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.employeeModalScrollView}
                />
              </View>
            </View>
          )}

          {/* Employee Selection Modal */}
          {employeeModalVisible && (
            <View style={styles.employeeModalWrapper}>
              <View style={styles.employeeModalBackdrop} />
              <View
                style={[
                  styles.employeeModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}>
                <View
                  style={[
                    styles.employeeModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}>
                  <TextInput
                    style={[
                      styles.employeeSearchInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder="Personel ara..."
                    placeholderTextColor={theme.colors.gray500}
                    value={employeeSearchQuery}
                    onChangeText={setEmployeeSearchQuery}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setEmployeeModalVisible(false);
                      setEmployeeSearchQuery("");
                    }}>
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredEmployees}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.employeeOption,
                        {
                          backgroundColor:
                            formData.employee_id === item.id
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            formData.employee_id === item.id
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, employee_id: item.id });
                        setEmployeeModalVisible(false);
                        setEmployeeSearchQuery("");
                      }}>
                      <View style={styles.employeeOptionContent}>
                        <Text
                          style={[
                            styles.employeeOptionText,
                            {
                              color:
                                formData.employee_id === item.id
                                  ? theme.colors.primary
                                  : theme.colors.text,
                            },
                          ]}>
                          {item.first_name} {item.last_name}
                        </Text>
                        {item.job_title && (
                          <Text
                            style={[
                              styles.employeeOptionJob,
                              { color: theme.colors.textSecondary },
                            ]}>
                            {item.job_title}
                          </Text>
                        )}
                      </View>
                      {formData.employee_id === item.id && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  ListHeaderComponent={
                    <TouchableOpacity
                      style={[
                        styles.employeeOption,
                        {
                          backgroundColor:
                            formData.employee_id === null
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            formData.employee_id === null
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, employee_id: null });
                        setEmployeeModalVisible(false);
                        setEmployeeSearchQuery("");
                      }}>
                      <Text
                        style={[
                          styles.employeeOptionText,
                          {
                            color:
                              formData.employee_id === null
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}>
                        Personel Atanmadı
                      </Text>
                      {formData.employee_id === null && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  }
                  style={styles.employeeModalScrollView}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Call Interface Modal */}
      {showCallInterface && employeeSipSettings && employee && company && viewingLead && (
        <CallInterface
          employeeSipSettings={employeeSipSettings}
          company={company}
          phoneNumber={viewingLead.phone || ""}
          customerName={viewingLead.customer_name}
          customerId={viewingLead.id}
          companyId={employee.company_id}
          employeeId={employee.id}
          onClose={() => {
            setShowCallInterface(false);
          }}
        />
      )}
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
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  leadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  leadCardContent: {
    flex: 1,
  },
  leadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leadName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  leadHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  leadInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  leadInfoText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  modalBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalCloseButton: {
    padding: 8,
    marginRight: -8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  modalContent: {
    flexGrow: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextWhite: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  employeeModalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  employeeModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  employeeModalContainer: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    borderRadius: 20,
    maxHeight: "60%",
    minHeight: "40%",
    zIndex: 1001,
  },
  employeeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  employeeSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  employeeModalScrollView: {
    flex: 1,
    padding: 16,
  },
  employeeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  employeeOptionContent: {
    flex: 1,
  },
  employeeOptionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeeOptionJob: {
    fontSize: 14,
  },
  deleteButtonInline: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginLeft: 8,
  },
});
