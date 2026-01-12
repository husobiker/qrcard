import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
  type TaskFormData,
} from "../../services/taskService";
import { getEmployeesByCompany } from "../../services/employeeService";
import type { Task, TaskStatus, TaskPriority, Employee } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const statusColors: Record<TaskStatus, string> = {
  pending: "#F59E0B",
  in_progress: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
};

const priorityColors: Record<TaskPriority, string> = {
  low: "#6B7280",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Beklemede",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

export default function TasksScreen() {
  const { user, userType } = useAuth();
  const { theme } = useTheme();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState<number>(new Date().getDate());

  const [formData, setFormData] = useState<TaskFormData>({
    employee_id: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      loadTasks();
      loadStats();
      if (userType === "company") {
        loadEmployees();
      }
    }
  }, [companyId, statusFilter, priorityFilter]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const companyIdValue =
      userType === "company" ? user.id : (user as any).company_id;
    setCompanyId(companyIdValue);
    setLoading(false);
  };

  const loadEmployees = async () => {
    if (!companyId) return;
    const employeesData = await getEmployeesByCompany(companyId);
    setEmployees(employeesData);
  };

  const loadTasks = async () => {
    if (!companyId || !user) return;
    const employeeId = userType === "employee" ? user.id : undefined;
    const tasksData = await getTasks(companyId, employeeId);
    setTasks(tasksData);
  };

  const loadStats = async () => {
    if (!companyId || !user) return;
    const employeeId = userType === "employee" ? user.id : undefined;
    const statsData = await getTaskStats(companyId, employeeId);
    setStats(statsData);
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      const dueDate = task.due_date ? new Date(task.due_date) : new Date();
      setSelectedDate(dueDate);
      if (task.due_date) {
        const date = new Date(task.due_date);
        setTempYear(date.getFullYear());
        setTempMonth(date.getMonth() + 1);
        setTempDay(date.getDate());
      } else {
        const today = new Date();
        setTempYear(today.getFullYear());
        setTempMonth(today.getMonth() + 1);
        setTempDay(today.getDate());
      }
      setFormData({
        employee_id: task.employee_id,
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
      });
    } else {
      setEditingTask(null);
      const today = new Date();
      setSelectedDate(today);
      setTempYear(today.getFullYear());
      setTempMonth(today.getMonth() + 1);
      setTempDay(today.getDate());
      setFormData({
        employee_id: "",
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        due_date: "",
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    const today = new Date();
    setSelectedDate(today);
    setTempYear(today.getFullYear());
    setTempMonth(today.getMonth() + 1);
    setTempDay(today.getDate());
    setShowDatePicker(false);
    setFormData({
      employee_id: "",
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const handleDateConfirm = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    const date = new Date(tempYear, tempMonth - 1, day);
    setSelectedDate(date);
    const formattedDate = date.toISOString().split("T")[0];
    setFormData({ ...formData, due_date: formattedDate });
    setShowDatePicker(false);
  };

  const handleDatePickerOpen = () => {
    if (formData.due_date) {
      const date = new Date(formData.due_date + "T00:00:00");
      setTempYear(date.getFullYear());
      setTempMonth(date.getMonth() + 1);
      setTempDay(date.getDate());
      setSelectedDate(date);
    } else {
      const today = new Date();
      setTempYear(today.getFullYear());
      setTempMonth(today.getMonth() + 1);
      setTempDay(today.getDate());
      setSelectedDate(today);
    }
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    if (!companyId || !formData.title) {
      Alert.alert("Hata", "Lütfen başlık alanını doldurun");
      return;
    }

    // For employees, set their own ID
    if (userType === "employee" && user) {
      formData.employee_id = user.id;
    } else if (!formData.employee_id) {
      Alert.alert("Hata", "Lütfen çalışan seçin");
      return;
    }

    if (editingTask) {
      const updated = await updateTask(editingTask.id, formData);
      if (updated) {
        await loadTasks();
        await loadStats();
        handleCloseModal();
      }
    } else {
      const created = await createTask(companyId, formData);
      if (created) {
        await loadTasks();
        await loadStats();
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    Alert.alert("Görevi Sil", "Bu görevi silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const success = await deleteTask(taskId);
          if (success) {
            await loadTasks();
            await loadStats();
          }
        },
      },
    ]);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      await loadTasks();
      await loadStats();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter)
      return false;
    return true;
  });

  const StatCard = ({
    title,
    value,
    color,
  }: {
    title: string;
    value: number;
    color: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
    >
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const renderTask = ({ item }: { item: Task }) => {
    const employee = employees.find((e) => e.id === item.employee_id);
    const isOverdue =
      item.due_date &&
      new Date(item.due_date) < new Date() &&
      item.status !== "completed";

    return (
      <View
        style={[
          styles.taskCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusColors[item.status] + "20",
                  borderColor: statusColors[item.status] + "40",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors[item.status] },
                ]}
              >
                {statusLabels[item.status]}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors[item.priority] + "20" },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: priorityColors[item.priority] },
                ]}
              >
                {priorityLabels[item.priority]}
              </Text>
            </View>
            {isOverdue && (
              <View
                style={[
                  styles.overdueBadge,
                  { backgroundColor: theme.colors.error + "20" },
                ]}
              >
                <Icon name="warning" size={12} color={theme.colors.error} />
                <Text
                  style={[styles.overdueText, { color: theme.colors.error }]}
                >
                  Gecikmiş
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.description && (
          <Text
            style={[
              styles.taskDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.taskInfo}>
          {employee && (
            <Text
              style={[
                styles.taskInfoText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Çalışan: {employee.first_name} {employee.last_name}
            </Text>
          )}
          {item.due_date && (
            <Text
              style={[
                styles.taskInfoText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Son Tarih: {new Date(item.due_date).toLocaleDateString("tr-TR")}
            </Text>
          )}
          {item.completed_at && (
            <Text
              style={[
                styles.taskInfoText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Tamamlandı:{" "}
              {new Date(item.completed_at).toLocaleDateString("tr-TR")}
            </Text>
          )}
        </View>
        <View style={styles.taskActions}>
          {userType === "company" && (
            <TouchableOpacity
              style={styles.statusSelectContainer}
              onPress={() => {
                Alert.alert("Durum Değiştir", "", [
                  {
                    text: "Beklemede",
                    onPress: () => handleStatusChange(item.id, "pending"),
                  },
                  {
                    text: "Devam Ediyor",
                    onPress: () => handleStatusChange(item.id, "in_progress"),
                  },
                  {
                    text: "Tamamlandı",
                    onPress: () => handleStatusChange(item.id, "completed"),
                  },
                  {
                    text: "İptal",
                    onPress: () => handleStatusChange(item.id, "cancelled"),
                  },
                  { text: "Vazgeç", style: "cancel" },
                ]);
              }}
            >
              <Text
                style={[
                  styles.selectLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Durum:
              </Text>
              <View
                style={[
                  styles.statusSelect,
                  {
                    borderColor: theme.colors.gray300,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusSelectText,
                    { color: theme.colors.text },
                  ]}
                >
                  {statusLabels[item.status]}
                </Text>
                <Icon
                  name="arrow-drop-down"
                  size={20}
                  color={theme.colors.text}
                />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleOpenModal(item)}
          >
            <Icon name="edit" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="delete" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="assignment" size={64} color={theme.colors.gray400} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        Görev bulunamadı
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.gray500 }]}>
        Yeni görev ekleyerek başlayın
      </Text>
      {userType === "company" && (
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primaryDark },
          ]}
          onPress={() => handleOpenModal()}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Yeni Görev</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Görev Yönetimi
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Çalışanlara görev atayın ve takip edin
          </Text>
        </View>
        {userType === "company" && (
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primaryDark },
            ]}
            onPress={() => handleOpenModal()}
          >
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Yeni Görev</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
      >
        <View style={styles.statsContainer}>
          <StatCard
            title="Toplam"
            value={stats.total}
            color={theme.colors.text}
          />
          <StatCard title="Beklemede" value={stats.pending} color="#F59E0B" />
          <StatCard
            title="Devam Ediyor"
            value={stats.in_progress}
            color="#3B82F6"
          />
          <StatCard
            title="Tamamlandı"
            value={stats.completed}
            color="#10B981"
          />
          <StatCard title="Gecikmiş" value={stats.overdue} color="#EF4444" />
        </View>
      </ScrollView>

      {/* Filters */}
      {userType === "company" && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterItem, { borderColor: theme.colors.gray300 }]}
            onPress={() => {
              Alert.alert("Durum Filtresi", "", [
                { text: "Tüm Durumlar", onPress: () => setStatusFilter("all") },
                {
                  text: "Beklemede",
                  onPress: () => setStatusFilter("pending"),
                },
                {
                  text: "Devam Ediyor",
                  onPress: () => setStatusFilter("in_progress"),
                },
                {
                  text: "Tamamlandı",
                  onPress: () => setStatusFilter("completed"),
                },
                { text: "İptal", onPress: () => setStatusFilter("cancelled") },
                { text: "Vazgeç", style: "cancel" },
              ]);
            }}
          >
            <Icon
              name="filter-list"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.filterLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Durum:
            </Text>
            <View
              style={[
                styles.filterSelect,
                {
                  borderColor: theme.colors.gray300,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[styles.filterSelectText, { color: theme.colors.text }]}
              >
                {statusFilter === "all"
                  ? "Tüm Durumlar"
                  : statusLabels[statusFilter]}
              </Text>
              <Icon
                name="arrow-drop-down"
                size={20}
                color={theme.colors.text}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterItem, { borderColor: theme.colors.gray300 }]}
            onPress={() => {
              Alert.alert("Öncelik Filtresi", "", [
                {
                  text: "Tüm Öncelikler",
                  onPress: () => setPriorityFilter("all"),
                },
                { text: "Düşük", onPress: () => setPriorityFilter("low") },
                { text: "Orta", onPress: () => setPriorityFilter("medium") },
                { text: "Yüksek", onPress: () => setPriorityFilter("high") },
                { text: "Acil", onPress: () => setPriorityFilter("urgent") },
                { text: "Vazgeç", style: "cancel" },
              ]);
            }}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Öncelik:
            </Text>
            <View
              style={[
                styles.filterSelect,
                {
                  borderColor: theme.colors.gray300,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[styles.filterSelectText, { color: theme.colors.text }]}
              >
                {priorityFilter === "all"
                  ? "Tüm Öncelikler"
                  : priorityLabels[priorityFilter]}
              </Text>
              <Icon
                name="arrow-drop-down"
                size={20}
                color={theme.colors.text}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              loadTasks();
              loadStats();
            }}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={
          filteredTasks.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        ListEmptyComponent={ListEmptyComponent}
      />

      {/* Task Form Modal */}
      {userType === "company" && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: theme.colors.background },
            ]}
            edges={["bottom", "left", "right"]}
          >
            <StatusBar barStyle="dark-content" />
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.colors.gray200 },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingTask ? "Görevi Düzenle" : "Yeni Görev Ekle"}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Çalışan *
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    {
                      borderColor: theme.colors.gray300,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                  onPress={() => {
                    Alert.alert("Çalışan Seçin", "", [
                      ...employees.map((emp) => ({
                        text: `${emp.first_name} ${emp.last_name}`,
                        onPress: () =>
                          setFormData({ ...formData, employee_id: emp.id }),
                      })),
                      { text: "İptal", style: "cancel" },
                    ]);
                  }}
                >
                  <Text
                    style={[
                      styles.selectText,
                      {
                        color: formData.employee_id
                          ? theme.colors.text
                          : theme.colors.gray500,
                      },
                    ]}
                  >
                    {formData.employee_id
                      ? employees.find((e) => e.id === formData.employee_id)
                          ?.first_name +
                        " " +
                        employees.find((e) => e.id === formData.employee_id)
                          ?.last_name
                      : "Çalışan Seçin"}
                  </Text>
                  <Icon
                    name="arrow-drop-down"
                    size={20}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Başlık *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="Görev başlığı"
                  placeholderTextColor={theme.colors.gray500}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Açıklama
                </Text>
                <TextInput
                  style={[
                    styles.textarea,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Görev açıklaması"
                  placeholderTextColor={theme.colors.gray500}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Durum
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    onPress={() => {
                      Alert.alert("Durum Seçin", "", [
                        {
                          text: "Beklemede",
                          onPress: () =>
                            setFormData({ ...formData, status: "pending" }),
                        },
                        {
                          text: "Devam Ediyor",
                          onPress: () =>
                            setFormData({ ...formData, status: "in_progress" }),
                        },
                        {
                          text: "Tamamlandı",
                          onPress: () =>
                            setFormData({ ...formData, status: "completed" }),
                        },
                        {
                          text: "İptal",
                          onPress: () =>
                            setFormData({ ...formData, status: "cancelled" }),
                        },
                        { text: "Vazgeç", style: "cancel" },
                      ]);
                    }}
                  >
                    <Text
                      style={[styles.selectText, { color: theme.colors.text }]}
                    >
                      {statusLabels[formData.status as TaskStatus]}
                    </Text>
                    <Icon
                      name="arrow-drop-down"
                      size={20}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Öncelik
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    onPress={() => {
                      Alert.alert("Öncelik Seçin", "", [
                        {
                          text: "Düşük",
                          onPress: () =>
                            setFormData({ ...formData, priority: "low" }),
                        },
                        {
                          text: "Orta",
                          onPress: () =>
                            setFormData({ ...formData, priority: "medium" }),
                        },
                        {
                          text: "Yüksek",
                          onPress: () =>
                            setFormData({ ...formData, priority: "high" }),
                        },
                        {
                          text: "Acil",
                          onPress: () =>
                            setFormData({ ...formData, priority: "urgent" }),
                        },
                        { text: "Vazgeç", style: "cancel" },
                      ]);
                    }}
                  >
                    <Text
                      style={[styles.selectText, { color: theme.colors.text }]}
                    >
                      {priorityLabels[formData.priority as TaskPriority]}
                    </Text>
                    <Icon
                      name="arrow-drop-down"
                      size={20}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Son Tarih
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.gray300,
                      backgroundColor: theme.colors.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                  onPress={handleDatePickerOpen}
                >
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: formData.due_date
                          ? theme.colors.text
                          : theme.colors.gray500,
                      },
                    ]}
                  >
                    {formData.due_date
                      ? new Date(
                          formData.due_date + "T00:00:00"
                        ).toLocaleDateString("tr-TR")
                      : "Tarih Seçin"}
                  </Text>
                  <Icon
                    name="calendar-today"
                    size={20}
                    color={theme.colors.gray500}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <View
                    style={[
                      styles.datePickerContainer,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.datePickerHeader,
                        { borderBottomColor: theme.colors.gray200 },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text
                          style={[
                            styles.datePickerButton,
                            { color: theme.colors.primary },
                          ]}
                        >
                          İptal
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.datePickerTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Tarih Seçin
                      </Text>
                      <TouchableOpacity onPress={handleDateConfirm}>
                        <Text
                          style={[
                            styles.datePickerButton,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Tamam
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerContent}>
                      {/* Year Picker */}
                      <View style={styles.pickerColumn}>
                        <Text
                          style={[
                            styles.pickerLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Yıl
                        </Text>
                        <ScrollView
                          style={styles.pickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <TouchableOpacity
                                key={year}
                                style={[
                                  styles.pickerItem,
                                  tempYear === year && {
                                    backgroundColor:
                                      theme.colors.primary + "20",
                                  },
                                ]}
                                onPress={() => {
                                  setTempYear(year);
                                  const daysInMonth = getDaysInMonth(
                                    year,
                                    tempMonth
                                  );
                                  if (tempDay > daysInMonth) {
                                    setTempDay(daysInMonth);
                                  }
                                }}
                              >
                                <Text
                                  style={[
                                    styles.pickerItemText,
                                    {
                                      color:
                                        tempYear === year
                                          ? theme.colors.primary
                                          : theme.colors.text,
                                      fontWeight:
                                        tempYear === year ? "bold" : "normal",
                                    },
                                  ]}
                                >
                                  {year}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Month Picker */}
                      <View style={styles.pickerColumn}>
                        <Text
                          style={[
                            styles.pickerLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Ay
                        </Text>
                        <ScrollView
                          style={styles.pickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const monthNames = [
                              "Ocak",
                              "Şubat",
                              "Mart",
                              "Nisan",
                              "Mayıs",
                              "Haziran",
                              "Temmuz",
                              "Ağustos",
                              "Eylül",
                              "Ekim",
                              "Kasım",
                              "Aralık",
                            ];
                            return (
                              <TouchableOpacity
                                key={month}
                                style={[
                                  styles.pickerItem,
                                  tempMonth === month && {
                                    backgroundColor:
                                      theme.colors.primary + "20",
                                  },
                                ]}
                                onPress={() => {
                                  setTempMonth(month);
                                  const daysInMonth = getDaysInMonth(
                                    tempYear,
                                    month
                                  );
                                  if (tempDay > daysInMonth) {
                                    setTempDay(daysInMonth);
                                  }
                                }}
                              >
                                <Text
                                  style={[
                                    styles.pickerItemText,
                                    {
                                      color:
                                        tempMonth === month
                                          ? theme.colors.primary
                                          : theme.colors.text,
                                      fontWeight:
                                        tempMonth === month ? "bold" : "normal",
                                    },
                                  ]}
                                >
                                  {monthNames[i]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Day Picker */}
                      <View style={styles.pickerColumn}>
                        <Text
                          style={[
                            styles.pickerLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Gün
                        </Text>
                        <ScrollView
                          style={styles.pickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from(
                            {
                              length: getDaysInMonth(tempYear, tempMonth),
                            },
                            (_, i) => {
                              const day = i + 1;
                              return (
                                <TouchableOpacity
                                  key={day}
                                  style={[
                                    styles.pickerItem,
                                    tempDay === day && {
                                      backgroundColor:
                                        theme.colors.primary + "20",
                                    },
                                  ]}
                                  onPress={() => setTempDay(day)}
                                >
                                  <Text
                                    style={[
                                      styles.pickerItemText,
                                      {
                                        color:
                                          tempDay === day
                                            ? theme.colors.primary
                                            : theme.colors.text,
                                        fontWeight:
                                          tempDay === day ? "bold" : "normal",
                                      },
                                    ]}
                                  >
                                    {day}
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { borderColor: theme.colors.gray300 },
                  ]}
                  onPress={handleCloseModal}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: theme.colors.text },
                    ]}
                  >
                    İptal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    { backgroundColor: theme.colors.primaryDark },
                  ]}
                  onPress={handleSave}
                  disabled={!formData.title || !formData.employee_id}
                >
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>

              {editingTask && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  onPress={() => handleDelete(editingTask.id)}
                >
                  <Icon name="delete" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Görevi Sil</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 70,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    lineHeight: 32,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginLeft: 12,
    alignSelf: "flex-start",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  statsScroll: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    justifyContent: "space-between",
  },
  statCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    height: 70,
  },
  statTitle: {
    fontSize: 10,
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 24,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  filterSelectText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    minWidth: "100%",
    marginBottom: 6,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  overdueBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskInfo: {
    marginBottom: 12,
    gap: 6,
  },
  taskInfoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  statusSelectContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  statusSelectText: {
    fontSize: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 70,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
  },
  datePickerContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  datePickerButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePicker: {
    width: "100%",
    height: 200,
  },
  datePickerContent: {
    flexDirection: "row",
    height: 200,
    paddingVertical: 8,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerScroll: {
    flex: 1,
    width: "100%",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemText: {
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
