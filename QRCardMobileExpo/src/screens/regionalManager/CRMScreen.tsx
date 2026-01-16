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
  Platform,
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
import { getEmployeesByRegion } from "../../services/employeeService";
import { getQuotes } from "../../services/quoteService";
import type { CRMLead, Employee, CRMLeadStatus, Quote } from "../../types";
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

const quoteStatusLabels: Record<string, string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const getQuoteStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "#10B981";
    case "sent":
      return "#3B82F6";
    case "rejected":
      return "#EF4444";
    case "expired":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

export default function RegionalCRMScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [viewingLead, setViewingLead] = useState<CRMLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [previousViewingLead, setPreviousViewingLead] = useState<CRMLead | null>(null);
  const [wasModalVisible, setWasModalVisible] = useState(false);

  // Debug: Log when viewingQuote changes
  useEffect(() => {
    if (viewingQuote) {
      console.log('viewingQuote set to:', viewingQuote.id, viewingQuote.customer_name);
      // When quote modal opens, save the current viewing lead and close customer modal
      if (viewingLead && modalVisible) {
        setPreviousViewingLead(viewingLead);
        setWasModalVisible(true);
        setModalVisible(false);
      }
    } else {
      console.log('viewingQuote cleared');
      // When quote modal closes, reopen customer modal if we had one open
      if (previousViewingLead && wasModalVisible) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setViewingLead(previousViewingLead);
          setModalVisible(true);
          setPreviousViewingLead(null);
          setWasModalVisible(false);
        }, 100);
      }
    }
  }, [viewingQuote]);

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
    region_id: employee?.region_id || null,
  });

  useEffect(() => {
    if (employee && employee.region_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.region_id) return;

    setLoading(true);
    try {
      // Load employees in region
      const employeesData = await getEmployeesByRegion(employee.region_id);
      setEmployees(employeesData);

      // Load leads in region
      const leadsData = await getLeads(
        employee.company_id,
        undefined,
        employee.region_id
      );
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
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
      region_id: employee?.region_id || null,
    });
    setModalVisible(true);
  };

  const handleViewLead = async (lead: CRMLead) => {
    setViewingLead(lead);
    setEditingLead(null);
    setModalVisible(true);
    
    // Load quotes for this customer
    if (employee?.company_id) {
      setLoadingQuotes(true);
      try {
        // Get quotes by both customer_id and customer_name
        // This ensures we find quotes even if customer_id doesn't match
        const quotes = await getQuotes(
          employee.company_id, 
          undefined, 
          lead.id, 
          lead.customer_name
        );
        
        console.log("Loaded quotes for customer:", {
          customerId: lead.id,
          customerName: lead.customer_name,
          quotesCount: quotes.length,
          quotes: quotes.map(q => ({ 
            id: q.id, 
            customer_id: q.customer_id, 
            customer_name: q.customer_name,
            status: q.status 
          }))
        });
        
        setCustomerQuotes(quotes);
        
        // Eğer "accepted" durumunda bir teklif varsa ve müşteri durumu "Satış Yapıldı" değilse, güncelle
        const acceptedQuotes = quotes.filter(quote => quote.status === 'accepted');
        const hasAcceptedQuote = acceptedQuotes.length > 0;
        
        console.log("Checking customer status for accepted quotes:", {
          customerId: lead.id,
          customerName: lead.customer_name,
          hasAcceptedQuote,
          acceptedQuotesCount: acceptedQuotes.length,
          currentStatus: lead.status
        });
        
        if (hasAcceptedQuote && lead.status !== 'Satış Yapıldı') {
          console.log("Updating customer status to 'Satış Yapıldı' for customer:", lead.id, lead.customer_name);
          try {
            const updated = await updateLead(lead.id, { status: 'Satış Yapıldı' });
            if (updated) {
              console.log("Customer status updated successfully:", updated.id, updated.status);
              setViewingLead({ ...updated });
              // Liste de güncellensin
              await loadData();
            } else {
              console.error("Failed to update customer status - updateLead returned null");
              // updateLead başarısız oldu, direkt olarak state'i güncelle
              setViewingLead({ ...lead, status: 'Satış Yapıldı' });
            }
          } catch (error) {
            console.error("Error updating customer status:", error);
            // Hata durumunda da state'i güncelle
            setViewingLead({ ...lead, status: 'Satış Yapıldı' });
          }
        } else if (hasAcceptedQuote && lead.status === 'Satış Yapıldı') {
          console.log("Customer already has 'Satış Yapıldı' status");
        } else {
          console.log("No accepted quote found for customer");
        }
      } catch (error) {
        console.error("Error loading customer quotes:", error);
        setCustomerQuotes([]);
      } finally {
        setLoadingQuotes(false);
      }
    } else {
      setCustomerQuotes([]);
    }
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
      region_id: lead.region_id || employee?.region_id || null,
    });
    setModalVisible(true);
  };

  const handleSaveLead = async () => {
    if (!employee || !employee.company_id || !formData.customer_name) {
      Alert.alert("Hata", "Lütfen müşteri adını girin");
      return;
    }
    if (!formData.phone || formData.phone.length === 0) {
      Alert.alert("Hata", "Lütfen telefon numarasını girin");
      return;
    }
    // TC No veya Vergi No'dan en az biri doldurulmalı
    if ((!formData.tc_no || formData.tc_no.length === 0) && 
        (!formData.tax_no || formData.tax_no.length === 0)) {
      Alert.alert("Hata", "Lütfen TC No veya Vergi No'dan birini girin");
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
        const newLead = await createLead(employee.company_id, {
          ...formData,
          region_id: employee.region_id,
        });
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
      ]
    );
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const renderLead = ({ item }: { item: CRMLead }) => {
    const assignedEmployee = employees.find((e) => e.id === item.employee_id);
    return (
      <TouchableOpacity
        style={[
          styles.leadCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        onPress={() => handleViewLead(item)}
        activeOpacity={0.7}
      >
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
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteLead(item.id);
              }}
            >
              <Icon name="delete" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        {item.phone && (
          <View style={styles.leadInfo}>
            <Icon name="phone" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}
            >
              {item.phone}
            </Text>
          </View>
        )}
        {item.email && (
          <View style={styles.leadInfo}>
            <Icon name="email" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}
            >
              {item.email}
            </Text>
          </View>
        )}
        {assignedEmployee && (
          <View style={styles.leadInfo}>
            <Icon name="person" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}
            >
              {assignedEmployee.first_name} {assignedEmployee.last_name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
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
            ]}
          >
            Bölgenizdeki tüm müşteri kayıtları
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddLead}
        >
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
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              >
                Henüz müşteri kaydı bulunmuyor
              </Text>
            </View>
          }
        />
      )}

      {/* Lead Form Modal */}
      <Modal
        visible={modalVisible && !viewingQuote}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setViewingLead(null);
          setEditingLead(null);
        }}
        presentationStyle="fullScreen"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <StatusBar barStyle="dark-content" />
          <SafeAreaView
            edges={["top"]}
            style={{ backgroundColor: theme.colors.background }}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.colors.gray200,
                  paddingTop: Platform.OS === "ios" ? Math.max(insets.top - 10, 12) : 0,
                },
              ]}
            >
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setViewingLead(null);
                setEditingLead(null);
              }}
              style={styles.modalBackButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {viewingLead
                ? "Müşteri Detayı"
                : editingLead
                ? "Müşteri Kaydı Düzenle"
                : "Yeni Müşteri Kaydı"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setViewingLead(null);
                setEditingLead(null);
              }}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {viewingLead ? (
              // View Mode - Show lead details
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
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.contact_name}
                    </Text>
                  </View>
                )}

                {viewingLead.phone && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Telefon
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.phone}
                    </Text>
                  </View>
                )}

                {viewingLead.email && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      E-posta
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.email}
                    </Text>
                  </View>
                )}

                {viewingLead.tc_no && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      TC No
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.tc_no}
                    </Text>
                  </View>
                )}

                {viewingLead.tax_no && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Vergi No
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.tax_no}
                    </Text>
                  </View>
                )}

                {viewingLead.address && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Adres
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
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
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(viewingLead.status) },
                      ]}
                    >
                      {viewingLead.status}
                    </Text>
                  </View>
                </View>

                {viewingLead.employee_id && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Atanan Personel
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {(() => {
                        const emp = employees.find(
                          (e) => e.id === viewingLead.employee_id
                        );
                        return emp
                          ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                          : "Atanmamış";
                      })()}
                    </Text>
                  </View>
                )}

                {viewingLead.notes && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Notlar
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingLead.notes}
                    </Text>
                  </View>
                )}

                {viewingLead.follow_up_date && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Takip Tarihi
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {new Date(viewingLead.follow_up_date).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                )}

                {viewingLead.created_at && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Oluşturulma Tarihi
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {new Date(viewingLead.created_at).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                )}

                {/* Quotes Section */}
                <View style={styles.formGroup}>
                  <View style={styles.sectionHeader}>
                    <Icon
                      name="description"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Teklifler ({customerQuotes.length})
                    </Text>
                  </View>

                  {loadingQuotes ? (
                    <View style={styles.quotesLoadingContainer}>
                      <Text style={[styles.quotesLoadingText, { color: theme.colors.textSecondary }]}>
                        Yükleniyor...
                      </Text>
                    </View>
                  ) : customerQuotes.length > 0 ? (
                    <View style={styles.quotesList}>
                      {customerQuotes.map((quote) => {
                        const assignedEmployee = employees.find((e) => e.id === quote.employee_id);
                        return (
                          <TouchableOpacity
                            key={quote.id}
                            style={[
                              styles.quoteCard,
                              {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.gray200,
                              },
                            ]}
                            onPress={() => {
                              console.log('Quote card pressed:', quote.id);
                              setViewingQuote(quote);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.quoteCardHeader}>
                              <View style={styles.quoteCardHeaderLeft}>
                                <Text
                                  style={[styles.quoteCardTitle, { color: theme.colors.text }]}
                                  numberOfLines={1}
                                >
                                  {quote.product_service || "Teklif"}
                                </Text>
                                {assignedEmployee && (
                                  <Text
                                    style={[
                                      styles.quoteCardEmployee,
                                      { color: theme.colors.textSecondary },
                                    ]}
                                  >
                                    {assignedEmployee.first_name} {assignedEmployee.last_name}
                                  </Text>
                                )}
                              </View>
                              <View
                                style={[
                                  styles.quoteStatusBadge,
                                  {
                                    backgroundColor: getQuoteStatusColor(quote.status) + "20",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.quoteStatusText,
                                    { color: getQuoteStatusColor(quote.status) },
                                  ]}
                                >
                                  {quoteStatusLabels[quote.status] || quote.status}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.quoteCardDetails}>
                              <View style={styles.quoteCardDetailRow}>
                                <Icon
                                  name="attach-money"
                                  size={16}
                                  color={theme.colors.gray500}
                                />
                                <Text
                                  style={[
                                    styles.quoteCardDetailText,
                                    { color: theme.colors.text },
                                  ]}
                                >
                                  {quote.total_amount.toFixed(2)} ₺
                                </Text>
                              </View>
                              {quote.validity_date && (
                                <View style={styles.quoteCardDetailRow}>
                                  <Icon
                                    name="event"
                                    size={16}
                                    color={theme.colors.gray500}
                                  />
                                  <Text
                                    style={[
                                      styles.quoteCardDetailText,
                                      { color: theme.colors.textSecondary },
                                    ]}
                                  >
                                    {new Date(quote.validity_date).toLocaleDateString("tr-TR")}
                                  </Text>
                                </View>
                              )}
                              {quote.created_at && (
                                <View style={styles.quoteCardDetailRow}>
                                  <Icon
                                    name="schedule"
                                    size={16}
                                    color={theme.colors.gray500}
                                  />
                                  <Text
                                    style={[
                                      styles.quoteCardDetailText,
                                      { color: theme.colors.textSecondary },
                                    ]}
                                  >
                                    {new Date(quote.created_at).toLocaleDateString("tr-TR")}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyQuotesContainer}>
                      <Text
                        style={[
                          styles.emptyQuotesText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Bu müşteri için henüz teklif bulunmuyor
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              // Edit/Create Mode - Show form
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
                    // Limit to 11 characters and only numbers
                    const numericText = text.replace(/[^0-9]/g, '').slice(0, 11);
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
                    // Limit to 11 characters and only numbers
                    const numericText = text.replace(/[^0-9]/g, '').slice(0, 11);
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
                    // Limit to 11 characters and only numbers
                    const numericText = text.replace(/[^0-9]/g, '').slice(0, 11);
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
                    }))
                  );
                }}
              >
                <Text
                  style={[
                    styles.selectText,
                    {
                      color: formData.status
                        ? theme.colors.text
                        : theme.colors.gray500,
                    },
                  ]}
                >
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
                Personel (Opsiyonel)
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                onPress={() => setEmployeeModalVisible(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    {
                      color: formData.employee_id
                        ? theme.colors.text
                        : theme.colors.gray500,
                    },
                  ]}
                >
                  {formData.employee_id
                    ? employees.find((e) => e.id === formData.employee_id)
                        ?.first_name +
                      " " +
                      employees.find((e) => e.id === formData.employee_id)
                        ?.last_name
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
            // View Mode - Show edit button
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: theme.colors.primaryDark,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                onPress={() => {
                  if (viewingLead) {
                    handleEditLead(viewingLead);
                  }
                }}
              >
                <Icon name="edit" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonTextWhite, { marginLeft: 8 }]}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Edit/Create Mode - Show cancel and save buttons
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.gray200 },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setViewingLead(null);
                  setEditingLead(null);
                }}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.colors.text }]}
                >
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primaryDark },
                ]}
                onPress={handleSaveLead}
              >
                <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
              </TouchableOpacity>
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
                ]}
              >
                <View
                  style={[
                    styles.employeeModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                >
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
                    }}
                  >
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
                      }}
                    >
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
                          ]}
                        >
                          {item.first_name} {item.last_name}
                        </Text>
                        {item.job_title && (
                          <Text
                            style={[
                              styles.employeeOptionJob,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
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
                      }}
                    >
                      <Text
                        style={[
                          styles.employeeOptionText,
                          {
                            color:
                              formData.employee_id === null
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}
                      >
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
        </View>

      </Modal>

      {/* Quote Detail Modal */}
      <Modal
        visible={!!viewingQuote}
        animationType="slide"
        onRequestClose={() => {
          console.log('Quote modal close requested');
          setViewingQuote(null);
        }}
        presentationStyle="fullScreen"
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <SafeAreaView
            style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
            edges={['top']}
          >
            <View 
              style={[
                styles.modalHeader, 
                { 
                  borderBottomColor: theme.colors.gray200,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setViewingQuote(null)}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Teklif Detayı
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setViewingQuote(null)}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {viewingQuote && (
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Müşteri Adı</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {viewingQuote.customer_name}
                </Text>
              </View>

              {viewingQuote.product_service && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Ürün/Hizmet
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingQuote.product_service}
                  </Text>
                </View>
              )}

              {viewingQuote.description && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Açıklama</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingQuote.description}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Fiyat</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {viewingQuote.price.toFixed(2)} ₺
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>KDV Oranı</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  %{viewingQuote.tax_rate}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>KDV Tutarı</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {viewingQuote.tax_amount.toFixed(2)} ₺
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Toplam Tutar</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {viewingQuote.total_amount.toFixed(2)} ₺
                </Text>
              </View>

              {viewingQuote.validity_date && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Geçerlilik Tarihi
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {new Date(viewingQuote.validity_date).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Durum</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getQuoteStatusColor(viewingQuote.status) + "20",
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getQuoteStatusColor(viewingQuote.status) },
                    ]}
                  >
                    {quoteStatusLabels[viewingQuote.status] || viewingQuote.status}
                  </Text>
                </View>
              </View>

              {viewingQuote.notes && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Notlar</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingQuote.notes}
                  </Text>
                </View>
              )}

              {viewingQuote.created_at && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {new Date(viewingQuote.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              )}

              {employees.find((e) => e.id === viewingQuote.employee_id) && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Oluşturan Personel
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {employees.find((e) => e.id === viewingQuote.employee_id)?.first_name}{" "}
                    {employees.find((e) => e.id === viewingQuote.employee_id)?.last_name}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          </SafeAreaView>
        </View>
      </Modal>
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
  deleteButton: {
    padding: 4,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  quotesLoadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  quotesLoadingText: {
    fontSize: 14,
  },
  quotesList: {
    gap: 12,
    marginTop: 8,
  },
  quoteCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  quoteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  quoteCardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  quoteCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  quoteCardEmployee: {
    fontSize: 12,
  },
  quoteStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quoteStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  quoteCardDetails: {
    gap: 6,
  },
  quoteCardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quoteCardDetailText: {
    fontSize: 13,
  },
  emptyQuotesContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyQuotesText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  quoteDetailSection: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 500,
  },
  quoteDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  quoteDetailTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  quoteDetailCloseButton: {
    padding: 4,
  },
  quoteDetailContent: {
    padding: 16,
  },
});
