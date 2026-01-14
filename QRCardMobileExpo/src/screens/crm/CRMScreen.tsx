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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {getLeads, deleteLead} from '../../services/crmService';
import type {CRMLead} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function CRMScreen() {
  const {user, userType} = useAuth();
  const {theme, isDark} = useTheme();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;
      const data = await getLeads(companyId, employeeId);
      setLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Satış Yapıldı':
        return theme.colors.success;
      case 'Takipte':
        return theme.colors.warning;
      case 'Reddedildi':
        return theme.colors.error;
      default:
        return theme.colors.info;
    }
  };

  const renderLead = ({item}: {item: CRMLead}) => (
    <TouchableOpacity
      style={[styles.leadCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
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
        onPress={() => handleDelete(item.id)}>
        <Icon name="delete" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.searchContainer, {backgroundColor: theme.colors.surface}]}>
        <Icon name="search" size={20} color={theme.colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, {color: theme.colors.text}]}
          placeholder="Search leads..."
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
  },
  leadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
});

