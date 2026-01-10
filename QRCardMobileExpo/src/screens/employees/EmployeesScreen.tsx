import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {Employee} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function EmployeesScreen() {
  const {user} = useAuth();
  const {theme} = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = user.id;

      const {data, error} = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', {ascending: false});

      if (!error && data) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEmployee = ({item}: {item: Employee}) => (
    <TouchableOpacity
      style={[styles.employeeCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.employeeHeader}>
        {item.profile_image_url ? (
          <View style={[styles.avatar, {backgroundColor: theme.colors.primary}]}>
            <Text style={styles.avatarText}>
              {item.first_name[0]}{item.last_name[0]}
            </Text>
          </View>
        ) : (
          <Icon name="person" size={40} color={theme.colors.primary} />
        )}
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, {color: theme.colors.text}]}>
            {item.first_name} {item.last_name}
          </Text>
          {item.job_title && (
            <Text style={[styles.jobTitle, {color: theme.colors.textSecondary}]}>
              {item.job_title}
            </Text>
          )}
        </View>
        <Icon name="qr-code" size={24} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEmployees} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

