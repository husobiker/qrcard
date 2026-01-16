import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {getLeads} from '../../services/crmService';
import {getCallLogs} from '../../services/callLogService';
import {getEmployeeSipSettings} from '../../services/sipSettingsService';
import {getCompanyById} from '../../services/companyService';
import CallInterface from '../../components/CallInterface';
import type {Employee, CRMLead, CallLog, EmployeeSipSettings, Company} from '../../types';

export default function CallCenterSearchCallScreen() {
  const {user} = useAuth();
  const {theme} = useTheme();
  const employee = user as Employee;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CRMLead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CRMLead | null>(null);
  const [employeeSipSettings, setEmployeeSipSettings] = useState<EmployeeSipSettings | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (employee) {
      loadData();
      loadSipSettings();
      loadCompany();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      // Load call logs
      const logs = await getCallLogs(employee.company_id, employee.id);
      setCallLogs(logs);
    } catch (error) {
      console.error('Error loading data:', error);
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
      console.error('Error loading SIP settings:', error);
    }
  };

  const loadCompany = async () => {
    if (!employee || !employee.company_id) return;
    try {
      const companyData = await getCompanyById(employee.company_id);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !phoneNumber.trim()) {
      Alert.alert('Uyarı', 'Lütfen telefon numarası veya müşteri adı girin');
      return;
    }

    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      const leads = await getLeads(employee.company_id);
      
      // Filter by phone number or customer name
      const filtered = leads.filter(lead => {
        const phoneMatch = phoneNumber.trim() 
          ? lead.phone?.includes(phoneNumber.trim().replace(/\s+/g, ''))
          : false;
        const nameMatch = searchQuery.trim()
          ? lead.customer_name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
          : false;
        return phoneMatch || nameMatch;
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Hata', 'Arama yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (customer?: CRMLead) => {
    if (!employeeSipSettings) {
      Alert.alert('Hata', 'SIP ayarları bulunamadı. Lütfen yöneticinizle iletişime geçin.');
      return;
    }

    if (customer) {
      setSelectedCustomer(customer);
      setPhoneNumber(customer.phone || '');
    } else if (!phoneNumber.trim()) {
      Alert.alert('Uyarı', 'Lütfen telefon numarası girin');
      return;
    }

    setShowCallInterface(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallLog = ({item}: {item: CallLog}) => (
    <View
      style={[
        styles.callLogCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}>
      <View style={styles.callLogHeader}>
        <Icon
          name={item.call_type === 'outgoing' ? 'call-made' : item.call_type === 'incoming' ? 'call-received' : 'call-missed'}
          size={24}
          color={
            item.call_type === 'outgoing'
              ? theme.colors.info
              : item.call_type === 'incoming'
              ? theme.colors.success
              : theme.colors.error
          }
        />
        <View style={styles.callLogInfo}>
          <Text style={[styles.phoneNumber, {color: theme.colors.text}]}>
            {item.phone_number}
          </Text>
          {item.customer_name && (
            <Text style={[styles.customerName, {color: theme.colors.textSecondary}]}>
              {item.customer_name}
            </Text>
          )}
        </View>
        <Text style={[styles.duration, {color: theme.colors.textSecondary}]}>
          {formatDuration(item.call_duration)}
        </Text>
      </View>
      <Text style={[styles.callTime, {color: theme.colors.textSecondary}]}>
        {new Date(item.call_start_time).toLocaleString('tr-TR')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Müşteri Arama
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <View style={styles.searchSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, {color: theme.colors.text}]}>
                Telefon Numarası
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="05551234567"
                placeholderTextColor={theme.colors.gray500}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, {color: theme.colors.text}]}>
                Müşteri Adı (Opsiyonel)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Müşteri adı"
                placeholderTextColor={theme.colors.gray500}
              />
            </View>

            <TouchableOpacity
              style={[styles.searchButton, {backgroundColor: theme.colors.primary}]}
              onPress={handleSearch}
              disabled={loading}>
              <Icon name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Ara</Text>
            </TouchableOpacity>

            {phoneNumber.trim() && (
              <TouchableOpacity
                style={[
                  styles.callButton,
                  {
                    backgroundColor: theme.colors.success,
                    opacity: employeeSipSettings ? 1 : 0.5,
                  },
                ]}
                onPress={() => handleCall()}
                disabled={!employeeSipSettings || loading}>
                <Icon name="phone" size={20} color="#fff" />
                <Text style={styles.callButtonText}>Ara</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Arama Sonuçları ({searchResults.length})
              </Text>
              {searchResults.map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.gray200,
                    },
                  ]}
                  onPress={() => handleCall(customer)}>
                  <View style={styles.customerInfo}>
                    <Text style={[styles.customerName, {color: theme.colors.text}]}>
                      {customer.customer_name}
                    </Text>
                    {customer.phone && (
                      <Text style={[styles.customerPhone, {color: theme.colors.textSecondary}]}>
                        {customer.phone}
                      </Text>
                    )}
                  </View>
                  <Icon name="phone" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Call Logs Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Arama Geçmişi
          </Text>
          {callLogs.length === 0 ? (
            <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
              Henüz arama geçmişi yok
            </Text>
          ) : (
            <FlatList
              data={callLogs.slice(0, 10)}
              renderItem={renderCallLog}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Call Interface Modal */}
      {showCallInterface && employeeSipSettings && employee && company && (
        <CallInterface
          employeeSipSettings={employeeSipSettings}
          company={company}
          phoneNumber={phoneNumber}
          customerName={selectedCustomer?.customer_name || ''}
          customerId={selectedCustomer?.id || null}
          companyId={employee.company_id}
          employeeId={employee.id}
          onClose={() => {
            setShowCallInterface(false);
            setSelectedCustomer(null);
            loadData(); // Refresh call logs
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchSection: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
  },
  callLogCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  callLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  callLogInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  callTime: {
    fontSize: 12,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
});
