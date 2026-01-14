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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  type TaskFormData,
} from "../../services/taskService";
import { getEmployeesByRegion } from "../../services/employeeService";
import type { Task, TaskStatus, TaskPriority, Employee } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const statusColors: Record<TaskStatus, string> = {
  pending: "#F59E0B",
  in_progress: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
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

export default function RegionalTasksScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const [formData, setFormData] = useState<TaskFormData>({
    employee_id: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    region_id: employee?.region_id || null,
    checklist_items: [],
    checklist_completed: [],
    address: "",
    attachments: [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState<number>(new Date().getDate());
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (employee && employee.region_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.region_id) return;

    setLoading(true);
    try {
      // Load employees in region
      const employeesData = await getEmployeesByRegion(employee.region_id);
      setEmployees(employeesData);

      // Load tasks in region
      const tasksData = await getTasks(
        employee.company_id,
        undefined,
        employee.region_id
      );
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setViewingTask(null);
    setFormData({
      employee_id: "",
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      region_id: employee?.region_id && employee.region_id !== "" ? employee.region_id : null,
      checklist_items: [],
      checklist_completed: [],
      address: "",
      attachments: [],
    });
    setNewChecklistItem("");
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!employee || !employee.company_id || !formData.title || !formData.employee_id) {
      Alert.alert("Hata", "Lütfen başlık ve personel seçin");
      return;
    }

    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, formData);
        if (updated) {
          await loadData();
          setModalVisible(false);
          setViewingTask(null);
          setEditingTask(null);
          Alert.alert("Başarılı", "Görev güncellendi");
        }
      } else {
        const newTask = await createTask(employee.company_id, {
          ...formData,
          region_id: employee.region_id && employee.region_id !== "" ? employee.region_id : null,
        });
        if (newTask) {
          await loadData();
          setModalVisible(false);
          setViewingTask(null);
          setEditingTask(null);
          Alert.alert("Başarılı", "Görev eklendi");
        }
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Hata", "Görev kaydedilemedi");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      "Görev Sil",
      "Bu görevi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteTask(taskId);
            if (success) {
              await loadData();
            } else {
              Alert.alert("Hata", "Görev silinemedi");
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      await loadData();
      Alert.alert("Başarılı", "Görev durumu güncellendi");
    } else {
      Alert.alert("Hata", "Görev durumu güncellenemedi");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchQuery) return true;
    const searchLower = employeeSearchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
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
    
    // Scroll to selected values after a short delay
    setTimeout(() => {
      const itemHeight = 48;
      const currentYear = new Date().getFullYear();
      const yearIndex = tempYear - (currentYear - 5);
      if (yearScrollRef.current && yearIndex >= 0 && yearIndex < 50) {
        yearScrollRef.current.scrollTo({
          y: yearIndex * itemHeight,
          animated: true,
        });
      }
      if (monthScrollRef.current) {
        monthScrollRef.current.scrollTo({
          y: (tempMonth - 1) * itemHeight,
          animated: true,
        });
      }
      if (dayScrollRef.current) {
        dayScrollRef.current.scrollTo({
          y: (tempDay - 1) * itemHeight,
          animated: true,
        });
      }
    }, 150);
  };

  const handleDateConfirm = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    const date = new Date(tempYear, tempMonth - 1, day);
    setSelectedDate(date);
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormData({ ...formData, due_date: formattedDate });
    setShowDatePicker(false);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setEditingTask(null);
    setModalVisible(true);
  };

  const renderTask = ({ item }: { item: Task }) => {
    const assignedEmployee = employees.find((e) => e.id === item.employee_id);
    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => handleViewTask(item)}
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
              {assignedEmployee && (
                <Text
                  style={[
                    styles.taskEmployee,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {assignedEmployee.first_name} {assignedEmployee.last_name}
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
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: theme.colors.secondary || "#6B7280" },
              ]}
              onPress={() => {
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
                    text: "İptal",
                    onPress: () => handleStatusChange(item.id, "cancelled"),
                  },
                  { text: "Vazgeç", style: "cancel" },
                ]);
              }}
            >
              <Icon name="swap-horiz" size={16} color={theme.colors.secondary || "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              onPress={() => handleDeleteTask(item.id)}
            >
              <Icon name="delete" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <React.Fragment>
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Bölge Görevleri
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Bölgenizdeki tüm görevler
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddTask}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { borderBottomColor: theme.colors.gray200 }]}>
        <View style={styles.filterItem}>
          <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
            Durum:
          </Text>
          <TouchableOpacity
            style={[
              styles.filterSelect,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.gray300,
              },
            ]}
            onPress={() => {
              Alert.alert(
                "Durum Filtresi",
                "Filtrelemek istediğiniz durumu seçin",
                [
                  { text: "Tümü", onPress: () => setStatusFilter("all") },
                  { text: "Beklemede", onPress: () => setStatusFilter("pending") },
                  { text: "Devam Ediyor", onPress: () => setStatusFilter("in_progress") },
                  { text: "Tamamlandı", onPress: () => setStatusFilter("completed") },
                  { text: "İptal", onPress: () => setStatusFilter("cancelled") },
                  { text: "İptal", style: "cancel" },
                ]
              );
            }}
          >
            <Text
              style={[
                styles.filterSelectText,
                { color: theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {statusFilter === "all"
                ? "Tüm Durumlar"
                : statusLabels[statusFilter]}
            </Text>
            <Icon name="arrow-drop-down" size={20} color={theme.colors.gray500} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Görevler yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="check-circle-outline"
                size={64}
                color={theme.colors.gray400}
              />
              <Text
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              >
                Henüz görev bulunmuyor
              </Text>
            </View>
          }
        />
      )}

      {/* Task Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="fullScreen"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <StatusBar barStyle="dark-content" />
          <SafeAreaView
            edges={["top"]}
            style={{ backgroundColor: theme.colors.background }}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.colors.gray200,
                  paddingTop: Platform.OS === "ios" ? Math.max(insets.top - 10, 12) : 0,
                },
              ]}
            >
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setViewingTask(null);
                setEditingTask(null);
              }}
              style={styles.modalBackButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {viewingTask
                ? "Görev Detayı"
                : editingTask
                ? "Görevi Düzenle"
                : "Yeni Görev Ekle"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setViewingTask(null);
                setEditingTask(null);
              }}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {viewingTask ? (
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
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingTask.description}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Personel
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {(() => {
                      const emp = employees.find(
                        (e) => e.id === viewingTask.employee_id
                      );
                      return emp
                        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                        : "Atanmamış";
                    })()}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Durum
                  </Text>
                  <View
                    style={[
                      styles.taskStatusBadge,
                      {
                        backgroundColor: statusColors[viewingTask.status] + "20",
                        borderColor: statusColors[viewingTask.status] + "40",
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskStatusText,
                        { color: statusColors[viewingTask.status] },
                      ]}
                    >
                      {statusLabels[viewingTask.status]}
                    </Text>
                  </View>
                </View>

                {viewingTask.due_date && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Son Tarih
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {new Date(viewingTask.due_date).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                )}

                {viewingTask.created_at && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Oluşturulma Tarihi
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {new Date(viewingTask.created_at).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                )}

                {/* Checklist Items */}
                {(() => {
                  let checklistItems = viewingTask.checklist_items || [];
                  let checklistCompleted = viewingTask.checklist_completed || [];
                  
                  // Parse from JSON if string
                  if (typeof checklistItems === 'string') {
                    try {
                      checklistItems = JSON.parse(checklistItems);
                    } catch (e) {
                      checklistItems = [];
                    }
                  }
                  if (typeof checklistCompleted === 'string') {
                    try {
                      checklistCompleted = JSON.parse(checklistCompleted);
                    } catch (e) {
                      checklistCompleted = [];
                    }
                  }
                  
                  if (!Array.isArray(checklistItems) || checklistItems.length === 0) {
                    return null;
                  }
                  
                  return (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Yapılacak İşlemler
                      </Text>
                      <View style={styles.checklistItems}>
                        {checklistItems.map((item: string, index: number) => {
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
                              <Text
                                style={[
                                  styles.checklistItemText,
                                  {
                                    color: theme.colors.text,
                                    textDecorationLine: isCompleted ? "line-through" : "none",
                                    opacity: isCompleted ? 0.6 : 1,
                                  },
                                ]}
                              >
                                {item}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Address */}
                {viewingTask.address && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Adres
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingTask.address}
                    </Text>
                  </View>
                )}

                {/* Attachments */}
                {viewingTask.attachments && viewingTask.attachments.length > 0 && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Dokümanlar
                    </Text>
                    <View style={styles.attachmentsContainer}>
                      {viewingTask.attachments.map((attachment, index) => {
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
                )}

                {/* Edit Button */}
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    if (viewingTask) {
                      // Parse checklist items and attachments from JSON if they're strings
                      let checklistItems: string[] = [];
                      let checklistCompleted: string[] = [];
                      let attachments: string[] = [];
                      
                      if (viewingTask.checklist_items) {
                        if (typeof viewingTask.checklist_items === 'string') {
                          try {
                            checklistItems = JSON.parse(viewingTask.checklist_items);
                          } catch (e) {
                            checklistItems = [];
                          }
                        } else if (Array.isArray(viewingTask.checklist_items)) {
                          checklistItems = viewingTask.checklist_items;
                        }
                      }
                      
                      if (viewingTask.checklist_completed) {
                        if (typeof viewingTask.checklist_completed === 'string') {
                          try {
                            checklistCompleted = JSON.parse(viewingTask.checklist_completed);
                          } catch (e) {
                            checklistCompleted = [];
                          }
                        } else if (Array.isArray(viewingTask.checklist_completed)) {
                          checklistCompleted = viewingTask.checklist_completed;
                        }
                      }
                      
                      if (viewingTask.attachments) {
                        if (typeof viewingTask.attachments === 'string') {
                          try {
                            attachments = JSON.parse(viewingTask.attachments);
                          } catch (e) {
                            attachments = [];
                          }
                        } else if (Array.isArray(viewingTask.attachments)) {
                          attachments = viewingTask.attachments;
                        }
                      }
                      
                      const dueDate = viewingTask.due_date ? new Date(viewingTask.due_date) : new Date();
                      setSelectedDate(dueDate);
                      if (viewingTask.due_date) {
                        const date = new Date(viewingTask.due_date);
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
                        employee_id: viewingTask.employee_id,
                        title: viewingTask.title,
                        description: viewingTask.description || "",
                        status: viewingTask.status,
                        priority: viewingTask.priority,
                        due_date: viewingTask.due_date ? viewingTask.due_date.split("T")[0] : "",
                        region_id: viewingTask.region_id || (employee?.region_id && employee.region_id !== "" ? employee.region_id : null),
                        checklist_items: checklistItems,
                        checklist_completed: checklistCompleted,
                        address: viewingTask.address || "",
                        attachments: attachments,
                      });
                      setViewingTask(null);
                      setEditingTask(viewingTask);
                    }
                  }}
                >
                  <Icon name="edit" size={18} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Düzenle</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Edit/Create Mode - Show form
              <>
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
                  styles.textArea,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
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
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Personel *
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                onPress={() => setEmployeeModalVisible(true)}
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
                    : "Personel seçin"}
                </Text>
                <Icon
                  name="arrow-drop-down"
                  size={24}
                  color={theme.colors.gray500}
                />
              </TouchableOpacity>
            </View>

            {/* Status and Priority */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Durum
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.gray300,
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
                    size={24}
                    color={theme.colors.gray500}
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
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.gray300,
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
                    size={24}
                    color={theme.colors.gray500}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Son Tarih
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                onPress={handleDatePickerOpen}
              >
                <Text
                  style={[
                    styles.selectText,
                    {
                      color: formData.due_date
                        ? theme.colors.text
                        : theme.colors.gray500,
                    },
                  ]}
                >
                  {formData.due_date
                    ? new Date(formData.due_date + "T00:00:00").toLocaleDateString("tr-TR")
                    : "Tarih seçin"}
                </Text>
                <Icon name="event" size={24} color={theme.colors.gray500} />
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
                              onPress={() => setTempYear(year)}
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
                  styles.textArea,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
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
                      // In a real app, you would upload the image to storage and get the URL
                      // For now, we'll use the local URI (this should be replaced with actual upload)
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
                        // In a real app, you would upload the document to storage and get the URL
                        // For now, we'll use the local URI (this should be replaced with actual upload)
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
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.gray200 },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setViewingTask(null);
                  setEditingTask(null);
                }}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.colors.text }]}
                >
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primaryDark },
                ]}
                onPress={handleSaveTask}
              >
                <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Employee Selection Modal */}
          {employeeModalVisible && (
            <View style={styles.employeeModalWrapper}>
              <View style={styles.employeeModalBackdrop} />
              <View
                style={[
                  styles.employeeModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.employeeModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.employeeSearchInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder="Personel ara..."
                    placeholderTextColor={theme.colors.gray500}
                    value={employeeSearchQuery}
                    onChangeText={setEmployeeSearchQuery}
                  />
                  <TouchableOpacity
                    onPress={() => setEmployeeModalVisible(false)}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredEmployees}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.employeeOption,
                        {
                          backgroundColor:
                            formData.employee_id === item.id
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            formData.employee_id === item.id
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, employee_id: item.id });
                        setEmployeeModalVisible(false);
                        setEmployeeSearchQuery("");
                      }}
                    >
                      <View style={styles.employeeOptionContent}>
                        <Text
                          style={[
                            styles.employeeOptionText,
                            {
                              color:
                                formData.employee_id === item.id
                                  ? theme.colors.primary
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {item.first_name} {item.last_name}
                        </Text>
                        {item.job_title && (
                          <Text
                            style={[
                              styles.employeeOptionJob,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {item.job_title}
                          </Text>
                        )}
                      </View>
                      {formData.employee_id === item.id && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.employeeModalScrollView}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>

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
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  filterItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
  },
  filterSelectText: {
    fontSize: 11,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  taskCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  taskEmployee: {
    fontSize: 12,
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  taskCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  modalBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalCloseButton: {
    padding: 8,
    marginRight: -8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  modalContent: {
    flexGrow: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
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
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextWhite: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
    top: "20%",
    left: 0,
    right: 0,
    borderRadius: 20,
    maxHeight: "60%",
    minHeight: "40%",
    zIndex: 1001,
  },
  employeeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  employeeSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  employeeModalScrollView: {
    flex: 1,
    padding: 16,
  },
  employeeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  employeeOptionContent: {
    flex: 1,
  },
  employeeOptionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeeOptionJob: {
    fontSize: 14,
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
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
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
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
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
    backgroundColor: "#F3F4F6",
    gap: 12,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  datePickerContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
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
    padding: 20,
  },
  imageViewerImage: {
    width: "100%",
    aspectRatio: 1,
    minHeight: 300,
    maxWidth: "100%",
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
