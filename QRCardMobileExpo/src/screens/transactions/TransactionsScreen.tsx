import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {Transaction} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function TransactionsScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('transaction_date', {ascending: false});

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const {data, error} = await query;

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = ({item}: {item: Transaction}) => (
    <View style={[styles.transactionCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.transactionHeader}>
        <Icon
          name={item.transaction_type === 'income' ? 'arrow-upward' : 'arrow-downward'}
          size={24}
          color={item.transaction_type === 'income' ? theme.colors.success : theme.colors.error}
        />
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionCategory, {color: theme.colors.text}]}>
            {item.category}
          </Text>
          <Text style={[styles.transactionDate, {color: theme.colors.textSecondary}]}>
            {new Date(item.transaction_date).toLocaleDateString()}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: item.transaction_type === 'income' ? theme.colors.success : theme.colors.error,
            },
          ]}>
          {item.transaction_type === 'income' ? '+' : '-'}
          {item.amount} {item.currency}
        </Text>
      </View>
      {item.description && (
        <Text style={[styles.transactionDescription, {color: theme.colors.textSecondary}]}>
          {item.description}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} tintColor={theme.colors.primary} />
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
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 14,
    marginTop: 8,
  },
});

