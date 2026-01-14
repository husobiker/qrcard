import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { Task, TaskFormData, TaskStatus, TaskPriority, Employee } from "../types";

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

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (formData: TaskFormData) => Promise<void>;
  editingTask?: Task | null;
  employees: Employee[];
  initialFormData?: Partial<TaskFormData>;
}

export default function TaskFormModal({
  visible,
  onClose,
  onSave,
  editingTask,
  employees,
  initialFormData,
}: TaskFormModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
    ...initialFormData,
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState<number>(new Date().getDate());
  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchQuery) return true;
    const searchLower = employeeSearchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    if (editingTask) {
      // Parse checklist items from JSON if they're strings
      let checklistItems = editingTask.checklist_items || [];
      let checklistCompleted = editingTask.checklist_completed || [];
      
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

      setFormData({
        employee_id: editingTask.employee_id,
        title: editingTask.title,
        description: editingTask.description || "",
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date ? editingTask.due_date.split("T")[0] : "",
        checklist_items: Array.isArray(checklistItems) ? checklistItems : [],
        checklist_completed: Array.isArray(checklistCompleted) ? checklistCompleted : [],
        address: editingTask.address || "",
        attachments: editingTask.attachments || [],
      });

      if (editingTask.due_date) {
        const date = new Date(editingTask.due_date);
        setTempYear(date.getFullYear());
        setTempMonth(date.getMonth() + 1);
        setTempDay(date.getDate());
      }
    } else if (initialFormData) {
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
        ...initialFormData,
      });
    }
  }, [editingTask, initialFormData, visible]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
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

  const handleDateConfirm = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const day = Math.min(tempDay, daysInMonth);
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormData({ ...formData, due_date: formattedDate });
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.employee_id) {
      Alert.alert("Hata", "Lütfen başlık ve personel seçin");
      return;
    }
    await onSave(formData);
  };

  const handleClose = () => {
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
      ...initialFormData,
    });
    setNewChecklistItem("");
    setShowDatePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.gray200,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {editingTask ? "Görevi Düzenle" : "Yeni Görev Ekle"}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
        >
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
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        </ScrollView>

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
            onPress={handleClose}
          >
            <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
              İptal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
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
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  employeeModalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  employeeModalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  employeeModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  employeeSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  employeeSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  employeeModalScrollView: {
    maxHeight: 400,
  },
  employeeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
});
