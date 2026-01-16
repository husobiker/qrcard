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
import { getLeads, updateLead } from "../../services/crmService";
import { getQuotes } from "../../services/quoteService";
import { supabase } from "../../services/supabase";
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

  // Müşteri detay sayfası açıldığında ve teklifler yüklendiğinde kontrol yap
  useEffect(() => {
    if (detailModalVisible && selectedCustomer && customerQuotes.length > 0) {
      const hasAcceptedQuote = customerQuotes.some(quote => quote.status === 'accepted');
      if (hasAcceptedQuote && selectedCustomer.status !== 'Satış Yapıldı') {
        console.log('useEffect: Found accepted quote, updating customer status');
        // Direkt olarak güncelleme yap, loadCustomerQuotes'u tekrar çağırma
        const updateCustomerStatus = async () => {
          try {
            const updated = await updateLead(selectedCustomer.id, { status: 'Satış Yapıldı' });
            if (updated) {
              console.log('useEffect: Customer status updated successfully:', updated.id, updated.status);
              setSelectedCustomer(updated);
              await loadCustomers();
            }
          } catch (error) {
            console.error('useEffect: Error updating customer status:', error);
            // Hata durumunda da state'i güncelle
            setSelectedCustomer({ ...selectedCustomer, status: 'Satış Yapıldı' });
          }
        };
        updateCustomerStatus();
      }
    }
  }, [detailModalVisible, selectedCustomer?.id, customerQuotes.length]);

  const loadCustomers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === "company" ? user.id : (user as any).company_id;
      const data = await getLeads(companyId);
      
      // Tüm "accepted" durumundaki teklifleri yükle
      const allQuotes = await getQuotes(companyId);
      const acceptedQuotes = allQuotes.filter(quote => quote.status === 'accepted');
      
      // "accepted" durumunda teklifi olan müşterileri bul ve durumlarını güncelle
      const customersToUpdate: string[] = [];
      for (const customer of data) {
        if (customer.status !== 'Satış Yapıldı') {
          const hasAcceptedQuote = acceptedQuotes.some(quote => 
            (quote.customer_id === customer.id) || 
            (quote.customer_name && customer.customer_name && 
             quote.customer_name.toLowerCase().trim() === customer.customer_name.toLowerCase().trim())
          );
          
          if (hasAcceptedQuote) {
            customersToUpdate.push(customer.id);
          }
        }
      }
      
      // Müşteri durumlarını toplu olarak güncelle
      for (const customerId of customersToUpdate) {
        try {
          await updateLead(customerId, { status: 'Satış Yapıldı' });
          // Local state'i güncelle
          const customerIndex = data.findIndex(c => c.id === customerId);
          if (customerIndex !== -1) {
            data[customerIndex].status = 'Satış Yapıldı';
          }
        } catch (error) {
          console.error(`Error updating customer ${customerId}:`, error);
        }
      }
      
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Hata", "Müşteriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerQuotes = async (customerId: string, customerName?: string, customer?: CRMLead) => {
    if (!user) return;

    try {
      const companyId = userType === "company" ? user.id : (user as any).company_id;
      // Hem customer_id hem de customer_name ile teklifleri getir
      const quotesById = await getQuotes(companyId, undefined, customerId);
      const customerNameToMatch = customerName || customer?.customer_name || selectedCustomer?.customer_name;
      const quotesByName = customerNameToMatch ? await getQuotes(companyId, undefined, undefined, customerNameToMatch) : [];
      // İki sonucu birleştir ve tekrarları kaldır
      const allQuotes = [...quotesById, ...quotesByName];
      const uniqueQuotes = allQuotes.filter((quote, index, self) => 
        index === self.findIndex(q => q.id === quote.id)
      );
      const quotes = uniqueQuotes;
      // Also filter by customer_name in case customer_id doesn't match
      const filteredQuotes = quotes.filter(
        (quote) => {
          const customerIdMatch = quote.customer_id === customerId;
          const customerNameMatch = customerNameToMatch && quote.customer_name && 
            quote.customer_name.toLowerCase().trim() === customerNameToMatch.toLowerCase().trim();
          return customerIdMatch || customerNameMatch;
        }
      );
      setCustomerQuotes(filteredQuotes);

      // Eğer "accepted" durumunda bir teklif varsa ve müşteri durumu "Satış Yapıldı" değilse, güncelle
      const acceptedQuotes = filteredQuotes.filter(quote => quote.status === 'accepted');
      const hasAcceptedQuote = acceptedQuotes.length > 0;
      const currentCustomer = customer || selectedCustomer || customers.find(c => c.id === customerId);
      
      console.log('Checking customer quotes:', {
        customerId,
        customerName: customerNameToMatch,
        hasAcceptedQuote,
        acceptedQuotesCount: acceptedQuotes.length,
        currentCustomerStatus: currentCustomer?.status,
        filteredQuotesCount: filteredQuotes.length,
        acceptedQuotes: acceptedQuotes.map(q => ({ 
          id: q.id, 
          status: q.status,
          customer_id: q.customer_id,
          customer_name: q.customer_name
        }))
      });
      
      if (hasAcceptedQuote) {
        // Her "accepted" teklif için müşteri durumunu güncelle
        for (const acceptedQuote of acceptedQuotes) {
          console.log('Processing accepted quote:', acceptedQuote.id, 'for customer:', customerId, customerNameToMatch);
          
          if (currentCustomer && currentCustomer.status !== 'Satış Yapıldı') {
            console.log('Updating customer status to "Satış Yapıldı" for customer:', customerId, customerNameToMatch);
            
            // Önce customer_id ile dene
            let updateSuccess = false;
            if (acceptedQuote.customer_id) {
              try {
                const updated = await updateLead(acceptedQuote.customer_id, { status: 'Satış Yapıldı' });
                if (updated) {
                  console.log('Customer status updated successfully by customer_id:', updated.id, updated.status);
                  setSelectedCustomer(updated);
                  updateSuccess = true;
                }
              } catch (error) {
                console.error('Error updating by customer_id:', error);
              }
            }
            
            // Eğer customer_id ile güncelleme başarısız oldu veya customer_id yoksa, customer_name ile dene
            if (!updateSuccess && acceptedQuote.customer_name && customerNameToMatch) {
              try {
                // customer_name ile müşteriyi bul
                const { data: customers } = await supabase
                  .from('crm_leads')
                  .select('id')
                  .eq('company_id', companyId)
                  .eq('customer_name', customerNameToMatch)
                  .limit(1);
                
                if (customers && customers.length > 0) {
                  const customerToUpdate = customers[0];
                  const updated = await updateLead(customerToUpdate.id, { status: 'Satış Yapıldı' });
                  if (updated) {
                    console.log('Customer status updated successfully by customer_name:', updated.id, updated.status);
                    setSelectedCustomer(updated);
                    updateSuccess = true;
                  }
                }
              } catch (error) {
                console.error('Error updating by customer_name:', error);
              }
            }
            
            // Eğer hala başarısız oldu, direkt state'i güncelle
            if (!updateSuccess && currentCustomer) {
              console.log('Directly updating state for customer:', customerId);
              setSelectedCustomer({ ...currentCustomer, status: 'Satış Yapıldı' });
            }
            
            // Liste de güncellensin
            await loadCustomers();
            break; // İlk başarılı güncellemeden sonra çık
          } else if (currentCustomer && currentCustomer.status === 'Satış Yapıldı') {
            console.log('Customer already has "Satış Yapıldı" status');
          }
        }
      } else {
        console.log('No accepted quote found for customer');
      }
    } catch (error) {
      console.error("Error loading customer quotes:", error);
    }
  };

  const handleViewCustomer = async (customer: CRMLead) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
    if (customer.id) {
      // Customer parametresini de geçir ki state güncellemesi beklensin
      await loadCustomerQuotes(customer.id, customer.customer_name, customer);
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
