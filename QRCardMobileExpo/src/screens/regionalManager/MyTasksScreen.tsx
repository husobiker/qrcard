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
  Image,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getTasks, updateTaskStatus, updateTask } from "../../services/taskService";
import type { Task, TaskStatus, Employee } from "../../types";
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

export default function RegionalManagerMyTasksScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

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

  const handleToggleChecklistItem = async (task: Task, item: string) => {
    if (!task || !employee || !employee.company_id) {
      console.log("handleToggleChecklistItem: Missing task or employee");
      return;
    }

    try {
      // Parse checklist items
      let checklistItems = task.checklist_items || [];
      let checklistCompleted = task.checklist_completed || [];
      
      if (typeof checklistItems === 'string') {
        try {
          checklistItems = JSON.parse(checklistItems);
        } catch (e) {
          console.error("Error parsing checklist_items:", e);
          checklistItems = [];
        }
      }
      if (typeof checklistCompleted === 'string') {
        try {
          checklistCompleted = JSON.parse(checklistCompleted);
        } catch (e) {
          console.error("Error parsing checklist_completed:", e);
          checklistCompleted = [];
        }
      }
      
      if (!Array.isArray(checklistItems)) {
        console.log("checklistItems is not an array:", checklistItems);
        return;
      }
      if (!Array.isArray(checklistCompleted)) {
        console.log("checklistCompleted is not an array:", checklistCompleted);
        checklistCompleted = [];
      }

      // Toggle item
      const isCompleted = checklistCompleted.includes(item);
      let newChecklistCompleted: string[];
      
      if (isCompleted) {
        newChecklistCompleted = checklistCompleted.filter(i => i !== item);
      } else {
        newChecklistCompleted = [...checklistCompleted, item];
      }

      console.log("Updating checklist_completed:", newChecklistCompleted);

      // Update task
      const updated = await updateTask(task.id, {
        checklist_completed: newChecklistCompleted,
      });

      if (updated) {
        console.log("Task updated successfully:", updated);
        // Update viewingTask with the updated task
        if (viewingTask && viewingTask.id === task.id) {
          setViewingTask(updated);
        }
        // Reload tasks to sync the list
        await loadData();
      } else {
        console.error("updateTask returned null");
        Alert.alert("Hata", "Görev güncellenemedi");
      }
    } catch (error) {
      console.error("Error toggling checklist item:", error);
      Alert.alert("Hata", "Checklist güncellenemedi: " + (error as Error).message);
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
                            <TouchableOpacity
                              key={index}
                              style={styles.checklistItemRow}
                              onPress={() => handleToggleChecklistItem(viewingTask, item)}
                              activeOpacity={0.7}
                            >
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
                            </TouchableOpacity>
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
                {(() => {
                  let attachments = viewingTask.attachments || [];
                  
                  // Parse from JSON if string
                  if (typeof attachments === 'string') {
                    try {
                      attachments = JSON.parse(attachments);
                    } catch (e) {
                      attachments = [];
                    }
                  }
                  
                  if (!Array.isArray(attachments) || attachments.length === 0) {
                    return null;
                  }
                  
                  return (
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
                  );
                })()}
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
                    Alert.alert(
                      "Durum Seçin",
                      "Görev durumunu seçin:",
                      [
                        {
                          text: "Beklemede",
                          onPress: () => handleStatusChange(viewingTask.id, "pending"),
                        },
                        {
                          text: "Devam Ediyor",
                          onPress: () => handleStatusChange(viewingTask.id, "in_progress"),
                        },
                        {
                          text: "Tamamlandı",
                          onPress: () => handleStatusChange(viewingTask.id, "completed"),
                        },
                        {
                          text: "İptal",
                          onPress: () => handleStatusChange(viewingTask.id, "cancelled"),
                        },
                        { text: "Vazgeç", style: "cancel" },
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
                        Alert.alert("Hata", "Görüntü yüklenemedi");
                        setViewingAttachment(null);
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
  imageViewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
});
