import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {supabase} from '../../services/supabase';
import type {PerformanceGoal} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function GoalsScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;

      let query = supabase.from('performance_goals').select('*').eq('company_id', companyId);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const {data, error} = await query;

      if (!error && data) {
        setGoals(data);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (goal: PerformanceGoal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const renderGoal = ({item}: {item: PerformanceGoal}) => {
    const progress = getProgress(item);
    return (
      <View style={[styles.goalCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
        <Text style={[styles.goalTitle, {color: theme.colors.text}]}>{item.goal_type}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, {backgroundColor: theme.colors.gray200}]}>
            <View
              style={[
                styles.progressFill,
                {width: `${progress}%`, backgroundColor: theme.colors.primary},
              ]}
            />
          </View>
          <Text style={[styles.progressText, {color: theme.colors.textSecondary}]}>
            {item.current_value} / {item.target_value} ({Math.round(progress)}%)
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGoals} tintColor={theme.colors.primary} />
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
  goalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
});

