import React, { useState, useEffect, useRef } from "react";
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
  Image,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const [formData, setFormData] = useState<TaskFormData>({
    employee_id: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    checklist_items: [],
    checklist_completed: [],
    address: "",
    attachments: [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");

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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setEditingTask(null);
    setIsEditMode(false);
    setModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setViewingTask(null);
    setIsEditMode(true);
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
    
    // Parse checklist items and completed from JSON if needed
    let checklistItems: string[] = [];
    let checklistCompleted: string[] = [];
    let attachments: string[] = [];
    
    if (task.checklist_items) {
      if (typeof task.checklist_items === 'string') {
        try {
          checklistItems = JSON.parse(task.checklist_items);
        } catch (e) {
          checklistItems = [];
        }
      } else if (Array.isArray(task.checklist_items)) {
        checklistItems = task.checklist_items;
      }
    }
    
    if (task.checklist_completed) {
      if (typeof task.checklist_completed === 'string') {
        try {
          checklistCompleted = JSON.parse(task.checklist_completed);
        } catch (e) {
          checklistCompleted = [];
        }
      } else if (Array.isArray(task.checklist_completed)) {
        checklistCompleted = task.checklist_completed;
      }
    }
    
    if (task.attachments) {
      if (typeof task.attachments === 'string') {
        try {
          attachments = JSON.parse(task.attachments);
        } catch (e) {
          attachments = [];
        }
      } else if (Array.isArray(task.attachments)) {
        attachments = task.attachments;
      }
    }
    
    setFormData({
      employee_id: task.employee_id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      checklist_items: checklistItems,
      checklist_completed: checklistCompleted,
      address: task.address || "",
      attachments: attachments,
    });
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      handleEditTask(task);
    } else {
      setEditingTask(null);
      setViewingTask(null);
      setIsEditMode(true);
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
        checklist_items: [],
        checklist_completed: [],
        address: "",
        attachments: [],
      });
      setNewChecklistItem("");
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setViewingTask(null);
    setIsEditMode(false);
    const today = new Date();
    setSelectedDate(today);
    setTempYear(today.getFullYear());
    setTempMonth(today.getMonth() + 1);
    setTempDay(today.getDate());
    setShowDatePicker(false);
    setEmployeeModalVisible(false);
    setEmployeeSearchQuery("");
    setFormData({
      employee_id: "",
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      checklist_items: [],
      checklist_completed: [],
      address: "",
      attachments: [],
    });
    setNewChecklistItem("");
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const handleDateConfirm = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    const date = new Date(tempYear, tempMonth - 1, day);
    setSelectedDate(date);
    // Format date manually to avoid timezone issues with toISOString()
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormData({ ...formData, due_date: formattedDate });
    setShowDatePicker(false);
  };

  const handleDatePickerOpen = () => {
    let yearToSet = new Date().getFullYear();
    let monthToSet = new Date().getMonth() + 1;
    let dayToSet = new Date().getDate();
    
    if (formData.due_date) {
      const date = new Date(formData.due_date + "T00:00:00");
      yearToSet = date.getFullYear();
      monthToSet = date.getMonth() + 1;
      dayToSet = date.getDate();
      setSelectedDate(date);
    } else {
      const today = new Date();
      setSelectedDate(today);
    }
    
    setTempYear(yearToSet);
    setTempMonth(monthToSet);
    setTempDay(dayToSet);
    setShowDatePicker(true);
    
    // Scroll to selected values after a short delay
    setTimeout(() => {
      const itemHeight = 48;
      const currentYear = new Date().getFullYear();
      const yearIndex = yearToSet - (currentYear - 5);
      if (yearScrollRef.current && yearIndex >= 0 && yearIndex < 50) {
        yearScrollRef.current.scrollTo({
          y: yearIndex * itemHeight,
          animated: true,
        });
      }
      if (monthScrollRef.current) {
        monthScrollRef.current.scrollTo({
          y: (monthToSet - 1) * itemHeight,
          animated: true,
        });
      }
      if (dayScrollRef.current) {
        dayScrollRef.current.scrollTo({
          y: (dayToSet - 1) * itemHeight,
          animated: true,
        });
      }
    }, 150);
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

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        onPress={() => handleViewTask(item)}
        activeOpacity={0.7}
      >
        <View style={styles.taskCardContent}>
          <View style={styles.taskCardMain}>
            <Text 
              style={[styles.taskTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={styles.taskCardInfo}>
              {employee && (
                <Text
                  style={[
                    styles.taskEmployee,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {employee?.first_name || ""} {employee?.last_name || ""}
                </Text>
              )}
              <View
                style={[
                  styles.taskStatusBadge,
                  {
                    backgroundColor: statusColors[item.status] + "20",
                    borderColor: statusColors[item.status] + "40",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.taskStatusText,
                    { color: statusColors[item.status] },
                  ]}
                >
                  {statusLabels[item.status]}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.taskCardActions}>
            {userType === "company" && (
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: theme.colors.secondary || "#6B7280" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  Alert.alert("Durum Değiştir", "Görevin durumunu değiştirmek istediğinize emin misiniz?", [
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
                      text: "İptal Edildi",
                      onPress: () => handleStatusChange(item.id, "cancelled"),
                    },
                    { text: "Vazgeç", style: "cancel" },
                  ]);
                }}
              >
                <Icon name="swap-horiz" size={16} color={theme.colors.secondary || "#6B7280"} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditTask(item);
              }}
            >
              <Icon name="edit" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Icon name="delete" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
    <React.Fragment>
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            Görev Yönetimi
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
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
                style={[styles.filterSelectText, { color: theme.colors.text, flex: 1 }]}
                numberOfLines={1}
              >
                {statusFilter === "all"
                  ? "Tüm Durumlar"
                  : statusLabels[statusFilter]}
              </Text>
              <Icon
                name="arrow-drop-down"
                size={18}
                color={theme.colors.text}
                style={{ marginLeft: 4 }}
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
                style={[styles.filterSelectText, { color: theme.colors.text, flex: 1 }]}
                numberOfLines={1}
              >
                {priorityFilter === "all"
                  ? "Tüm Öncelikler"
                  : priorityLabels[priorityFilter]}
              </Text>
              <Icon
                name="arrow-drop-down"
                size={18}
                color={theme.colors.text}
                style={{ marginLeft: 4 }}
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
                {viewingTask ? "Görev Detayı" : editingTask ? "Görevi Düzenle" : "Yeni Görev Ekle"}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {viewingTask && (
                  <TouchableOpacity
                    onPress={() => {
                      if (viewingTask) {
                        handleEditTask(viewingTask);
                      }
                    }}
                    style={[
                      styles.editButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Icon name="edit" size={18} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>Düzenle</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleCloseModal}>
                  <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent}>
              {viewingTask && !isEditMode ? (
                // View Mode - Show task details
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Başlık
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      {viewingTask.title}
                    </Text>
                  </View>

                  {viewingTask.description && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Açıklama
                      </Text>
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                        {viewingTask.description}
                      </Text>
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Çalışan
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                      {(() => {
                        const emp = employees.find((e) => e.id === viewingTask.employee_id);
                        return emp
                          ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                          : "Atanmamış";
                      })()}
                    </Text>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Durum
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusColors[viewingTask.status] + "20",
                            borderColor: statusColors[viewingTask.status] + "40",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusColors[viewingTask.status] },
                          ]}
                        >
                          {statusLabels[viewingTask.status]}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Öncelik
                      </Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: priorityColors[viewingTask.priority] + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: priorityColors[viewingTask.priority] },
                          ]}
                        >
                          {priorityLabels[viewingTask.priority]}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {viewingTask.due_date && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Son Tarih
                      </Text>
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                        {new Date(viewingTask.due_date).toLocaleDateString("tr-TR")}
                      </Text>
                    </View>
                  )}

                  {viewingTask.completed_at && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Tamamlandı
                      </Text>
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                        {new Date(viewingTask.completed_at).toLocaleDateString("tr-TR")}
                      </Text>
                    </View>
                  )}

                  {/* Checklist Items */}
                  {(() => {
                    let checklistItems = viewingTask.checklist_items || [];
                    if (typeof checklistItems === 'string') {
                      try {
                        checklistItems = JSON.parse(checklistItems);
                      } catch (e) {
                        checklistItems = [];
                      }
                    }
                    return Array.isArray(checklistItems) && checklistItems.length > 0 ? (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>
                          Yapılacak İşlemler
                        </Text>
                        <View style={styles.checklistContainer}>
                          {checklistItems.map((item: string, index: number) => {
                            let checklistCompleted = viewingTask.checklist_completed || [];
                            if (typeof checklistCompleted === 'string') {
                              try {
                                checklistCompleted = JSON.parse(checklistCompleted);
                              } catch (e) {
                                checklistCompleted = [];
                              }
                            }
                            const isCompleted = Array.isArray(checklistCompleted) && checklistCompleted.includes(item);
                            return (
                              <View key={index} style={styles.checklistItemRow}>
                                <View
                                  style={[
                                    styles.checkbox,
                                    {
                                      borderColor: theme.colors.gray300,
                                      backgroundColor: isCompleted
                                        ? theme.colors.primary
                                        : "transparent",
                                    },
                                  ]}
                                >
                                  {isCompleted && (
                                    <Icon name="check" size={16} color="#FFFFFF" />
                                  )}
                                </View>
                                <Text style={[styles.checklistItemText, { color: theme.colors.text }]}>
                                  {item}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ) : null;
                  })()}

                  {/* Address */}
                  {viewingTask.address && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Adres
                      </Text>
                      <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                        {viewingTask.address}
                      </Text>
                    </View>
                  )}

                  {/* Attachments */}
                  {(() => {
                    let attachments = viewingTask.attachments || [];
                    if (typeof attachments === 'string') {
                      try {
                        attachments = JSON.parse(attachments);
                      } catch (e) {
                        attachments = [];
                      }
                    }
                    return Array.isArray(attachments) && attachments.length > 0 ? (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>
                          Dokümanlar
                        </Text>
                        <View style={styles.attachmentsContainer}>
                          {attachments.map((attachment: string, index: number) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                            const isUrl = attachment.startsWith('http://') || attachment.startsWith('https://');
                            
                            return (
                              <TouchableOpacity
                                key={index}
                                style={styles.attachmentItem}
                                onPress={async () => {
                                  try {
                                    // Check if it's a local URI (file://, content://, ph://)
                                    const isLocalUri = attachment.startsWith('file://') || 
                                                      attachment.startsWith('content://') || 
                                                      attachment.startsWith('ph://');
                                    
                                    if (isLocalUri) {
                                      // Local URI - try to display if it's an image
                                      if (isImage) {
                                        setViewingAttachment(attachment);
                                      } else {
                                        Alert.alert(
                                          "Dosya",
                                          "Bu dosya yerel bir dosyadır ve artık erişilebilir olmayabilir. Lütfen görevi yeniden kaydedin.",
                                          [
                                            { text: "Tamam", style: "default" }
                                          ]
                                        );
                                      }
                                    } else if (isUrl) {
                                      // URL ise görüntüleme modalı aç veya tarayıcıda aç
                                      if (isImage) {
                                        setViewingAttachment(attachment);
                                      } else {
                                        const canOpen = await Linking.canOpenURL(attachment);
                                        if (canOpen) {
                                          await Linking.openURL(attachment);
                                        } else {
                                          Alert.alert("Hata", "Bu dosya açılamıyor");
                                        }
                                      }
                                    } else if (isImage) {
                                      // Assume it's a valid image path
                                      setViewingAttachment(attachment);
                                    } else {
                                      // Diğer dosyalar için bilgi göster
                                      Alert.alert(
                                        "Dosya",
                                        attachment.split("/").pop() || attachment,
                                        [
                                          { text: "Tamam", style: "default" }
                                        ]
                                      );
                                    }
                                  } catch (error) {
                                    console.error("Error opening attachment:", error);
                                    Alert.alert("Hata", "Dosya açılamadı");
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Icon 
                                  name={isImage ? "image" : "attach-file"} 
                                  size={20} 
                                  color={theme.colors.primary} 
                                />
                                <Text
                                  style={[styles.attachmentText, { color: theme.colors.text }]}
                                  numberOfLines={1}
                                >
                                  {attachment.split("/").pop() || attachment}
                                </Text>
                                <Icon name="open-in-new" size={18} color={theme.colors.gray500} />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ) : null;
                  })()}

                  {userType === "company" && (
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        { backgroundColor: theme.colors.error },
                      ]}
                      onPress={() => handleDelete(viewingTask.id)}
                    >
                      <Icon name="delete" size={18} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Görevi Sil</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                // Edit Mode - Show form
                <>
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
                    setEmployeeSearchQuery("");
                    setEmployeeModalVisible(true);
                  }}
                  activeOpacity={0.7}
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
                      ? (() => {
                          const emp = employees.find((e) => e.id === formData.employee_id);
                          return emp
                            ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                            : "Çalışan Seçin";
                        })()
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

              <View style={[styles.formGroup, { position: "relative" }]}>
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
                          ref={yearScrollRef}
                          style={styles.pickerScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {Array.from({ length: 50 }, (_, i) => {
                            const year = new Date().getFullYear() - 5 + i;
                            return (
                              <TouchableOpacity
                                key={year}
                                style={[
                                  styles.pickerItem,
                                  {
                                    backgroundColor:
                                      tempYear === year
                                        ? theme.colors.primary + "20"
                                        : "transparent",
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
                                        tempYear === year ? "600" : "400",
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
                          ref={monthScrollRef}
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
                                  {
                                    backgroundColor:
                                      tempMonth === month
                                        ? theme.colors.primary + "20"
                                        : "transparent",
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
                                        tempMonth === month ? "600" : "400",
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
                          ref={dayScrollRef}
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
                                    {
                                      backgroundColor:
                                        tempDay === day
                                          ? theme.colors.primary + "20"
                                          : "transparent",
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
                                          tempDay === day ? "600" : "400",
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

            {/* Checklist Items */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Yapılacak İşlemler (Opsiyonel)
              </Text>
              <View style={styles.checklistContainer}>
                {formData.checklist_items && formData.checklist_items.length > 0 && (
                  <View style={styles.checklistItems}>
                    {formData.checklist_items.map((item, index) => (
                      <View key={index} style={styles.checklistItemRow}>
                        <TouchableOpacity
                          style={[
                            styles.checkbox,
                            {
                              borderColor: theme.colors.gray300,
                              backgroundColor: (formData.checklist_completed || []).includes(item)
                                ? theme.colors.primary
                                : "transparent",
                            },
                          ]}
                          onPress={() => {
                            const completed = formData.checklist_completed || [];
                            const newCompleted = completed.includes(item)
                              ? completed.filter((c) => c !== item)
                              : [...completed, item];
                            setFormData({ ...formData, checklist_completed: newCompleted });
                          }}
                        >
                          {(formData.checklist_completed || []).includes(item) && (
                            <Icon name="check" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                        <Text style={[styles.checklistItemText, { color: theme.colors.text }]}>
                          {item}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            const newItems = formData.checklist_items?.filter((_, i) => i !== index) || [];
                            const newCompleted = (formData.checklist_completed || []).filter((c) => c !== item);
                            setFormData({
                              ...formData,
                              checklist_items: newItems,
                              checklist_completed: newCompleted,
                            });
                          }}
                        >
                          <Icon name="close" size={20} color={theme.colors.error || "#EF4444"} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addChecklistItemContainer}>
                  <TextInput
                    style={[
                      styles.checklistInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    placeholder="Yeni işlem ekle..."
                    placeholderTextColor={theme.colors.gray500}
                    value={newChecklistItem}
                    onChangeText={setNewChecklistItem}
                    onSubmitEditing={() => {
                      if (newChecklistItem.trim()) {
                        setFormData({
                          ...formData,
                          checklist_items: [...(formData.checklist_items || []), newChecklistItem.trim()],
                        });
                        setNewChecklistItem("");
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addChecklistButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => {
                      if (newChecklistItem.trim()) {
                        setFormData({
                          ...formData,
                          checklist_items: [...(formData.checklist_items || []), newChecklistItem.trim()],
                        });
                        setNewChecklistItem("");
                      }
                    }}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Adres (Opsiyonel)
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
                value={formData.address || ""}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Görev adresi"
                placeholderTextColor={theme.colors.gray500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Attachments */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Dokümanlar (Opsiyonel)
              </Text>
              {formData.attachments && formData.attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {formData.attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <Icon name="attach-file" size={20} color={theme.colors.primary} />
                      <Text
                        style={[styles.attachmentText, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {attachment.split("/").pop() || attachment}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const newAttachments = formData.attachments?.filter((_, i) => i !== index) || [];
                          setFormData({ ...formData, attachments: newAttachments });
                        }}
                      >
                        <Icon name="close" size={18} color={theme.colors.error || "#EF4444"} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.attachmentButtons}>
                <TouchableOpacity
                  style={[
                    styles.attachmentButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 },
                  ]}
                  onPress={async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için izin gerekli");
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaType.Images,
                      allowsEditing: true,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      const newAttachments = [...(formData.attachments || []), result.assets[0].uri];
                      setFormData({ ...formData, attachments: newAttachments });
                    }
                  }}
                >
                  <Icon name="photo" size={20} color={theme.colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text }]}>
                    Fotoğraf
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.attachmentButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 },
                  ]}
                  onPress={async () => {
                    try {
                      const result = await DocumentPicker.getDocumentAsync({
                        type: "*/*",
                        copyToCacheDirectory: true,
                      });
                      if (!result.canceled && result.assets[0]) {
                        const newAttachments = [...(formData.attachments || []), result.assets[0].uri];
                        setFormData({ ...formData, attachments: newAttachments });
                      }
                    } catch (error) {
                      console.error("Error picking document:", error);
                    }
                  }}
                >
                  <Icon name="description" size={20} color={theme.colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text }]}>
                    Belge
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
              </>
              )}
            </ScrollView>

            {!viewingTask && (
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
            )}

            {editingTask && !viewingTask && (
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

            {/* Employee Selection Modal - Rendered inside Task Modal */}
            {employeeModalVisible && (
              <View style={styles.employeeModalWrapper}>
                <View style={styles.employeeModalBackdrop} />
                <View style={[styles.employeeModalContainer, { backgroundColor: theme.colors.surface }]}>
                  <View style={[styles.employeeModalHeader, { borderBottomColor: theme.colors.gray200 }]}>
                    <Text style={[styles.employeeModalTitle, { color: theme.colors.text }]}>
                      Çalışan Seçin
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEmployeeModalVisible(false);
                        setEmployeeSearchQuery("");
                      }}
                      style={styles.employeeModalCloseButton}
                    >
                      <Icon name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Search Box */}
                  <View style={[styles.employeeSearchContainer, { borderBottomColor: theme.colors.gray200 }]}>
                    <Icon name="search" size={20} color={theme.colors.gray500} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.employeeSearchInput, { color: theme.colors.text }]}
                      placeholder="Çalışan ara..."
                      placeholderTextColor={theme.colors.gray500}
                      value={employeeSearchQuery}
                      onChangeText={setEmployeeSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {employeeSearchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setEmployeeSearchQuery("")}
                        style={styles.clearSearchButton}
                      >
                        <Icon name="close" size={18} color={theme.colors.gray500} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Employee List */}
                  <FlatList
                    data={employees.filter((emp) => {
                      if (!employeeSearchQuery.trim()) return true;
                      const searchLower = employeeSearchQuery.toLowerCase();
                      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
                      return fullName.includes(searchLower);
                    })}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.employeeListItem,
                          {
                            backgroundColor: formData.employee_id === item.id
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                            borderBottomColor: theme.colors.gray200,
                          },
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, employee_id: item.id });
                          setEmployeeModalVisible(false);
                          setEmployeeSearchQuery("");
                        }}
                      >
                        <View style={styles.employeeListItemContent}>
                          <View style={[styles.employeeAvatar, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.employeeAvatarText}>
                              {item.first_name?.charAt(0) || ""}
                              {item.last_name?.charAt(0) || ""}
                            </Text>
                          </View>
                          <View style={styles.employeeListItemInfo}>
                            <Text style={[styles.employeeListItemName, { color: theme.colors.text }]}>
                              {item.first_name || ""} {item.last_name || ""}
                            </Text>
                            {item.job_title && (
                              <Text style={[styles.employeeListItemJob, { color: theme.colors.textSecondary }]}>
                                {item.job_title}
                                {item.department && ` • ${item.department}`}
                              </Text>
                            )}
                          </View>
                        </View>
                        {formData.employee_id === item.id && (
                          <Icon name="check-circle" size={24} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={styles.employeeListEmpty}>
                        <Icon name="person-off" size={48} color={theme.colors.gray400} />
                        <Text style={[styles.employeeListEmptyText, { color: theme.colors.textSecondary }]}>
                          {employeeSearchQuery.trim()
                            ? "Arama sonucu bulunamadı"
                            : "Çalışan bulunamadı"}
                        </Text>
                      </View>
                    }
                    style={styles.employeeList}
                  />
                </View>
              </View>
            )}

            {/* Image Viewer Modal - Inside Task Detail Modal */}
            {viewingAttachment !== null && (() => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingAttachment || "");
              return isImage ? (
                <View style={styles.imageViewerOverlay}>
                  <TouchableOpacity
                    style={styles.imageViewerBackdrop}
                    activeOpacity={1}
                    onPress={() => setViewingAttachment(null)}
                  />
                  <View style={styles.imageViewerContent}>
                    <View style={styles.imageViewerHeader}>
                      <Text style={[styles.imageViewerTitle, { color: "#FFFFFF" }]} numberOfLines={1}>
                        {viewingAttachment?.split("/").pop() || "Görüntü"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setViewingAttachment(null)}
                        style={styles.imageViewerCloseButton}
                      >
                        <Icon name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      contentContainerStyle={styles.imageViewerScrollContent}
                      maximumZoomScale={5}
                      minimumZoomScale={1}
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={false}
                    >
                      <Image
                        source={{ 
                          uri: viewingAttachment || "",
                          cache: 'force-cache'
                        }}
                        style={styles.imageViewerImage}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error("Error loading image:", error.nativeEvent?.error || error);
                          Alert.alert("Hata", "Görüntü yüklenemedi. URL: " + (viewingAttachment?.substring(0, 50) || ""));
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", viewingAttachment);
                        }}
                      />
                    </ScrollView>
                  </View>
                </View>
              ) : null;
            })()}
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
    </React.Fragment>
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
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
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
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 0,
    marginBottom: 0,
    gap: 10,
    justifyContent: "space-between",
  },
  statCard: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 67,
    height: 67,
  },
  statTitle: {
    fontSize: 8,
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 24,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingRight: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
  },
  filterSelectText: {
    fontSize: 11,
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
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  taskCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskCardMain: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
  taskCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  taskEmployee: {
    fontSize: 12,
    lineHeight: 16,
  },
  taskStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
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
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  taskInfo: {
    marginBottom: 8,
    gap: 4,
  },
  taskInfoText: {
    fontSize: 11,
    lineHeight: 14,
  },
  taskCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    width: 32,
    height: 32,
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
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    minHeight: 48,
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
  detailText: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  employeeModalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  employeeModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  employeeModalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
    zIndex: 1001,
  },
  employeeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  employeeModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  employeeModalCloseButton: {
    padding: 4,
  },
  employeeSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  employeeSearchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  employeeList: {
    flex: 1,
  },
  employeeListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  employeeListItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  employeeAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  employeeListItemInfo: {
    flex: 1,
  },
  employeeListItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeeListItemJob: {
    fontSize: 14,
  },
  employeeListEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  employeeListEmptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  checklistContainer: {
    marginTop: 8,
  },
  checklistItems: {
    marginBottom: 12,
  },
  checklistItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
  },
  addChecklistItemContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  checklistInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addChecklistButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentsContainer: {
    marginBottom: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
  },
  attachmentButtons: {
    flexDirection: "row",
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imageViewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  imageViewerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageViewerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  imageViewerCloseButton: {
    padding: 8,
  },
  imageViewerScrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
    minHeight: 400,
  },
  imageViewerFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    paddingTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageViewerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  imageViewerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
