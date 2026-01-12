import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {CommissionPayment} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function CommissionsScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [commissions, setCommissions] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommissions();
  }, [user]);

  const loadCommissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;

      let query = supabase
        .from('commission_payments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', {ascending: false});

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const {data, error} = await query;

      if (!error && data) {
        setCommissions(data);
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  };

  const renderCommission = ({item}: {item: CommissionPayment}) => (
    <View style={[styles.commissionCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.commissionHeader}>
        <Icon name="attach-money" size={24} color={theme.colors.primary} />
        <View style={styles.commissionInfo}>
          <Text style={[styles.commissionAmount, {color: theme.colors.text}]}>
            {item.commission_amount} ₺
          </Text>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.payment_status) + '20'}]}>
            <Text style={[styles.statusText, {color: getStatusColor(item.payment_status)}]}>
              {item.payment_status}
            </Text>
          </View>
        </View>
      </View>
      {item.payment_date && (
        <Text style={[styles.paymentDate, {color: theme.colors.textSecondary}]}>
          Paid: {new Date(item.payment_date).toLocaleDateString()}
        </Text>
      )}
      {item.notes && (
        <Text style={[styles.commissionNotes, {color: theme.colors.textSecondary}]}>
          {item.notes}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={commissions}
        renderItem={renderCommission}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCommissions} tintColor={theme.colors.primary} />
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
  commissionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentDate: {
    fontSize: 12,
    marginTop: 4,
  },
  commissionNotes: {
    fontSize: 14,
    marginTop: 8,
  },
});

