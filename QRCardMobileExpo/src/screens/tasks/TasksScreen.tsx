import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {getTasks, updateTask, deleteTask} from '../../services/taskService';
import type {Task} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TasksScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const employeeId = userType === 'employee' ? user.id : undefined;
      const data = await getTasks(companyId, employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated = await updateTask(task.id, {status: newStatus});
    if (updated) {
      loadTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteTask(taskId);
          if (success) {
            loadTasks();
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.info;
      default:
        return theme.colors.gray500;
    }
  };

  const renderTask = ({item}: {item: Task}) => (
    <TouchableOpacity
      style={[
        styles.taskCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
          opacity: item.status === 'completed' ? 0.6 : 1,
        },
      ]}
      onPress={() => handleToggleComplete(item)}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Icon
            name={item.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={item.status === 'completed' ? theme.colors.success : theme.colors.gray400}
          />
          <Text
            style={[
              styles.taskTitle,
              {
                color: theme.colors.text,
                textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
              },
            ]}>
            {item.title}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Icon name="delete" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={[styles.taskDescription, {color: theme.colors.textSecondary}]}>
          {item.description}
        </Text>
      )}
      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, {backgroundColor: getPriorityColor(item.priority) + '20'}]}>
          <Text style={[styles.priorityText, {color: getPriorityColor(item.priority)}]}>
            {item.priority}
          </Text>
        </View>
        {item.due_date && (
          <Text style={[styles.dueDate, {color: theme.colors.textSecondary}]}>
            Due: {new Date(item.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={theme.colors.primary} />
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
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
  },
});

