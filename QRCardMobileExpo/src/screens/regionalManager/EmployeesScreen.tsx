import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getEmployeesByRegion, getEmployeeById } from "../../services/employeeService";
import { getTasks } from "../../services/taskService";
import { getLeads } from "../../services/crmService";
import type { Employee, SocialLinks, ExtraLink, Task, TaskStatus, CRMLead } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function RegionalEmployeesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as Employee;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [employeeLeads, setEmployeeLeads] = useState<CRMLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  useEffect(() => {
    if (employee && employee.region_id) {
      loadEmployees();
    }
  }, [employee]);

  const loadEmployees = async () => {
    if (!employee || !employee.region_id) return;

    setLoading(true);
    try {
      const employeesData = await getEmployeesByRegion(employee.region_id);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeePress = async (emp: Employee) => {
    setModalVisible(true);
    setLoadingEmployeeDetails(true);
    setLoadingTasks(true);
    setLoadingLeads(true);
    try {
      // Fetch full employee details from database
      const fullEmployee = await getEmployeeById(emp.id);
      if (fullEmployee) {
        setSelectedEmployee(fullEmployee);
        // Load tasks and leads for this employee
        if (fullEmployee.company_id) {
          const [tasks, leads] = await Promise.all([
            getTasks(fullEmployee.company_id, fullEmployee.id),
            getLeads(fullEmployee.company_id, fullEmployee.id)
          ]);
          setEmployeeTasks(tasks);
          setEmployeeLeads(leads);
        }
      } else {
        // Fallback to the employee from list if fetch fails
        setSelectedEmployee(emp);
        if (emp.company_id) {
          const [tasks, leads] = await Promise.all([
            getTasks(emp.company_id, emp.id),
            getLeads(emp.company_id, emp.id)
          ]);
          setEmployeeTasks(tasks);
          setEmployeeLeads(leads);
        }
      }
    } catch (error) {
      console.error("Error loading employee details:", error);
      setSelectedEmployee(emp);
      setEmployeeTasks([]);
      setEmployeeLeads([]);
    } finally {
      setLoadingEmployeeDetails(false);
      setLoadingTasks(false);
      setLoadingLeads(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEmployee(null);
    setEmployeeTasks([]);
    setEmployeeLeads([]);
  };

  const getTaskStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "in_progress":
        return "#3B82F6";
      case "completed":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getTaskStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "in_progress":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal";
      default:
        return status;
    }
  };

  const getLeadStatusColor = (status: string): string => {
    switch (status) {
      case "Satış Yapıldı":
        return "#10B981";
      case "Takipte":
        return "#F59E0B";
      case "Reddedildi":
        return "#EF4444";
      case "Görüşüldü":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const renderEmployeeItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={[
        styles.employeeCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => handleEmployeePress(item)}
    >
      {item.profile_image_url ? (
        <Image
          key={`employee-photo-${item.id}-${item.profile_image_url}`}
          source={{ uri: `${item.profile_image_url}?t=${Date.now()}` }}
          style={styles.employeePhoto}
        />
      ) : (
        <View
          style={[
            styles.employeeAvatar,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.employeeAvatarText}>
            {item.first_name?.charAt(0) || ""}
            {item.last_name?.charAt(0) || ""}
          </Text>
        </View>
      )}
      <View style={styles.employeeInfo}>
        <Text style={[styles.employeeName, { color: theme.colors.text }]}>
          {item.first_name || ""} {item.last_name || ""}
        </Text>
        {item.job_title && (
          <Text
            style={[styles.employeeJobTitle, { color: theme.colors.textSecondary }]}
          >
            {item.job_title}
            {item.department && ` • ${item.department}`}
          </Text>
        )}
        {item.role && (
          <Text
            style={[styles.employeeRole, { color: theme.colors.textSecondary }]}
          >
            Rol: {item.role}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.gray500} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Bölge Personelleri
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Bölgenizdeki tüm personeller
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Personeller yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={renderEmployeeItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadEmployees}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="people-outline"
                size={64}
                color={theme.colors.gray400}
              />
              <Text
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              >
                Bu bölgede henüz personel bulunmuyor
              </Text>
            </View>
          }
        />
      )}

      {/* Employee Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
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
              onPress={handleCloseModal}
              style={styles.modalBackButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Personel Detayı
            </Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            </View>
          </SafeAreaView>

          {loadingEmployeeDetails ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                Detaylar yükleniyor...
              </Text>
            </View>
          ) : selectedEmployee ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalEmployeeHeader}>
                {selectedEmployee.profile_image_url ? (
                  <Image
                    source={{ uri: selectedEmployee.profile_image_url }}
                    style={styles.modalEmployeePhoto}
                  />
                ) : (
                  <View
                    style={[
                      styles.modalEmployeeAvatar,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.modalEmployeeAvatarText}>
                      {selectedEmployee.first_name?.charAt(0) || ""}
                      {selectedEmployee.last_name?.charAt(0) || ""}
                    </Text>
                  </View>
                )}
                <View style={styles.modalEmployeeNameContainer}>
                  <Text
                    style={[styles.modalEmployeeName, { color: theme.colors.text }]}
                  >
                    {selectedEmployee.first_name || ""}{" "}
                    {selectedEmployee.last_name || ""}
                  </Text>
                  {selectedEmployee.role && (
                    <Text
                      style={[
                        styles.modalEmployeeRole,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {selectedEmployee.role}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailSection}>
                {selectedEmployee.job_title && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="work"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Pozisyon
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.job_title}
                        {selectedEmployee.department &&
                          ` • ${selectedEmployee.department}`}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.phone && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="phone"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Telefon
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.phone}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.email && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="email"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        E-posta
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.email}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.username && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="person"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Kullanıcı Adı
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.username}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.about && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="info"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Hakkında
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.about}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.meeting_link && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="video-call"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Toplantı Linki
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.primary }]}
                        numberOfLines={1}
                      >
                        {selectedEmployee.meeting_link}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.social_links &&
                  Object.keys(selectedEmployee.social_links).length > 0 && (
                    <View style={styles.detailRow}>
                      <Icon
                        name="share"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.detailIcon}
                      />
                      <View style={styles.detailContent}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Sosyal Medya
                        </Text>
                        <View style={styles.socialLinksContainer}>
                          {(selectedEmployee.social_links as SocialLinks).instagram && (
                            <View style={styles.socialLinkItem}>
                              <Icon name="instagram" size={16} color={theme.colors.primary} />
                              <Text
                                style={[
                                  styles.socialLinkText,
                                  { color: theme.colors.text },
                                ]}
                              >
                                Instagram
                              </Text>
                            </View>
                          )}
                          {(selectedEmployee.social_links as SocialLinks).linkedin && (
                            <View style={styles.socialLinkItem}>
                              <Icon name="linkedin" size={16} color={theme.colors.primary} />
                              <Text
                                style={[
                                  styles.socialLinkText,
                                  { color: theme.colors.text },
                                ]}
                              >
                                LinkedIn
                              </Text>
                            </View>
                          )}
                          {(selectedEmployee.social_links as SocialLinks).facebook && (
                            <View style={styles.socialLinkItem}>
                              <Icon name="facebook" size={16} color={theme.colors.primary} />
                              <Text
                                style={[
                                  styles.socialLinkText,
                                  { color: theme.colors.text },
                                ]}
                              >
                                Facebook
                              </Text>
                            </View>
                          )}
                          {(selectedEmployee.social_links as SocialLinks).youtube && (
                            <View style={styles.socialLinkItem}>
                              <Icon name="youtube" size={16} color={theme.colors.primary} />
                              <Text
                                style={[
                                  styles.socialLinkText,
                                  { color: theme.colors.text },
                                ]}
                              >
                                YouTube
                              </Text>
                            </View>
                          )}
                          {(selectedEmployee.social_links as SocialLinks).whatsapp && (
                            <View style={styles.socialLinkItem}>
                              <Icon name="chat" size={16} color={theme.colors.primary} />
                              <Text
                                style={[
                                  styles.socialLinkText,
                                  { color: theme.colors.text },
                                ]}
                              >
                                WhatsApp
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                {selectedEmployee.extra_links &&
                  selectedEmployee.extra_links.length > 0 && (
                    <View style={styles.detailRow}>
                      <Icon
                        name="link"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.detailIcon}
                      />
                      <View style={styles.detailContent}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Ek Linkler
                        </Text>
                        {selectedEmployee.extra_links.map((link: ExtraLink, index: number) => (
                          <View key={index} style={styles.extraLinkItem}>
                            <Text
                              style={[styles.detailValue, { color: theme.colors.primary }]}
                            >
                              {link.title}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                {selectedEmployee.cv_url && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="description"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        CV
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.primary }]}
                      >
                        Mevcut
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.pdf_url && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="picture-as-pdf"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        PDF
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.primary }]}
                      >
                        Mevcut
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.default_duration_minutes && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="schedule"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Varsayılan Toplantı Süresi
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {selectedEmployee.default_duration_minutes} dakika
                      </Text>
                    </View>
                  </View>
                )}

                {selectedEmployee.created_at && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="calendar-today"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.detailIcon}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Kayıt Tarihi
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: theme.colors.text }]}
                      >
                        {new Date(selectedEmployee.created_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Tasks Section */}
              <View style={styles.tasksSection}>
                <View style={styles.tasksSectionHeader}>
                  <Icon
                    name="assignment"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text
                    style={[
                      styles.tasksSectionTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Görevler ({employeeTasks.length})
                  </Text>
                </View>

                {loadingTasks ? (
                  <View style={styles.tasksLoadingContainer}>
                    <Text
                      style={[
                        styles.tasksLoadingText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Görevler yükleniyor...
                    </Text>
                  </View>
                ) : employeeTasks.length > 0 ? (
                  <View style={styles.tasksList}>
                    {employeeTasks.map((task) => {
                      const statusColor = getTaskStatusColor(task.status);
                      const statusLabel = getTaskStatusLabel(task.status);
                      return (
                        <TouchableOpacity
                          key={task.id}
                          style={[
                            styles.taskItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.gray200,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedTask(task);
                            setTaskModalVisible(true);
                          }}
                        >
                          <View style={styles.taskItemContent}>
                            <Text
                              style={[
                                styles.taskTitle,
                                { color: theme.colors.text },
                              ]}
                              numberOfLines={2}
                            >
                              {task.title}
                            </Text>
                            {task.description && (
                              <Text
                                style={[
                                  styles.taskDescription,
                                  { color: theme.colors.textSecondary },
                                ]}
                                numberOfLines={2}
                              >
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskItemFooter}>
                              <View
                                style={[
                                  styles.taskStatusBadge,
                                  {
                                    backgroundColor: statusColor + "20",
                                    borderColor: statusColor + "40",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.taskStatusText,
                                    { color: statusColor },
                                  ]}
                                >
                                  {statusLabel}
                                </Text>
                              </View>
                              {task.due_date && (
                                <View style={styles.taskDueDate}>
                                  <Icon
                                    name="schedule"
                                    size={12}
                                    color={theme.colors.textSecondary}
                                  />
                                  <Text
                                    style={[
                                      styles.taskDueDateText,
                                      { color: theme.colors.textSecondary },
                                    ]}
                                  >
                                    {" "}
                                    {new Date(task.due_date).toLocaleDateString(
                                      "tr-TR",
                                      {
                                        day: "numeric",
                                        month: "short",
                                      }
                                    )}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.tasksEmptyContainer}>
                    <Text
                      style={[
                        styles.tasksEmptyText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Bu personelin henüz görevi bulunmuyor
                    </Text>
                  </View>
                )}
              </View>

              {/* Customers Section */}
              <View style={styles.tasksSection}>
                <View style={styles.tasksSectionHeader}>
                  <Icon
                    name="people"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text
                    style={[
                      styles.tasksSectionTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Müşteriler ({employeeLeads.length})
                  </Text>
                </View>

                {loadingLeads ? (
                  <View style={styles.tasksLoadingContainer}>
                    <Text
                      style={[
                        styles.tasksLoadingText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Müşteriler yükleniyor...
                    </Text>
                  </View>
                ) : employeeLeads.length > 0 ? (
                  <View style={styles.tasksList}>
                    {employeeLeads.map((lead) => {
                      const statusColor = getLeadStatusColor(lead.status);
                      const statusLabel = lead.status;
                      const isNewStatus = lead.status === "Yeni";
                      
                      return (
                        <TouchableOpacity
                          key={lead.id}
                          style={[
                            styles.leadCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.gray200,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedLead(lead);
                            setLeadModalVisible(true);
                          }}
                        >
                          <View style={styles.leadCardContent}>
                            {isNewStatus && (
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>Yeni</Text>
                              </View>
                            )}
                            <View style={styles.leadCardHeader}>
                              <Text
                                style={[
                                  styles.leadCardTitle,
                                  { color: theme.colors.text },
                                ]}
                                numberOfLines={2}
                              >
                                {lead.customer_name}
                              </Text>
                            </View>
                            {lead.contact_name && (
                              <Text
                                style={[
                                  styles.leadCardDescription,
                                  { color: theme.colors.textSecondary },
                                ]}
                                numberOfLines={1}
                              >
                                İletişim: {lead.contact_name}
                              </Text>
                            )}
                            {!isNewStatus && (
                              <View style={styles.leadCardFooter}>
                                <View
                                  style={[
                                    styles.leadStatusBadge,
                                    {
                                      backgroundColor: statusColor + "20",
                                      borderColor: statusColor + "40",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.leadStatusText,
                                      { color: statusColor },
                                    ]}
                                  >
                                    {statusLabel}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.tasksEmptyContainer}>
                    <Text
                      style={[
                        styles.tasksEmptyText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Bu personelin henüz müşterisi bulunmuyor
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}

          {/* Lead Detail Modal - Inside Employee Detail Modal */}
          <Modal
        visible={leadModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setLeadModalVisible(false);
          setSelectedLead(null);
        }}
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
                  setLeadModalVisible(false);
                  setSelectedLead(null);
                }}
                style={styles.modalBackButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Müşteri Detayı
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLeadModalVisible(false);
                  setSelectedLead(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {selectedLead && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Müşteri Adı
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedLead.customer_name}
                </Text>
              </View>

              {selectedLead.contact_name && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    İletişim Kişisi
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.contact_name}
                  </Text>
                </View>
              )}

              {selectedLead.phone && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Telefon
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.phone}
                  </Text>
                </View>
              )}

              {selectedLead.email && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    E-posta
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.email}
                  </Text>
                </View>
              )}

              {selectedLead.tc_no && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    TC No
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.tc_no}
                  </Text>
                </View>
              )}

              {selectedLead.tax_no && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Vergi No
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.tax_no}
                  </Text>
                </View>
              )}

              {selectedLead.address && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Adres
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.address}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Durum
                </Text>
                <View
                  style={[
                    styles.leadStatusBadge,
                    {
                      backgroundColor: getLeadStatusColor(selectedLead.status) + "20",
                      borderColor: getLeadStatusColor(selectedLead.status) + "40",
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.leadStatusText,
                      { color: getLeadStatusColor(selectedLead.status) },
                    ]}
                  >
                    {selectedLead.status}
                  </Text>
                </View>
              </View>

              {selectedLead.notes && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Notlar
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLead.notes}
                  </Text>
                </View>
              )}

              {selectedLead.follow_up_date && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Takip Tarihi
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {new Date(selectedLead.follow_up_date).toLocaleDateString(
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

              {selectedLead.created_at && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {new Date(selectedLead.created_at).toLocaleDateString(
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
            </ScrollView>
          )}
        </View>
          </Modal>

          {/* Task Detail Modal - Inside Employee Detail Modal */}
          <Modal
            visible={taskModalVisible}
            animationType="slide"
            onRequestClose={() => {
              setTaskModalVisible(false);
              setSelectedTask(null);
            }}
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
                      setTaskModalVisible(false);
                      setSelectedTask(null);
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
                      setTaskModalVisible(false);
                      setSelectedTask(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {selectedTask && (
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Başlık
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {selectedTask.title}
                    </Text>
                  </View>

                  {selectedTask.description && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Açıklama
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {selectedTask.description}
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
                          backgroundColor:
                            getTaskStatusColor(selectedTask.status) + "20",
                          borderColor:
                            getTaskStatusColor(selectedTask.status) + "40",
                          alignSelf: "flex-start",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusText,
                          { color: getTaskStatusColor(selectedTask.status) },
                        ]}
                      >
                        {getTaskStatusLabel(selectedTask.status)}
                      </Text>
                    </View>
                  </View>

                  {selectedTask.due_date && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Son Tarih
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {new Date(selectedTask.due_date).toLocaleDateString(
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

                  {selectedTask.created_at && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Oluşturulma Tarihi
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {new Date(selectedTask.created_at).toLocaleDateString(
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
                    let checklistItems = selectedTask.checklist_items || [];
                    let checklistCompleted = selectedTask.checklist_completed || [];
                    
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
                  {selectedTask.address && (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Adres
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {selectedTask.address}
                      </Text>
                    </View>
                  )}

                  {/* Attachments */}
                  {(() => {
                    let attachments = selectedTask.attachments || [];
                    
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
                </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  employeePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  employeeAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  employeeInfo: {
    flex: 1,
    marginRight: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  employeeJobTitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  employeeRole: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
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
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  modalEmployeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalEmployeePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: "#ccc",
  },
  modalEmployeeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmployeeAvatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  modalEmployeeNameContainer: {
    flex: 1,
  },
  modalEmployeeName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalEmployeeRole: {
    fontSize: 16,
  },
  detailSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  socialLinksContainer: {
    marginTop: 4,
  },
  socialLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  socialLinkText: {
    fontSize: 14,
    marginLeft: 8,
  },
  extraLinkItem: {
    marginBottom: 8,
  },
  tasksSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tasksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  tasksLoadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  tasksLoadingText: {
    fontSize: 14,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  taskItemContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  taskItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
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
  taskDueDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskDueDateText: {
    fontSize: 12,
  },
  tasksEmptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  tasksEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#6B7280",
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
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
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
    backgroundColor: "rgba(0, 0, 0, 0.95)",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1001,
  },
  imageViewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 16,
  },
  imageViewerCloseButton: {
    padding: 8,
  },
  imageViewerScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
    minWidth: 300,
    minHeight: 300,
    maxWidth: "100%",
    maxHeight: "100%",
  },
  leadCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  leadCardContent: {
    position: "relative",
  },
  newBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  leadCardHeader: {
    marginBottom: 8,
    paddingRight: 40,
  },
  leadCardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  leadCardDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  leadCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  leadStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  leadStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
