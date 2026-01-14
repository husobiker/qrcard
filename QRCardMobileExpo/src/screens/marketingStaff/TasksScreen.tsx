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
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getTasks, updateTaskStatus } from "../../services/taskService";
import type { Task, TaskStatus } from "../../types";
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

export default function MarketingStaffTasksScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as any;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  useEffect(() => {
    if (employee && employee.company_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      // Load only tasks assigned to this employee
      const tasksData = await getTasks(employee.company_id, employee.id);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setModalVisible(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      await loadData();
      if (viewingTask && viewingTask.id === taskId) {
        setViewingTask({ ...viewingTask, status: newStatus });
      }
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

  const renderTask = ({ item }: { item: Task }) => {
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
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text
                style={[styles.taskDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}
            <View style={styles.taskCardInfo}>
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
              {item.due_date && (
                <View style={styles.taskDateContainer}>
                  <Icon name="event" size={14} color={theme.colors.gray500} />
                  <Text
                    style={[styles.taskDate, { color: theme.colors.textSecondary }]}
                  >
                    {new Date(item.due_date).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.statusButton,
              {
                backgroundColor: statusColors[item.status] + "20",
                borderColor: statusColors[item.status],
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed"];
              const currentIndex = statusOptions.indexOf(item.status);
              const nextStatus = statusOptions[currentIndex + 1] || statusOptions[0];
              
              Alert.alert(
                "Durum Değiştir",
                `Görevi "${statusLabels[nextStatus]}" olarak işaretlemek istediğinize emin misiniz?`,
                [
                  { text: "İptal", style: "cancel" },
                  {
                    text: "Evet",
                    onPress: () => handleStatusChange(item.id, nextStatus),
                  },
                ]
              );
            }}
          >
            <Icon name="check-circle" size={20} color={statusColors[item.status]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Görevlerim
        </Text>
      </View>

      {/* Status Filter */}
      <View style={[styles.filtersContainer, { borderBottomColor: theme.colors.gray200 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  statusFilter === "all"
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor: theme.colors.gray300,
              },
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: statusFilter === "all" ? "#FFFFFF" : theme.colors.text,
                },
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          {(["pending", "in_progress", "completed"] as TaskStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === status
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor: theme.colors.gray300,
                },
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: statusFilter === status ? "#FFFFFF" : theme.colors.text,
                  },
                ]}
              >
                {statusLabels[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {statusFilter !== "all"
                ? "Bu durumda görev bulunmuyor"
                : "Henüz size atanmış görev yok"}
            </Text>
          </View>
        }
      />

      {/* Task Detail Modal */}
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
                }}
                style={styles.modalBackButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Görev Detayı
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setViewingTask(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {viewingTask && (
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
                      {new Date(viewingTask.due_date).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
                      {new Date(viewingTask.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {viewingTask && (
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.colors.gray200 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.colors.primaryDark,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                onPress={() => {
                  if (viewingTask) {
                    const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed"];
                    const currentIndex = statusOptions.indexOf(viewingTask.status);
                    const nextStatus = statusOptions[currentIndex + 1] || statusOptions[0];
                    
                    Alert.alert(
                      "Durum Değiştir",
                      `Görevi "${statusLabels[nextStatus]}" olarak işaretlemek istediğinize emin misiniz?`,
                      [
                        { text: "İptal", style: "cancel" },
                        {
                          text: "Evet",
                          onPress: () => handleStatusChange(viewingTask.id, nextStatus),
                        },
                      ]
                    );
                  }
                }}
              >
                <Icon name="check-circle" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonTextWhite, { marginLeft: 8 }]}>
                  Durumu Güncelle
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
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
  taskCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskCardMain: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  taskDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDate: {
    fontSize: 12,
  },
  statusButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: 48,
    height: 48,
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
  modalButtonTextWhite: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
