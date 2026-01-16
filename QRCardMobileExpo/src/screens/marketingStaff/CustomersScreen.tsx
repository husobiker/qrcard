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
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getLeads,
  updateLead,
  type CRMLeadFormData,
} from "../../services/crmService";
import type { CRMLead, Employee, CRMLeadStatus } from "../../types";
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

const isNewCustomer = (lead: CRMLead) => {
  // Sadece durum "Yeni" ise "Yeni" rozeti göster
  return lead.status === "Yeni";
};

export default function MarketingStaffCustomersScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingLead, setViewingLead] = useState<CRMLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CRMLeadStatus | "Tümü">("Tümü");

  useEffect(() => {
    if (employee) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id || !employee.id) return;

    setLoading(true);
    try {
      // Load only leads assigned to this employee
      const leadsData = await getLeads(
        employee.company_id,
        employee.id,
        undefined
      );
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewLead = (lead: CRMLead) => {
    setViewingLead(lead);
  };

  const handleUpdateStatus = (lead: CRMLead) => {
    Alert.alert(
      "Durum Güncelle",
      "Yeni durumu seçin:",
      statusOptions.map((status) => ({
        text: status,
        onPress: async () => {
          try {
            const updated = await updateLead(lead.id, { status });
            if (updated) {
              await loadData();
              if (viewingLead && viewingLead.id === lead.id) {
                setViewingLead(updated);
              }
              Alert.alert("Başarılı", "Müşteri durumu güncellendi");
            } else {
              Alert.alert("Hata", "Durum güncellenemedi");
            }
          } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Hata", "Durum güncellenemedi");
          }
        },
      })).concat([{ text: "İptal", style: "cancel" }])
    );
  };

  const handleCall = async (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert("Hata", "Telefon numarası bulunamadı");
      return;
    }

    // TODO: Sanal santral entegrasyonu eklendiğinde bu kısım güncellenecek
    // Şimdilik normal telefon araması yapılıyor
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Hata", "Telefon araması başlatılamadı");
      }
    } catch (error) {
      console.error("Error making call:", error);
      Alert.alert("Hata", "Telefon araması başlatılamadı");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    // Durum filtresi
    const statusMatch = selectedStatus === "Tümü" || lead.status === selectedStatus;
    
    // Arama filtresi
    const searchMatch =
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  const renderLead = ({ item }: { item: CRMLead }) => {
    const isNew = isNewCustomer(item);
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
            {item.customer_name || item.contact_name || "İsimsiz Müşteri"}
          </Text>
          <View style={styles.leadHeaderRight}>
            {isNew && (
              <View
                style={[
                  styles.newBadge,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Text style={styles.newBadgeText}>Yeni</Text>
              </View>
            )}
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
          </View>
        </View>
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
        {item.address && (
          <View style={styles.leadInfo}>
            <Icon name="location-on" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.leadInfoText, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.address}
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
            Müşterilerim
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Size atanan müşteriler ({leads.length})
          </Text>
        </View>
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

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  selectedStatus === "Tümü"
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  selectedStatus === "Tümü"
                    ? theme.colors.primary
                    : theme.colors.gray300,
              },
            ]}
            onPress={() => setSelectedStatus("Tümü")}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    selectedStatus === "Tümü"
                      ? "#FFFFFF"
                      : theme.colors.text,
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
                styles.filterButton,
                {
                  backgroundColor:
                    selectedStatus === status
                      ? getStatusColor(status)
                      : theme.colors.surface,
                  borderColor:
                    selectedStatus === status
                      ? getStatusColor(status)
                      : theme.colors.gray300,
                },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color:
                      selectedStatus === status
                        ? "#FFFFFF"
                        : theme.colors.text,
                  },
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
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
              refreshing={refreshing}
              onRefresh={onRefresh}
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
                Henüz size atanan müşteri bulunmuyor
              </Text>
            </View>
          }
        />
      )}

      {/* Lead Detail Modal */}
      {viewingLead && (
        <Modal
          visible={!!viewingLead}
          animationType="slide"
          onRequestClose={() => setViewingLead(null)}
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
                  onPress={() => setViewingLead(null)}
                  style={styles.modalBackButton}
                >
                  <Icon name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Müşteri Detayı
                </Text>
                <TouchableOpacity
                  onPress={() => setViewingLead(null)}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            <ScrollView style={styles.modalContent}>
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
                  <View style={styles.phoneContainer}>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary, flex: 1 },
                      ]}
                    >
                      {viewingLead.phone}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.callButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => handleCall(viewingLead.phone!)}
                    >
                      <Icon name="phone" size={20} color="#FFFFFF" />
                      <Text style={styles.callButtonText}>Ara</Text>
                    </TouchableOpacity>
                  </View>
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

              <View style={styles.actionButtonsContainer}>
                {viewingLead.phone && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.success || "#10B981" },
                    ]}
                    onPress={() => handleCall(viewingLead.phone!)}
                  >
                    <Icon name="phone" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Müşteriyi Ara</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => handleUpdateStatus(viewingLead)}
                >
                  <Icon name="update" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Durumu Güncelle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  leadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leadName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  leadHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  leadInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  leadInfoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 24,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
