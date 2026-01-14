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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getLeads } from "../../services/crmService";
import { getQuotes } from "../../services/quoteService";
import type { CRMLead, Quote } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function CustomersScreen({ navigation }: any) {
  const { user, userType } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CRMLead | null>(null);
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === "company" ? user.id : (user as any).company_id;
      const data = await getLeads(companyId);
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Hata", "Müşteriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerQuotes = async (customerId: string) => {
    if (!user) return;

    try {
      const companyId = userType === "company" ? user.id : (user as any).company_id;
      const quotes = await getQuotes(companyId, undefined, customerId);
      // Also filter by customer_name in case customer_id doesn't match
      const filteredQuotes = quotes.filter(
        (quote) => quote.customer_id === customerId || quote.customer_name === selectedCustomer?.customer_name
      );
      setCustomerQuotes(filteredQuotes);
    } catch (error) {
      console.error("Error loading customer quotes:", error);
    }
  };

  const handleViewCustomer = async (customer: CRMLead) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
    if (customer.id) {
      await loadCustomerQuotes(customer.id);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Satış Yapıldı":
        return theme.colors.success || "#10B981";
      case "Takipte":
        return theme.colors.warning || "#F59E0B";
      case "Reddedildi":
        return theme.colors.error || "#EF4444";
      default:
        return theme.colors.info || "#3B82F6";
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return theme.colors.success || "#10B981";
      case "sent":
        return theme.colors.info || "#3B82F6";
      case "rejected":
        return theme.colors.error || "#EF4444";
      case "expired":
        return theme.colors.gray500 || "#6B7280";
      default:
        return theme.colors.gray500 || "#6B7280";
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Taslak",
      sent: "Gönderildi",
      accepted: "Kabul Edildi",
      rejected: "Reddedildi",
      expired: "Süresi Doldu",
    };
    return labels[status] || status;
  };

  const renderCustomer = ({ item }: { item: CRMLead }) => (
    <TouchableOpacity
      style={[styles.customerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}
      onPress={() => handleViewCustomer(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: theme.colors.text }]}>{item.customer_name}</Text>
          {item.contact_name && (
            <Text style={[styles.contactName, { color: theme.colors.textSecondary }]}>
              {item.contact_name}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.customerDetails}>
        {item.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color={theme.colors.gray500} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.detailRow}>
            <Icon name="email" size={16} color={theme.colors.gray500} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{item.email}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderQuote = ({ item }: { item: Quote }) => (
    <View style={[styles.quoteCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray200 }]}>
      <View style={styles.quoteHeader}>
        <Text style={[styles.quoteProduct, { color: theme.colors.text }]}>
          {item.product_service || "Ürün/Hizmet"}
        </Text>
        <View style={[styles.quoteStatusBadge, { backgroundColor: getQuoteStatusColor(item.status) + "20" }]}>
          <Text style={[styles.quoteStatusText, { color: getQuoteStatusColor(item.status) }]}>
            {getQuoteStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.quoteDetails}>
        <Text style={[styles.quotePrice, { color: theme.colors.text }]}>
          {item.total_amount.toFixed(2)} ₺
        </Text>
        {item.validity_date && (
          <Text style={[styles.quoteDate, { color: theme.colors.textSecondary }]}>
            Geçerlilik: {new Date(item.validity_date + "T00:00:00").toLocaleDateString("tr-TR")}
          </Text>
        )}
      </View>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Müşteriler</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, marginTop: 8 }]}>
        <Icon name="search" size={20} color={theme.colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
          placeholder="Müşteri ara..."
          placeholderTextColor={theme.colors.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? "Müşteri bulunamadı" : "Henüz müşteri yok"}
            </Text>
          </View>
        }
      />

      {/* Customer Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
          edges={["left", "right", "top"]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.colors.gray200,
                paddingTop: Math.max(insets.top - 10, 12),
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setDetailModalVisible(false);
                setSelectedCustomer(null);
                setCustomerQuotes([]);
              }}
              style={styles.modalBackButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Müşteri Detayı</Text>
            <View style={styles.modalBackButton} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedCustomer && (
              <>
                {/* Customer Info */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Müşteri Bilgileri</Text>
                  <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Müşteri Adı:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.customer_name}</Text>
                    </View>
                    {selectedCustomer.contact_name && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>İletişim Kişisi:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.contact_name}</Text>
                      </View>
                    )}
                    {selectedCustomer.phone && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Telefon:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.phone}</Text>
                      </View>
                    )}
                    {selectedCustomer.email && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>E-posta:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.email}</Text>
                      </View>
                    )}
                    {selectedCustomer.tc_no && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>TC No:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.tc_no}</Text>
                      </View>
                    )}
                    {selectedCustomer.tax_no && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Vergi No:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.tax_no}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Durum:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCustomer.status) + "20" }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedCustomer.status) }]}>
                          {selectedCustomer.status}
                        </Text>
                      </View>
                    </View>
                    {selectedCustomer.notes && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Notlar:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedCustomer.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Customer Quotes */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Teklifler ({customerQuotes.length})
                  </Text>
                  {customerQuotes.length > 0 ? (
                    <FlatList
                      data={customerQuotes}
                      renderItem={renderQuote}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      ListEmptyComponent={null}
                    />
                  ) : (
                    <View style={styles.emptyQuotesContainer}>
                      <Icon name="description" size={48} color={theme.colors.gray400} />
                      <Text style={[styles.emptyQuotesText, { color: theme.colors.textSecondary }]}>
                        Bu müşteriye henüz teklif gönderilmemiş
                      </Text>
                    </View>
                  )}
                </View>
              </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
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
  customerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
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
  customerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
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
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    flex: 2,
    textAlign: "right",
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quoteProduct: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  quoteStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  quoteDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  quoteDate: {
    fontSize: 12,
  },
  emptyQuotesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyQuotesText: {
    fontSize: 14,
    marginTop: 12,
  },
});
