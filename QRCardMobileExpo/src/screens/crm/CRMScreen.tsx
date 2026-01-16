import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {getLeads, deleteLead, updateLead} from '../../services/crmService';
import {getQuotes} from '../../services/quoteService';
import {supabase} from '../../services/supabase';
import type {CRMLead, CRMLeadStatus, Quote} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

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

export default function CRMScreen() {
  const {user, userType} = useAuth();
  const {theme, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingLead, setViewingLead] = useState<CRMLead | null>(null);
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [previousViewingLead, setPreviousViewingLead] = useState<CRMLead | null>(null);
  const [wasModalVisible, setWasModalVisible] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [user]);

  // Müşteri detay sayfası açıldığında ve teklifler yüklendiğinde kontrol yap
  useEffect(() => {
    if (modalVisible && viewingLead && customerQuotes.length > 0) {
      const hasAcceptedQuote = customerQuotes.some(quote => quote.status === 'accepted');
      if (hasAcceptedQuote && viewingLead.status !== 'Satış Yapıldı') {
        console.log('useEffect: Found accepted quote, updating customer status');
        // Direkt olarak güncelleme yap, loadCustomerQuotes'u tekrar çağırma
        const updateCustomerStatus = async () => {
          try {
            const updated = await updateLead(viewingLead.id, { status: 'Satış Yapıldı' });
            if (updated) {
              console.log('useEffect: Customer status updated successfully:', updated.id, updated.status);
              setViewingLead({ ...updated });
              await loadLeads();
            }
          } catch (error) {
            console.error('useEffect: Error updating customer status:', error);
            // Hata durumunda da state'i güncelle
            setViewingLead({ ...viewingLead, status: 'Satış Yapıldı' });
          }
        };
        updateCustomerStatus();
      }
    }
  }, [modalVisible, viewingLead?.id, customerQuotes.length]);

  // Teklif detay modalı açıldığında müşteri detay modalını kapat
  useEffect(() => {
    if (viewingQuote) {
      if (viewingLead && modalVisible) {
        setPreviousViewingLead(viewingLead);
        setWasModalVisible(true);
        setModalVisible(false);
      }
    } else {
      // Teklif detay modalı kapandığında müşteri detay modalını tekrar aç
      if (previousViewingLead && wasModalVisible) {
        setTimeout(() => {
          setViewingLead(previousViewingLead);
          setModalVisible(true);
          setPreviousViewingLead(null);
          setWasModalVisible(false);
        }, 100);
      }
    }
  }, [viewingQuote]);

  const loadLeads = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;
      const data = await getLeads(companyId, employeeId);
      
      // Tüm "accepted" durumundaki teklifleri yükle
      const allQuotes = await getQuotes(companyId);
      const acceptedQuotes = allQuotes.filter(quote => quote.status === 'accepted');
      
      console.log('Checking customers for accepted quotes:', {
        totalCustomers: data.length,
        acceptedQuotesCount: acceptedQuotes.length,
        acceptedQuotes: acceptedQuotes.map(q => ({ 
          id: q.id, 
          customer_id: q.customer_id, 
          customer_name: q.customer_name,
          status: q.status 
        }))
      });
      
      // "accepted" durumunda teklifi olan müşterileri bul ve durumlarını güncelle
      const leadsToUpdate: string[] = [];
      for (const lead of data) {
        if (lead.status !== 'Satış Yapıldı') {
          const hasAcceptedQuote = acceptedQuotes.some(quote => {
            const customerIdMatch = quote.customer_id === lead.id;
            const customerNameMatch = quote.customer_name && lead.customer_name && 
              quote.customer_name.toLowerCase().trim() === lead.customer_name.toLowerCase().trim();
            
            if (customerIdMatch || customerNameMatch) {
              console.log('Found accepted quote for customer:', {
                leadId: lead.id,
                leadName: lead.customer_name,
                quoteId: quote.id,
                quoteCustomerId: quote.customer_id,
                quoteCustomerName: quote.customer_name,
                customerIdMatch,
                customerNameMatch
              });
            }
            
            return customerIdMatch || customerNameMatch;
          });
          
          if (hasAcceptedQuote) {
            leadsToUpdate.push(lead.id);
            console.log('Will update customer status:', lead.id, lead.customer_name);
          }
        }
      }
      
      console.log('Customers to update:', leadsToUpdate.length, leadsToUpdate);
      
      // Müşteri durumlarını toplu olarak güncelle
      for (const leadId of leadsToUpdate) {
        try {
          console.log('Updating customer status:', leadId);
          const updated = await updateLead(leadId, { status: 'Satış Yapıldı' });
          if (updated) {
            console.log('Customer status updated successfully:', updated.id, updated.status);
            // Local state'i güncelle
            const leadIndex = data.findIndex(l => l.id === leadId);
            if (leadIndex !== -1) {
              data[leadIndex].status = 'Satış Yapıldı';
            }
          } else {
            console.error('Failed to update customer:', leadId);
          }
        } catch (error) {
          console.error(`Error updating lead ${leadId}:`, error);
        }
      }
      
      // Sadece "Satış Yapıldı" durumundaki müşterileri göster
      const soldLeads = data.filter(lead => lead.status === 'Satış Yapıldı');
      setLeads(soldLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerQuotes = async (customerId: string, customerName?: string, lead?: CRMLead) => {
    if (!user) {
      console.log('loadCustomerQuotes: No user, returning');
      return;
    }

    console.log('loadCustomerQuotes: Starting', { customerId, customerName, leadId: lead?.id, viewingLeadId: viewingLead?.id });

    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      // Hem customer_id hem de customer_name ile teklifleri getir
      const quotesById = await getQuotes(companyId, undefined, customerId);
      const customerNameToMatch = customerName || lead?.customer_name || viewingLead?.customer_name;
      const quotesByName = customerNameToMatch ? await getQuotes(companyId, undefined, undefined, customerNameToMatch) : [];
      // İki sonucu birleştir ve tekrarları kaldır
      const allQuotes = [...quotesById, ...quotesByName];
      const uniqueQuotes = allQuotes.filter((quote, index, self) => 
        index === self.findIndex(q => q.id === quote.id)
      );
      const quotes = uniqueQuotes;
      const filteredQuotes = quotes.filter(
        (quote) => {
          const customerIdMatch = quote.customer_id === customerId;
          const customerNameMatch = customerNameToMatch && quote.customer_name && 
            quote.customer_name.toLowerCase().trim() === customerNameToMatch.toLowerCase().trim();
          return customerIdMatch || customerNameMatch;
        }
      );
      
      console.log('loadCustomerQuotes: Filtered quotes', {
        totalQuotes: quotes.length,
        filteredCount: filteredQuotes.length,
        acceptedCount: filteredQuotes.filter(q => q.status === 'accepted').length
      });
      
      setCustomerQuotes(filteredQuotes);

      // Eğer "accepted" durumunda bir teklif varsa ve müşteri durumu "Satış Yapıldı" değilse, güncelle
      const acceptedQuotes = filteredQuotes.filter(quote => quote.status === 'accepted');
      const hasAcceptedQuote = acceptedQuotes.length > 0;
      const currentLead = lead || viewingLead || leads.find(l => l.id === customerId);
      
      console.log('loadCustomerQuotes: Checking customer quotes:', {
        customerId,
        customerName: customerNameToMatch,
        hasAcceptedQuote,
        acceptedQuotesCount: acceptedQuotes.length,
        currentLeadStatus: currentLead?.status,
        currentLeadId: currentLead?.id,
        filteredQuotesCount: filteredQuotes.length,
        leadProvided: !!lead,
        viewingLeadProvided: !!viewingLead,
        acceptedQuotes: acceptedQuotes.map(q => ({ 
          id: q.id, 
          status: q.status,
          customer_id: q.customer_id,
          customer_name: q.customer_name
        }))
      });
      
      if (hasAcceptedQuote) {
        console.log('loadCustomerQuotes: Has accepted quote, checking currentLead:', {
          currentLeadExists: !!currentLead,
          currentLeadId: currentLead?.id,
          currentLeadStatus: currentLead?.status,
          customerId
        });
        
        // currentLead yoksa, customerId ile bul
        let leadToUpdate = currentLead;
        if (!leadToUpdate) {
          console.log('loadCustomerQuotes: currentLead not found, searching by customerId:', customerId);
          leadToUpdate = leads.find(l => l.id === customerId);
          if (!leadToUpdate && lead) {
            leadToUpdate = lead;
          }
        }
        
        if (leadToUpdate && leadToUpdate.status !== 'Satış Yapıldı') {
          console.log('loadCustomerQuotes: Updating customer status to "Satış Yapıldı" for customer:', customerId, customerNameToMatch);
          
          // Direkt customerId ile güncelle
          try {
            const updated = await updateLead(customerId, { status: 'Satış Yapıldı' });
            if (updated) {
              console.log('loadCustomerQuotes: Customer status updated successfully:', updated.id, updated.status);
              setViewingLead({ ...updated });
              // Liste de güncellensin
              await loadLeads();
            } else {
              console.error('loadCustomerQuotes: Failed to update customer status - updateLead returned null');
              // updateLead başarısız oldu, direkt olarak state'i güncelle
              if (leadToUpdate) {
                console.log('loadCustomerQuotes: Directly updating state for customer:', customerId);
                setViewingLead({ ...leadToUpdate, status: 'Satış Yapıldı' });
              }
            }
          } catch (error) {
            console.error('loadCustomerQuotes: Error updating customer status:', error);
            // Hata durumunda da state'i güncelle
            if (leadToUpdate) {
              console.log('loadCustomerQuotes: Directly updating state after error for customer:', customerId);
              setViewingLead({ ...leadToUpdate, status: 'Satış Yapıldı' });
            }
          }
        } else if (leadToUpdate && leadToUpdate.status === 'Satış Yapıldı') {
          console.log('loadCustomerQuotes: Customer already has "Satış Yapıldı" status');
        } else {
          console.log('loadCustomerQuotes: No lead found to update');
        }
      } else {
        console.log('loadCustomerQuotes: No accepted quote found for customer');
      }
    } catch (error) {
      console.error('Error loading customer quotes:', error);
    }
  };

  const handleDelete = async (leadId: string) => {
    Alert.alert('Delete Lead', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteLead(leadId);
          if (success) {
            loadLeads();
          }
        },
      },
    ]);
  };

  const filteredLeads = leads.filter(
    lead =>
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleViewLead = async (lead: CRMLead) => {
    setViewingLead(lead);
    setModalVisible(true);
    if (lead.id) {
      // Lead parametresini de geçir ki state güncellemesi beklensin
      await loadCustomerQuotes(lead.id, lead.customer_name, lead);
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

  const renderQuote = ({ item }: { item: Quote }) => (
    <TouchableOpacity
      style={[styles.quoteCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray200 }]}
      onPress={() => {
        setViewingQuote(item);
        if (viewingLead && modalVisible) {
          setPreviousViewingLead(viewingLead);
          setWasModalVisible(true);
          setModalVisible(false);
        }
      }}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
  );

  const renderLead = ({item}: {item: CRMLead}) => (
    <TouchableOpacity
      style={[styles.leadCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}
      onPress={() => handleViewLead(item)}
      activeOpacity={0.7}>
      <View style={styles.leadHeader}>
        <Text style={[styles.leadName, {color: theme.colors.text}]}>{item.customer_name}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
          <Text style={[styles.statusText, {color: getStatusColor(item.status)}]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.phone && (
        <View style={styles.leadInfo}>
          <Icon name="phone" size={16} color={theme.colors.gray500} />
          <Text style={[styles.leadInfoText, {color: theme.colors.textSecondary}]}>
            {item.phone}
          </Text>
        </View>
      )}
      {item.email && (
        <View style={styles.leadInfo}>
          <Icon name="email" size={16} color={theme.colors.gray500} />
          <Text style={[styles.leadInfoText, {color: theme.colors.textSecondary}]}>
            {item.email}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDelete(item.id);
        }}>
        <Icon name="delete" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={["left", "right", "top"]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, {borderBottomColor: theme.colors.gray200}]}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Satış Takibi
        </Text>
        <Text style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
          Müşteri kayıtları ve satış takibi
        </Text>
      </View>

      <View style={[styles.searchContainer, {backgroundColor: theme.colors.surface}]}>
        <Icon name="search" size={20} color={theme.colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, {color: theme.colors.text}]}
          placeholder="Müşteri ara..."
          placeholderTextColor={theme.colors.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredLeads}
        renderItem={renderLead}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeads} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="person-outline" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
              Henüz müşteri kaydı bulunmuyor
            </Text>
          </View>
        }
      />

      {/* Lead Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setViewingLead(null);
          setCustomerQuotes([]);
        }}
        presentationStyle="fullScreen"
      >
        <SafeAreaView
          style={[styles.modalContainer, {backgroundColor: theme.colors.background}]}
          edges={["left", "right", "bottom"]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.colors.gray200,
                paddingTop: insets.top,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setModalVisible(false);
                setViewingLead(null);
                setCustomerQuotes([]);
              }}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
              Müşteri Detayı
            </Text>
            <View style={styles.modalBackButton} />
          </View>

          {viewingLead && (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{paddingBottom: 32}}
            >
              {/* Customer Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Müşteri Bilgileri</Text>
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Müşteri Adı:</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.customer_name}</Text>
                  </View>
                  {viewingLead.contact_name && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>İletişim Kişisi:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.contact_name}</Text>
                    </View>
                  )}
                  {viewingLead.phone && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Telefon:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.phone}</Text>
                    </View>
                  )}
                  {viewingLead.email && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>E-posta:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.email}</Text>
                    </View>
                  )}
                  {viewingLead.tc_no && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>TC No:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.tc_no}</Text>
                    </View>
                  )}
                  {viewingLead.tax_no && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Vergi No:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.tax_no}</Text>
                    </View>
                  )}
                  {viewingLead.address && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Adres:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.address}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Durum:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(viewingLead.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(viewingLead.status) }]}>
                        {viewingLead.status}
                      </Text>
                    </View>
                  </View>
                  {viewingLead.notes && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Notlar:</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{viewingLead.notes}</Text>
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
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Quote Detail Modal - Using same structure as RegionalManager */}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  leadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 40,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  leadInfoText: {
    fontSize: 14,
  },
  deleteButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flexGrow: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteProduct: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  quoteStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  quoteDate: {
    fontSize: 12,
  },
  emptyQuotesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyQuotesText: {
    fontSize: 14,
    marginTop: 12,
  },
});

