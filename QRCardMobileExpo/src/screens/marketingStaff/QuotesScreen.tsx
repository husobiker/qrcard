import React, { useState, useEffect, useRef } from "react";
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
  getQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  type QuoteFormData,
} from "../../services/quoteService";
import { getLeads } from "../../services/crmService";
import type { Quote, CRMLead, QuoteStatus } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const statusOptions: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

const statusLabels: Record<QuoteStatus, string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const getStatusColor = (status: QuoteStatus) => {
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

export default function MarketingStaffQuotesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as any;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState<number>(new Date().getDate());
  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    employee_id: employee?.id || "",
    customer_id: null,
    customer_name: "",
    product_service: "",
    description: "",
    price: 0,
    tax_rate: 20,
    validity_date: "",
    status: "draft",
    notes: "",
    attachments: [],
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
      // Load quotes for this employee
      const quotesData = await getQuotes(employee.company_id, employee.id);
      setQuotes(quotesData);

      // Load CRM leads for customer selection
      const leadsData = await getLeads(employee.company_id, employee.id);
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuote = () => {
    setEditingQuote(null);
    setViewingQuote(null);
    const today = new Date();
    setSelectedDate(today);
    setTempYear(today.getFullYear());
    setTempMonth(today.getMonth() + 1);
    setTempDay(today.getDate());
    setFormData({
      employee_id: employee?.id || "",
      customer_id: null,
      customer_name: "",
      product_service: "",
      description: "",
      price: 0,
      tax_rate: 20,
      validity_date: "",
      status: "draft",
      notes: "",
      attachments: [],
    });
    setModalVisible(true);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const handleDatePickerOpen = () => {
    let date: Date;
    if (formData.validity_date) {
      date = new Date(formData.validity_date + "T00:00:00");
    } else {
      date = new Date();
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    setTempYear(year);
    setTempMonth(month);
    setTempDay(day);
    setSelectedDate(date);
    setShowDatePicker(true);
    
    // Scroll to selected values after a short delay to ensure ScrollView is rendered
    setTimeout(() => {
      // Item height: paddingVertical (12) * 2 + text height (~20) + marginVertical (2) * 2 = ~48
      const itemHeight = 48;
      
      // Scroll to year (50 years range: current year - 5 to current year + 44)
      const currentYear = new Date().getFullYear();
      const yearIndex = year - (currentYear - 5);
      if (yearScrollRef.current && yearIndex >= 0 && yearIndex < 50) {
        yearScrollRef.current.scrollTo({
          y: yearIndex * itemHeight,
          animated: true,
        });
      }
      
      // Scroll to month (0-11 index, month is 1-based)
      if (monthScrollRef.current) {
        monthScrollRef.current.scrollTo({
          y: (month - 1) * itemHeight,
          animated: true,
        });
      }
      
      // Scroll to day (day is 1-based)
      if (dayScrollRef.current) {
        dayScrollRef.current.scrollTo({
          y: (day - 1) * itemHeight,
          animated: true,
        });
      }
    }, 150);
  };

  const handleDateConfirm = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    const date = new Date(tempYear, tempMonth - 1, day);
    setSelectedDate(date);
    // Format date as YYYY-MM-DD
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormData({ ...formData, validity_date: formattedDate });
    setShowDatePicker(false);
  };

  const handleViewQuote = (quote: Quote) => {
    setViewingQuote(quote);
    setEditingQuote(null);
    setModalVisible(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setViewingQuote(null);
    const validityDate = quote.validity_date ? new Date(quote.validity_date) : new Date();
    setSelectedDate(validityDate);
    setTempYear(validityDate.getFullYear());
    setTempMonth(validityDate.getMonth() + 1);
    setTempDay(validityDate.getDate());
    setFormData({
      employee_id: quote.employee_id || employee?.id || "",
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      product_service: quote.product_service || "",
      description: quote.description || "",
      price: quote.price,
      tax_rate: quote.tax_rate,
      validity_date: quote.validity_date || "",
      status: quote.status,
      notes: quote.notes || "",
      attachments: quote.attachments || [],
    });
    setModalVisible(true);
  };

  const handleSaveQuote = async () => {
    if (!employee || !employee.company_id || !formData.customer_name) {
      Alert.alert("Hata", "Lütfen müşteri adını girin");
      return;
    }
    if (formData.price <= 0) {
      Alert.alert("Hata", "Lütfen geçerli bir fiyat girin");
      return;
    }

    try {
      if (editingQuote) {
        const updated = await updateQuote(editingQuote.id, formData);
        if (updated) {
          await loadData();
          setModalVisible(false);
          setViewingQuote(null);
          setEditingQuote(null);
          Alert.alert("Başarılı", "Teklif güncellendi");
        }
      } else {
        const newQuote = await createQuote(employee.company_id, formData);
        if (newQuote) {
          await loadData();
          setModalVisible(false);
          setViewingQuote(null);
          setEditingQuote(null);
          Alert.alert("Başarılı", "Teklif eklendi");
        }
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      Alert.alert("Hata", "Teklif kaydedilirken bir hata oluştu");
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    Alert.alert("Teklifi Sil", "Bu teklifi silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const deleted = await deleteQuote(quoteId);
          if (deleted) {
            await loadData();
            Alert.alert("Başarılı", "Teklif silindi");
          }
        },
      },
    ]);
  };

  const calculateTotals = () => {
    const price = formData.price || 0;
    const taxRate = formData.tax_rate !== undefined && formData.tax_rate !== null ? formData.tax_rate : 20;
    const taxAmount = price * (taxRate / 100);
    const totalAmount = price + taxAmount;
    return { taxAmount, totalAmount };
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      !searchQuery ||
      quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.product_service?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLeads = leads.filter((lead) => {
    if (!customerSearchQuery) return true;
    const searchLower = customerSearchQuery.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower)
    );
  });

  const renderQuote = ({ item }: { item: Quote }) => {
    const { totalAmount } = calculateTotals();
    return (
      <TouchableOpacity
        style={[
          styles.quoteCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        onPress={() => handleViewQuote(item)}
        activeOpacity={0.7}
      >
        <View style={styles.quoteHeader}>
          <Text style={[styles.quoteCustomerName, { color: theme.colors.text }]}>
            {item.customer_name}
          </Text>
          <View style={styles.quoteHeaderRight}>
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
                {statusLabels[item.status]}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteQuote(item.id);
              }}
            >
              <Icon name="delete" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        {item.product_service && (
          <View style={styles.quoteInfo}>
            <Icon name="description" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.quoteInfoText, { color: theme.colors.textSecondary }]}
            >
              {item.product_service}
            </Text>
          </View>
        )}
        <View style={styles.quoteInfo}>
          <Icon name="attach-money" size={16} color={theme.colors.gray500} />
          <Text
            style={[styles.quoteInfoText, { color: theme.colors.text }]}
          >
            {item.total_amount.toFixed(2)} ₺
          </Text>
        </View>
        {item.validity_date && (
          <View style={styles.quoteInfo}>
            <Icon name="event" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.quoteInfoText, { color: theme.colors.textSecondary }]}
            >
              Geçerlilik: {new Date(item.validity_date).toLocaleDateString("tr-TR")}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const { taxAmount, totalAmount } = calculateTotals();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Teklifler
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddQuote}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.gray300,
            },
          ]}
        >
          <Icon name="search" size={20} color={theme.colors.gray500} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Teklif ara..."
            placeholderTextColor={theme.colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === "all"
                  ? theme.colors.primary
                  : theme.colors.background,
              borderColor:
                statusFilter === "all"
                  ? theme.colors.primary
                  : theme.colors.gray300,
              borderWidth: statusFilter === "all" ? 0 : 1,
            },
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  statusFilter === "all" ? "#FFFFFF" : theme.colors.text,
              },
            ]}
          >
            Tümü
          </Text>
        </TouchableOpacity>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  statusFilter === status
                    ? theme.colors.primary
                    : theme.colors.background,
                borderColor:
                  statusFilter === status
                    ? theme.colors.primary
                    : theme.colors.gray300,
                borderWidth: statusFilter === status ? 0 : 1,
              },
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    statusFilter === status ? "#FFFFFF" : theme.colors.text,
                },
              ]}
            >
              {statusLabels[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quotes List */}
      <FlatList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery || statusFilter !== "all"
                ? "Arama kriterlerinize uygun teklif bulunamadı"
                : "Henüz teklif eklenmemiş"}
            </Text>
          </View>
        }
      />

      {/* Create/Edit/View Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
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
                  setViewingQuote(null);
                  setEditingQuote(null);
                }}
                style={styles.modalBackButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {viewingQuote
                  ? "Teklif Detayı"
                  : editingQuote
                  ? "Teklif Düzenle"
                  : "Yeni Teklif"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setViewingQuote(null);
                  setEditingQuote(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {viewingQuote ? (
              // View Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri Adı
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingQuote.customer_name}
                  </Text>
                </View>

                {viewingQuote.product_service && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Ürün/Hizmet
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingQuote.product_service}
                    </Text>
                  </View>
                )}

                {viewingQuote.description && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Açıklama
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingQuote.description}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Fiyat
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {viewingQuote.price.toFixed(2)} ₺
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    KDV Oranı
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    %{viewingQuote.tax_rate}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    KDV Tutarı
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {viewingQuote.tax_amount.toFixed(2)} ₺
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Toplam Tutar
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.primary, fontSize: 20, fontWeight: "700" },
                    ]}
                  >
                    {viewingQuote.total_amount.toFixed(2)} ₺
                  </Text>
                </View>

                {viewingQuote.validity_date && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Geçerlilik Tarihi
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {new Date(viewingQuote.validity_date).toLocaleDateString("tr-TR")}
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
                        backgroundColor: getStatusColor(viewingQuote.status) + "20",
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(viewingQuote.status) },
                      ]}
                    >
                      {statusLabels[viewingQuote.status]}
                    </Text>
                  </View>
                </View>

                {viewingQuote.notes && (
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
                      {viewingQuote.notes}
                    </Text>
                  </View>
                )}

                {viewingQuote.created_at && (
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
                      {new Date(viewingQuote.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Edit/Create Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri *
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={() => setCustomerModalVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.customer_name
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}
                    >
                      {formData.customer_name || "Müşteri seçin"}
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
                    Ürün/Hizmet
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.product_service}
                    onChangeText={(text) =>
                      setFormData({ ...formData, product_service: text })
                    }
                    placeholder="Ürün veya hizmet adı"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Açıklama
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    placeholder="Teklif açıklaması"
                    placeholderTextColor={theme.colors.gray500}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Fiyat *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.price.toString()}
                      onChangeText={(text) => {
                        const numericValue = parseFloat(text.replace(/[^0-9.]/g, "")) || 0;
                        setFormData({ ...formData, price: numericValue });
                      }}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      KDV Oranı (%)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={formData.tax_rate !== undefined && formData.tax_rate !== null ? formData.tax_rate.toString() : ""}
                      onChangeText={(text) => {
                        // Allow empty string for deletion
                        if (text === "" || text === ".") {
                          setFormData({ ...formData, tax_rate: 0 });
                          return;
                        }
                        const numericValue = parseFloat(text.replace(/[^0-9.]/g, ""));
                        if (!isNaN(numericValue)) {
                          setFormData({ ...formData, tax_rate: numericValue });
                        }
                      }}
                      placeholder="20"
                      placeholderTextColor={theme.colors.gray500}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Calculated Totals */}
                <View style={styles.formGroup}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      KDV Tutarı:
                    </Text>
                    <Text style={[styles.totalAmount, { color: theme.colors.text }]}>
                      {taxAmount.toFixed(2)} ₺
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[styles.label, { color: theme.colors.text, fontSize: 18, fontWeight: "600" }]}>
                      Toplam:
                    </Text>
                    <Text style={[styles.totalAmount, { color: theme.colors.primary, fontSize: 20, fontWeight: "700" }]}>
                      {totalAmount.toFixed(2)} ₺
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Geçerlilik Tarihi
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={handleDatePickerOpen}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.validity_date
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}
                    >
                      {formData.validity_date
                        ? new Date(formData.validity_date + "T00:00:00").toLocaleDateString("tr-TR")
                        : "Tarih seçin"}
                    </Text>
                    <Icon name="event" size={24} color={theme.colors.gray500} />
                  </TouchableOpacity>
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
                        "Teklif durumunu seçin",
                        statusOptions.map((status) => ({
                          text: statusLabels[status],
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
                      {formData.status ? statusLabels[formData.status] : "Durum seçin"}
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
                    placeholder="Ek notlar"
                    placeholderTextColor={theme.colors.gray500}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </ScrollView>

          {viewingQuote ? (
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
                  if (viewingQuote) {
                    handleEditQuote(viewingQuote);
                  }
                }}
              >
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
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.gray200 },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setViewingQuote(null);
                  setEditingQuote(null);
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
                onPress={handleSaveQuote}
              >
                <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Customer Selection Modal */}
          {customerModalVisible && (
            <View style={styles.employeeModalWrapper}>
              <View
                style={[
                  styles.employeeModal,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.employeeModalHeader}>
                  <Text style={[styles.employeeModalTitle, { color: theme.colors.text }]}>
                    Müşteri Seç
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCustomerModalVisible(false);
                      setCustomerSearchQuery("");
                    }}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.gray300,
                      margin: 16,
                    },
                  ]}
                >
                  <Icon name="search" size={20} color={theme.colors.gray500} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Müşteri ara..."
                    placeholderTextColor={theme.colors.gray500}
                    value={customerSearchQuery}
                    onChangeText={setCustomerSearchQuery}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.customerOption,
                    {
                      backgroundColor: theme.colors.background,
                      borderBottomColor: theme.colors.gray200,
                    },
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, customer_id: null, customer_name: "" });
                    setCustomerModalVisible(false);
                    setCustomerSearchQuery("");
                  }}
                >
                  <Text style={[styles.customerOptionText, { color: theme.colors.text }]}>
                    Manuel Giriş
                  </Text>
                </TouchableOpacity>

                <FlatList
                  data={filteredLeads}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.customerOption,
                        {
                          backgroundColor: theme.colors.background,
                          borderBottomColor: theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          customer_id: item.id,
                          customer_name: item.customer_name,
                        });
                        setCustomerModalVisible(false);
                        setCustomerSearchQuery("");
                      }}
                    >
                      <Text style={[styles.customerOptionText, { color: theme.colors.text }]}>
                        {item.customer_name}
                      </Text>
                      {item.phone && (
                        <Text
                          style={[
                            styles.customerOptionSubtext,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {item.phone}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Müşteri bulunamadı
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 12,
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quoteCustomerName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  quoteHeaderRight: {
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
  deleteButton: {
    padding: 4,
  },
  quoteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  quoteInfoText: {
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  employeeModal: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  employeeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  employeeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  customerOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  customerOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  customerOptionSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  datePickerContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  datePickerAbsolute: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  datePickerButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerContent: {
    flexDirection: "row",
    height: 200,
    paddingVertical: 8,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerScroll: {
    flex: 1,
    width: "100%",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
    minHeight: 48,
  },
  pickerItemText: {
    fontSize: 16,
  },
});
