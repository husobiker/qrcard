import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {supabase} from '../../services/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function DashboardScreen({navigation}: any) {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const {t} = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    crm: 0,
    tasks: 0,
    appointments: 0,
    vehicles: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;

      // Get CRM leads count
      const {count: crmCount} = await supabase
        .from('crm_leads')
        .select('*', {count: 'exact', head: true})
        .eq('company_id', companyId);

      // Get tasks count
      const {count: tasksCount} = await supabase
        .from('tasks')
        .select('*', {count: 'exact', head: true})
        .eq('company_id', companyId)
        .neq('status', 'completed');

      // Get appointments count
      const {count: appointmentsCount} = await supabase
        .from('appointments')
        .select('*', {count: 'exact', head: true})
        .eq('company_id', companyId)
        .eq('status', 'pending');

      // Get vehicles count
      const {count: vehiclesCount} = await supabase
        .from('vehicles')
        .select('*', {count: 'exact', head: true})
        .eq('company_id', companyId)
        .eq('status', 'active');

      setStats({
        crm: crmCount || 0,
        tasks: tasksCount || 0,
        appointments: appointmentsCount || 0,
        vehicles: vehiclesCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({title, value, icon, color, onPress}: any) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}>
      <View style={[styles.statIconContainer, {backgroundColor: color + '20'}]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, {color: theme.colors.text}]}>{value}</Text>
      <Text style={[styles.statTitle, {color: theme.colors.textSecondary}]}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickAction = ({title, icon, onPress}: any) => (
    <TouchableOpacity
      style={[
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}>
      <Icon name={icon} size={24} color={theme.colors.primary} />
      <Text style={[styles.quickActionText, {color: theme.colors.text}]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={theme.colors.primary} />
      }>
      <View style={styles.content}>
        <Text style={[styles.welcomeText, {color: theme.colors.text}]}>
          Welcome, {userType === 'company' ? (user as any).name : `${(user as any).first_name} ${(user as any).last_name}`}
        </Text>

        <View style={styles.statsContainer}>
          <StatCard
            title="CRM Leads"
            value={stats.crm}
            icon="people"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('CRM')}
          />
          <StatCard
            title="Tasks"
            value={stats.tasks}
            icon="check-circle"
            color={theme.colors.secondary}
            onPress={() => navigation.navigate('Tasks')}
          />
          <StatCard
            title="Appointments"
            value={stats.appointments}
            icon="calendar-today"
            color={theme.colors.warning}
            onPress={() => navigation.navigate('Calendar')}
          />
          <StatCard
            title="Vehicles"
            value={stats.vehicles}
            icon="directions-car"
            color={theme.colors.info}
            onPress={() => navigation.navigate('Vehicles')}
          />
        </View>

        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            title="Goals"
            icon="flag"
            onPress={() => navigation.navigate('Goals')}
          />
          <QuickAction
            title="Transactions"
            icon="account-balance-wallet"
            onPress={() => navigation.navigate('Transactions')}
          />
          <QuickAction
            title="Communications"
            icon="message"
            onPress={() => navigation.navigate('Communications')}
          />
          <QuickAction
            title="Commissions"
            icon="attach-money"
            onPress={() => navigation.navigate('Commissions')}
          />
          {userType === 'company' && (
            <QuickAction
              title="Employees"
              icon="people-outline"
              onPress={() => navigation.navigate('Employees')}
            />
          )}
          <QuickAction
            title="Reports"
            icon="assessment"
            onPress={() => navigation.navigate('Reports')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

