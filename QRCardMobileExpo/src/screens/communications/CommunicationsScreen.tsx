import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {CustomerCommunication} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function CommunicationsScreen() {
  const {user, userType} = useAuth();
  const {theme, isDark} = useTheme();
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommunications();
  }, [user]);

  const loadCommunications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;

      let query = supabase
        .from('customer_communications')
        .select('*')
        .eq('company_id', companyId)
        .order('communication_date', {ascending: false});

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const {data, error} = await query;

      if (!error && data) {
        setCommunications(data);
      }
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return 'email';
      case 'phone':
        return 'phone';
      case 'meeting':
        return 'event';
      case 'sms':
        return 'message';
      default:
        return 'chat';
    }
  };

  const renderCommunication = ({item}: {item: CustomerCommunication}) => (
    <View style={[styles.communicationCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.communicationHeader}>
        <Icon name={getTypeIcon(item.communication_type)} size={24} color={theme.colors.primary} />
        <View style={styles.communicationInfo}>
          <Text style={[styles.communicationName, {color: theme.colors.text}]}>
            {item.customer_name}
          </Text>
          <Text style={[styles.communicationType, {color: theme.colors.textSecondary}]}>
            {item.communication_type}
          </Text>
        </View>
        <Text style={[styles.communicationDate, {color: theme.colors.textSecondary}]}>
          {new Date(item.communication_date).toLocaleDateString()}
        </Text>
      </View>
      {item.subject && (
        <Text style={[styles.communicationSubject, {color: theme.colors.text}]}>
          {item.subject}
        </Text>
      )}
      {item.notes && (
        <Text style={[styles.communicationNotes, {color: theme.colors.textSecondary}]}>
          {item.notes}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={communications}
        renderItem={renderCommunication}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCommunications} tintColor={theme.colors.primary} />
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
  listContent: {
    padding: 16,
  },
  communicationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  communicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  communicationInfo: {
    flex: 1,
  },
  communicationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  communicationType: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  communicationDate: {
    fontSize: 12,
  },
  communicationSubject: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  communicationNotes: {
    fontSize: 14,
  },
});

