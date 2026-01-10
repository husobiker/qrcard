import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Report {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

export default function ReportsScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // For now, we'll create a simple list of report types
      // In a real app, this would fetch from a reports table
      const reportTypes = [
        {id: '1', title: 'Sales Report', type: 'sales', created_at: new Date().toISOString()},
        {id: '2', title: 'Performance Report', type: 'performance', created_at: new Date().toISOString()},
        {id: '3', title: 'Commission Report', type: 'commission', created_at: new Date().toISOString()},
      ];
      setReports(reportTypes);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReport = ({item}: {item: Report}) => (
    <TouchableOpacity
      style={[styles.reportCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
      <View style={styles.reportHeader}>
        <Icon name="assessment" size={24} color={theme.colors.primary} />
        <View style={styles.reportInfo}>
          <Text style={[styles.reportTitle, {color: theme.colors.text}]}>{item.title}</Text>
          <Text style={[styles.reportType, {color: theme.colors.textSecondary}]}>
            {item.type}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.gray400} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadReports} tintColor={theme.colors.primary} />
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
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reportType: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
});

