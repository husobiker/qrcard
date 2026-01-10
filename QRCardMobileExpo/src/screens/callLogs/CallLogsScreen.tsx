import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {CallLog} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CallLogsScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCallLogs();
  }, [user]);

  const loadCallLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;

      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('call_start_time', {ascending: false});

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const {data, error} = await query;

      if (!error && data) {
        setCallLogs(data);
      }
    } catch (error) {
      console.error('Error loading call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'call-received';
      case 'outgoing':
        return 'call-made';
      default:
        return 'call-missed';
    }
  };

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return theme.colors.success;
      case 'outgoing':
        return theme.colors.info;
      default:
        return theme.colors.error;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallLog = ({item}: {item: CallLog}) => (
    <View style={[styles.callLogCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.callLogHeader}>
        <Icon
          name={getCallTypeIcon(item.call_type)}
          size={24}
          color={getCallTypeColor(item.call_type)}
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
        {new Date(item.call_start_time).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={callLogs}
        renderItem={renderCallLog}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCallLogs} tintColor={theme.colors.primary} />
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
  callLogCard: {
    padding: 16,
    borderRadius: 12,
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
  },
  customerName: {
    fontSize: 14,
    marginTop: 2,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
  callTime: {
    fontSize: 12,
  },
});

