import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getCompanyByUserId } from "../../services/companyService";
import {
  getEmployeesByCompany,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeePhoto,
  type EmployeeFormData,
} from "../../services/employeeService";
import { getRegionsByCompany, createRegion } from "../../services/regionService";
import { FIXED_ROLES, type Region } from "../../types";
import {
  getEmployeeSipSettings,
  createEmployeeSipSettings,
  updateEmployeeSipSettings,
  type EmployeeSipSettingsFormData,
} from "../../services/sipSettingsService";
import type { AvailableHours, SocialLinks } from "../../types";
import {
  getAppointmentsByEmployee,
  updateAppointmentStatus,
  deleteAppointment,
} from "../../services/appointmentService";
import { getEmployeePublicUrl } from "../../utils/url";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { Employee, Appointment, Task, CRMLead } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { getTasks } from "../../services/taskService";
import { getLeads } from "../../services/crmService";

export default function EmployeesScreen() {
  const { user, userType } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [appointmentsModalVisible, setAppointmentsModalVisible] =
    useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const defaultAvailableHours: AvailableHours = {
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  };

  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    job_title: "",
    department: "",
    phone: "",
    email: "",
    about: "",
    social_links: {},
    available_hours: defaultAvailableHours,
    default_duration_minutes: 30,
    password: "",
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [sipSettings, setSipSettings] = useState({
    sip_username: "",
    sip_password: "",
    extension: "",
    sip_server: "",
    sip_port: 5060,
    webrtc_enabled: false,
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [addRegionModalVisible, setAddRegionModalVisible] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionDescription, setNewRegionDescription] = useState("");
  const [creatingRegion, setCreatingRegion] = useState(false);
  const [employeeDetailModalVisible, setEmployeeDetailModalVisible] = useState(false);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [employeeLeads, setEmployeeLeads] = useState<CRMLead[]>([]);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('EmployeesScreen: Loading data for user:', user.id);
      const company = await getCompanyByUserId(user.id);
      console.log('EmployeesScreen: Company found:', company?.id);
      if (company) {
        setCompanyId(company.id);
        const employeesData = await getEmployeesByCompany(company.id);
        console.log('EmployeesScreen: Employees data:', employeesData?.length || 0, 'employees');
        setEmployees(employeesData);
        // Load regions
        const regionsData = await getRegionsByCompany(company.id);
        setRegions(regionsData);
      } else {
        console.log('EmployeesScreen: No company found for user');
      }
    } catch (error) {
      console.error("Error loading data:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeePress = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailModalVisible(true);
    setLoadingEmployeeDetails(true);
    
    // Load employee tasks and leads
    try {
      if (companyId) {
        const [tasks, leads] = await Promise.all([
          getTasks(companyId, employee.id),
          getLeads(companyId, employee.id),
        ]);
        // Filter out completed and cancelled tasks
        const filteredTasks = tasks.filter(
          (task) => task.status !== "completed" && task.status !== "cancelled"
        );
        // Filter out "Satış Yapıldı" and "Reddedildi" leads
        const filteredLeads = leads.filter(
          (lead) => lead.status !== "Satış Yapıldı" && lead.status !== "Reddedildi"
        );
        setEmployeeTasks(filteredTasks);
        setEmployeeLeads(filteredLeads);
      }
    } catch (error) {
      console.error("Error loading employee details:", error);
    } finally {
      setLoadingEmployeeDetails(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      job_title: "",
      department: "",
      phone: "",
      email: "",
      about: "",
      social_links: {},
      available_hours: defaultAvailableHours,
      default_duration_minutes: 30,
      password: "",
    });
    setPhotoUri(null);
    setPhotoPreview(null);
    setPhotoUrl("");
    setSelectedRole(null);
    setSelectedRegionId(null);
    setSipSettings({
      sip_username: "",
      sip_password: "",
      extension: "",
      sip_server: "",
      sip_port: 5060,
      webrtc_enabled: false,
    });
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    resetForm();
    setModalVisible(true);
  };

  const handleAddRegion = async () => {
    if (!companyId || !newRegionName.trim()) {
      Alert.alert("Hata", "Lütfen bölge adını girin");
      return;
    }

    setCreatingRegion(true);
    try {
      const newRegion = await createRegion(companyId, {
        name: newRegionName.trim(),
        description: newRegionDescription.trim() || undefined,
      });

      if (newRegion) {
        // Refresh regions list
        const regionsData = await getRegionsByCompany(companyId);
        setRegions(regionsData);
        
        // Select the newly created region
        setSelectedRegionId(newRegion.id);
        
        // Close modals and reset form
        setAddRegionModalVisible(false);
        setRegionModalVisible(false);
        setNewRegionName("");
        setNewRegionDescription("");
        
        Alert.alert("Başarılı", "Bölge başarıyla eklendi");
      } else {
        Alert.alert("Hata", "Bölge eklenemedi");
      }
    } catch (error) {
      console.error("Error adding region:", error);
      Alert.alert("Hata", "Bölge eklenirken bir hata oluştu");
    } finally {
      setCreatingRegion(false);
    }
  };

  const handleEditEmployee = async (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      job_title: employee.job_title || "",
      department: employee.department || "",
      phone: employee.phone || "",
      email: employee.email || "",
      about: employee.about || "",
      social_links: (employee.social_links as SocialLinks) || {},
      available_hours:
        (employee.available_hours as AvailableHours) || defaultAvailableHours,
      default_duration_minutes: employee.default_duration_minutes || 30,
      password: "",
    });
    setPhotoUri(null);
    setPhotoPreview(employee.profile_image_url || null);
    setPhotoUrl(
      employee.profile_image_url &&
        employee.profile_image_url.startsWith("http")
        ? employee.profile_image_url
        : ""
    );

    // Set role and region
    setSelectedRole(employee.role || null);
    setSelectedRegionId(employee.region_id || null);

    // Load SIP settings
    const sip = await getEmployeeSipSettings(employee.id);
    if (sip) {
      setSipSettings({
        sip_username: sip.sip_username,
        sip_password: "",
        extension: sip.extension || "",
        sip_server: sip.sip_server || "",
        sip_port: sip.sip_port || 5060,
        webrtc_enabled: sip.webrtc_enabled,
      });
    } else {
      setSipSettings({
        sip_username: "",
        sip_password: "",
        extension: "",
        sip_server: "",
        sip_port: 5060,
        webrtc_enabled: false,
      });
    }

    setActionSheetVisible(false);
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Fotoğraf seçmek için galeri erişim izni gereklidir."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoPreview(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Image picker error:", error);
      Alert.alert(
        "Development Build Gerekli",
        "Fotoğraf seçmek için development build gerekiyor. Form'da URL ile fotoğraf ekleyebilirsiniz."
      );
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    Alert.alert(
      "Personel Sil",
      `${employee?.first_name || ""} ${employee?.last_name || ""} adlı personeli silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteEmployee(employee.id);
            if (success) {
              await loadData();
            } else {
              Alert.alert("Hata", "Personel silinemedi");
            }
          },
        },
      ]
    );
    setActionSheetVisible(false);
  };

  const handleSaveEmployee = async () => {
    if (!companyId) return;
    if (!formData.first_name || !formData.last_name) {
      Alert.alert("Hata", "Ad ve soyad zorunludur");
      return;
    }

    try {
      let profileImageUrl = editingEmployee?.profile_image_url || null;

      // Upload photo if new photo selected (only if it's a local URI, not a URL)
      if (photoUri && editingEmployee) {
        const uploadedUrl = await uploadEmployeePhoto(
          photoUri,
          editingEmployee.id
        );
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      } else if (
        photoUrl &&
        photoUrl.trim().startsWith("http") &&
        editingEmployee
      ) {
        // If it's a URL (not local file), use it directly
        profileImageUrl = photoUrl.trim();
      } else if (
        photoPreview &&
        photoPreview.startsWith("http") &&
        !photoUri &&
        editingEmployee
      ) {
        // Fallback: if photoPreview is a URL
        profileImageUrl = photoPreview;
      }

      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, {
          ...formData,
          profile_image_url: profileImageUrl,
          role: selectedRole,
          region_id: selectedRegionId,
        });
        if (updated) {
          // Save/update SIP settings
          if (sipSettings.sip_username) {
            const existingSip = await getEmployeeSipSettings(
              editingEmployee.id
            );
            if (existingSip) {
              await updateEmployeeSipSettings(editingEmployee.id, {
                employee_id: editingEmployee.id,
                sip_username: sipSettings.sip_username,
                sip_password:
                  sipSettings.sip_password || existingSip.sip_password,
                extension: sipSettings.extension,
                sip_server: sipSettings.sip_server,
                sip_port: sipSettings.sip_port,
                webrtc_enabled: sipSettings.webrtc_enabled,
              });
            } else if (companyId) {
              await createEmployeeSipSettings(companyId, {
                employee_id: editingEmployee.id,
                sip_username: sipSettings.sip_username,
                sip_password: sipSettings.sip_password,
                extension: sipSettings.extension,
                sip_server: sipSettings.sip_server,
                sip_port: sipSettings.sip_port,
                webrtc_enabled: sipSettings.webrtc_enabled,
              });
            }
          }
          // Role and region are already included in updateEmployee call above
          await loadData();
          setModalVisible(false);
          resetForm();
          setPhotoUrl("");
          Alert.alert("Başarılı", "Personel güncellendi");
        } else {
          Alert.alert("Hata", "Personel güncellenemedi");
        }
      } else {
        const newEmployee = await createEmployee(companyId, {
          ...formData,
          role: selectedRole,
          region_id: selectedRegionId,
        });
        if (newEmployee) {
          if (photoUri) {
            // Upload photo for new employee (local file)
            const uploadedUrl = await uploadEmployeePhoto(
              photoUri,
              newEmployee.id
            );
            if (uploadedUrl) {
              await updateEmployee(newEmployee.id, {
                profile_image_url: uploadedUrl,
              });
            }
          } else if (photoUrl && photoUrl.trim().startsWith("http")) {
            // If it's a URL (not local file), use it directly
            await updateEmployee(newEmployee.id, {
              profile_image_url: photoUrl.trim(),
            });
          } else if (
            photoPreview &&
            photoPreview.startsWith("http") &&
            !photoUri
          ) {
            // Fallback: if photoPreview is a URL
            await updateEmployee(newEmployee.id, {
              profile_image_url: photoPreview,
            });
          }
          // Save SIP settings if provided
          if (sipSettings.sip_username && companyId) {
            await createEmployeeSipSettings(companyId, {
              employee_id: newEmployee.id,
              sip_username: sipSettings.sip_username,
              sip_password: sipSettings.sip_password,
              extension: sipSettings.extension,
              sip_server: sipSettings.sip_server,
              sip_port: sipSettings.sip_port,
              webrtc_enabled: sipSettings.webrtc_enabled,
            });
          }
          // Role and region are already included in createEmployee call above
          await loadData();
          setModalVisible(false);
          resetForm();
          setPhotoUrl("");
          Alert.alert(
            "Başarılı",
            `Personel eklendi!\nKullanıcı adı: ${
              newEmployee.username
            }\nŞifre: ${formData.password || "Ayarlanmadı"}`
          );
        } else {
          Alert.alert("Hata", "Personel eklenemedi");
        }
      }
    } catch (error: any) {
      console.error("Error saving employee:", error);
      Alert.alert("Hata", error?.message || "Personel kaydedilemedi");
    }
  };

  const renderEmployee = ({ item }: { item: Employee }) => {
    if (!item || !item.first_name || !item.last_name) {
      return null;
    }
    const initials = `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();

    return (
      <TouchableOpacity
        style={[
          styles.employeeCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        onPress={() => handleEmployeePress(item)}
      >
        <View style={styles.employeeHeader}>
          {item.profile_image_url ? (
            <Image
              key={`employee-avatar-${item.id}-${item.profile_image_url}`}
              source={{ uri: item.profile_image_url }}
              style={styles.avatarImage}
              onError={(e) => {
                console.error('Error loading employee photo:', item.profile_image_url, e.nativeEvent.error);
              }}
              onLoad={() => {
                console.log('Employee photo loaded successfully:', item.profile_image_url);
              }}
            />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.employeeInfo}>
            <Text style={[styles.employeeName, { color: theme.colors.text }]}>
              {item.first_name} {item.last_name}
            </Text>
            {item.job_title && (
              <Text
                style={[styles.jobTitle, { color: theme.colors.textSecondary }]}
              >
                {item.job_title}
                {item.department && ` • ${item.department}`}
              </Text>
            )}
          </View>
          <Icon name="more-vert" size={24} color={theme.colors.gray500} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View
        style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}
      >
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Personeller
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Çalışanlarınızı yönetin
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primaryDark },
          ]}
          onPress={handleAddEmployee}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {employees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={64} color={theme.colors.gray400} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Henüz personel eklenmemiş
          </Text>
          <TouchableOpacity
            style={[
              styles.emptyButton,
              { backgroundColor: theme.colors.primaryDark },
            ]}
            onPress={handleAddEmployee}
          >
            <Text style={styles.emptyButtonText}>İlk Personeli Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Action Sheet Modal */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionSheetVisible(false)}
        >
          <View
            style={[
              styles.actionSheet,
              { backgroundColor: theme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.actionSheetHandle,
                { backgroundColor: theme.colors.gray300 },
              ]}
            />
            <Text
              style={[styles.actionSheetTitle, { color: theme.colors.text }]}
            >
              {selectedEmployee
                ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                : "Actions"}
            </Text>
            {selectedEmployee && (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionSheetItem,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                  onPress={() => {
                    setActionSheetVisible(false);
                    setQrModalVisible(true);
                  }}
                >
                  <Icon name="qr-code" size={24} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.actionSheetItemText,
                      { color: theme.colors.text },
                    ]}
                  >
                    QR Kod
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionSheetItem,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                  onPress={async () => {
                    setActionSheetVisible(false);
                    if (selectedEmployee) {
                      setLoadingAppointments(true);
                      const apts = await getAppointmentsByEmployee(
                        selectedEmployee.id
                      );
                      setAppointments(apts);
                      setLoadingAppointments(false);
                      setAppointmentsModalVisible(true);
                    }
                  }}
                >
                  <Icon
                    name="calendar-today"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.actionSheetItemText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Randevular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionSheetItem,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                  onPress={() => handleEditEmployee(selectedEmployee)}
                >
                  <Icon name="edit" size={24} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.actionSheetItemText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Düzenle
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionSheetItem}
                  onPress={() => handleDeleteEmployee(selectedEmployee)}
                >
                  <Icon name="delete" size={24} color={theme.colors.error} />
                  <Text
                    style={[
                      styles.actionSheetItemText,
                      { color: theme.colors.error },
                    ]}
                  >
                    Sil
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Employee Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["bottom", "left", "right"]}
        >
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
          />
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.gray200 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingEmployee ? "Personel Düzenle" : "Yeni Personel Ekle"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Profile Photo */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Profil Fotoğrafı
              </Text>
              <View style={styles.photoContainer}>
                {photoPreview ? (
                  <Image
                    key={`photo-preview-${photoPreview}`}
                    source={{ uri: photoPreview }}
                    style={styles.photoPreview}
                    onError={(e) => {
                      console.error('Error loading photo preview:', photoPreview, e.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('Photo preview loaded successfully:', photoPreview);
                    }}
                  />
                ) : (
                  <View
                    style={[
                      styles.photoPlaceholder,
                      { backgroundColor: theme.colors.gray200 },
                    ]}
                  >
                    <Icon
                      name="camera-alt"
                      size={32}
                      color={theme.colors.gray500}
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.photoButton,
                    { backgroundColor: theme.colors.primaryDark },
                  ]}
                  onPress={handlePickImage}
                >
                  <Icon name="camera-alt" size={20} color="#FFFFFF" />
                  <Text style={styles.photoButtonText}>
                    {photoPreview ? "Değiştir" : "Fotoğraf Seç"}
                  </Text>
                </TouchableOpacity>
                {photoPreview && (
                  <TouchableOpacity
                    style={[
                      styles.removePhotoButton,
                      { backgroundColor: theme.colors.error },
                    ]}
                    onPress={() => {
                      setPhotoPreview(null);
                      setPhotoUri(null);
                      setPhotoUrl("");
                    }}
                  >
                    <Icon name="delete" size={16} color="#FFFFFF" />
                    <Text style={styles.removePhotoButtonText}>Kaldır</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Ad ve Soyad - 2 Kolonlu */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Ad *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.first_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, first_name: text })
                  }
                  placeholder="Ad"
                  placeholderTextColor={theme.colors.gray500}
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Soyad *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.last_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, last_name: text })
                  }
                  placeholder="Soyad"
                  placeholderTextColor={theme.colors.gray500}
                />
              </View>
            </View>

            {/* Ünvan ve Departman - 2 Kolonlu */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Ünvan
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.job_title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, job_title: text })
                  }
                  placeholder="Ünvan"
                  placeholderTextColor={theme.colors.gray500}
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Departman
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.department}
                  onChangeText={(text) =>
                    setFormData({ ...formData, department: text })
                  }
                  placeholder="Departman"
                  placeholderTextColor={theme.colors.gray500}
                />
              </View>
            </View>

            {/* Telefon ve E-posta - 2 Kolonlu */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Telefon
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Telefon"
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  E-posta
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="E-posta"
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Hakkında */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Hakkında
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                value={formData.about}
                onChangeText={(text) =>
                  setFormData({ ...formData, about: text })
                }
                placeholder="Hakkında"
                placeholderTextColor={theme.colors.gray500}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Şifre */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Şifre
                {editingEmployee && (
                  <Text style={{ fontSize: 12, color: theme.colors.gray500 }}>
                    {" "}
                    (Değiştirmek için yeni şifre girin)
                  </Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                placeholder={
                  editingEmployee ? "Yeni şifre (opsiyonel)" : "Şifre"
                }
                placeholderTextColor={theme.colors.gray500}
                secureTextEntry
              />
              {editingEmployee && (
                <Text style={[styles.hint, { color: theme.colors.gray500 }]}>
                  Şifreyi değiştirmek istemiyorsanız boş bırakın
                </Text>
              )}
            </View>

            {/* Rol Seçimi */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Rol
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray300,
                  },
                ]}
                onPress={() => setRoleModalVisible(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    {
                      color: selectedRole
                        ? theme.colors.text
                        : theme.colors.gray500,
                    },
                  ]}
                >
                  {selectedRole || "Rol seçin (opsiyonel)"}
                </Text>
                <Icon
                  name="arrow-drop-down"
                  size={24}
                  color={theme.colors.gray500}
                />
              </TouchableOpacity>
            </View>

            {/* Bölge Seçimi - Bölge Sorumlusu ve Pazarlama Personeli için */}
            {(selectedRole === FIXED_ROLES.REGIONAL_MANAGER ||
              selectedRole === FIXED_ROLES.MARKETING_STAFF) && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Bölge
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectContainer,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  onPress={() => setRegionModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      {
                        color: selectedRegionId
                          ? theme.colors.text
                          : theme.colors.gray500,
                      },
                    ]}
                  >
                    {selectedRegionId
                      ? regions.find((r) => r.id === selectedRegionId)?.name ||
                        "Bölge seçin"
                      : "Bölge seçin (opsiyonel)"}
                  </Text>
                  <Icon
                    name="arrow-drop-down"
                    size={24}
                    color={theme.colors.gray500}
                  />
                </TouchableOpacity>
                {selectedRole === FIXED_ROLES.MARKETING_STAFF && (
                  <Text
                    style={[styles.hint, { color: theme.colors.textSecondary }]}
                  >
                    Bölge atanması, Bölge Sorumlusu'nun sizi görebilmesi için gereklidir.
                  </Text>
                )}
              </View>
            )}

            {/* Sosyal Medya Linkleri */}
            <View style={[styles.formGroup, styles.sectionDivider]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Sosyal Medya
              </Text>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Instagram
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.social_links?.instagram || ""}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          instagram: text,
                        },
                      })
                    }
                    placeholder="https://instagram.com/username"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="url"
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    LinkedIn
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.social_links?.linkedin || ""}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          linkedin: text,
                        },
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="url"
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Facebook
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.social_links?.facebook || ""}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          facebook: text,
                        },
                      })
                    }
                    placeholder="https://facebook.com/username"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="url"
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    YouTube
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.social_links?.youtube || ""}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          youtube: text,
                        },
                      })
                    }
                    placeholder="https://youtube.com/@username"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="url"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  WhatsApp
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.gray300,
                    },
                  ]}
                  value={formData.social_links?.whatsapp || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      social_links: {
                        ...formData.social_links,
                        whatsapp: text,
                      },
                    })
                  }
                  placeholder="+1234567890"
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Müsait Saatler */}
            <View style={[styles.formGroup, styles.sectionDivider]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Müsait Saatler
              </Text>
              <View style={styles.formGroup}>
                <View style={styles.durationRow}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Varsayılan Süre (dakika)
                  </Text>
                  <TextInput
                    style={[
                      styles.durationInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.default_duration_minutes ? String(formData.default_duration_minutes) : ''}
                    onChangeText={(text) => {
                      if (text === '') {
                        setFormData({
                          ...formData,
                          default_duration_minutes: undefined,
                        });
                      } else {
                        const num = parseInt(text);
                        if (!isNaN(num) && num > 0) {
                          setFormData({
                            ...formData,
                            default_duration_minutes: num,
                          });
                        }
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>
              </View>
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => {
                const dayNames: { [key: string]: string } = {
                  monday: "Pazartesi",
                  tuesday: "Salı",
                  wednesday: "Çarşamba",
                  thursday: "Perşembe",
                  friday: "Cuma",
                  saturday: "Cumartesi",
                  sunday: "Pazar",
                };
                const daySchedule = formData.available_hours?.[day] || {
                  enabled: false,
                  start: "09:00",
                  end: "17:00",
                };
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayScheduleRow,
                      {
                        borderColor: theme.colors.gray200,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.dayScheduleHeader}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => {
                          const newHours = formData.available_hours
                            ? { ...formData.available_hours }
                            : defaultAvailableHours;
                          newHours[day] = {
                            ...daySchedule,
                            enabled: !daySchedule.enabled,
                          };
                          setFormData({
                            ...formData,
                            available_hours: newHours,
                          });
                        }}
                      >
                        <Icon
                          name={
                            daySchedule.enabled
                              ? "check-box"
                              : "check-box-outline-blank"
                          }
                          size={24}
                          color={
                            daySchedule.enabled
                              ? theme.colors.primary
                              : theme.colors.gray400
                          }
                        />
                        <Text
                          style={[styles.dayName, { color: theme.colors.text }]}
                        >
                          {dayNames[day]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {daySchedule.enabled && (
                      <View style={styles.timeInputsRow}>
                        <View style={styles.timeInputGroup}>
                          <Text
                            style={[
                              styles.timeLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            Başlangıç
                          </Text>
                          <TextInput
                            style={[
                              styles.timeInput,
                              {
                                color: theme.colors.text,
                                borderColor: theme.colors.gray300,
                              },
                            ]}
                            value={daySchedule.start}
                            onChangeText={(text) => {
                              const newHours = formData.available_hours
                                ? { ...formData.available_hours }
                                : defaultAvailableHours;
                              newHours[day] = {
                                ...daySchedule,
                                start: text,
                              };
                              setFormData({
                                ...formData,
                                available_hours: newHours,
                              });
                            }}
                            placeholder="09:00"
                            placeholderTextColor={theme.colors.gray500}
                          />
                        </View>
                        <View style={styles.timeInputGroup}>
                          <Text
                            style={[
                              styles.timeLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            Bitiş
                          </Text>
                          <TextInput
                            style={[
                              styles.timeInput,
                              {
                                color: theme.colors.text,
                                borderColor: theme.colors.gray300,
                              },
                            ]}
                            value={daySchedule.end}
                            onChangeText={(text) => {
                              const newHours = formData.available_hours
                                ? { ...formData.available_hours }
                                : defaultAvailableHours;
                              newHours[day] = {
                                ...daySchedule,
                                end: text,
                              };
                              setFormData({
                                ...formData,
                                available_hours: newHours,
                              });
                            }}
                            placeholder="17:00"
                            placeholderTextColor={theme.colors.gray500}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* SIP Ayarları */}
            <View style={[styles.formGroup, styles.sectionDivider]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                IP Telefon Ayarları
              </Text>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    SIP Kullanıcı Adı
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={sipSettings.sip_username}
                    onChangeText={(text) =>
                      setSipSettings({ ...sipSettings, sip_username: text })
                    }
                    placeholder="sip_username"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    SIP Şifre
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={sipSettings.sip_password}
                    onChangeText={(text) =>
                      setSipSettings({ ...sipSettings, sip_password: text })
                    }
                    placeholder={
                      editingEmployee ? "Değiştirmek için yeni şifre girin" : ""
                    }
                    placeholderTextColor={theme.colors.gray500}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Extension
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={sipSettings.extension}
                    onChangeText={(text) =>
                      setSipSettings({ ...sipSettings, extension: text })
                    }
                    placeholder="1001"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    SIP Sunucu
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={sipSettings.sip_server}
                    onChangeText={(text) =>
                      setSipSettings({ ...sipSettings, sip_server: text })
                    }
                    placeholder="sip.example.com"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    SIP Port
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={String(sipSettings.sip_port)}
                    onChangeText={(text) =>
                      setSipSettings({
                        ...sipSettings,
                        sip_port: parseInt(text) || 5060,
                      })
                    }
                    placeholder="5060"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() =>
                      setSipSettings({
                        ...sipSettings,
                        webrtc_enabled: !sipSettings.webrtc_enabled,
                      })
                    }
                  >
                    <Icon
                      name={
                        sipSettings.webrtc_enabled
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color={
                        sipSettings.webrtc_enabled
                          ? theme.colors.primary
                          : theme.colors.gray400
                      }
                    />
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      WebRTC Etkin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Role Selection Modal - Inside Employee Form Modal, outside ScrollView */}
          {roleModalVisible && (
            <View style={styles.roleModalWrapper}>
              <View style={styles.roleModalBackdrop} />
              <View
                style={[
                  styles.roleModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.roleModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                >
                  <Text
                    style={[styles.roleModalTitle, { color: theme.colors.text }]}
                  >
                    Rol Seç
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRoleModalVisible(false)}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.roleModalScrollView}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor:
                          selectedRole === null
                            ? theme.colors.primary + "15"
                            : theme.colors.surface,
                        borderColor:
                          selectedRole === null
                            ? theme.colors.primary
                            : theme.colors.gray200,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRole(null);
                      setSelectedRegionId(null); // Clear region when role is cleared
                      setRoleModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        {
                          color:
                            selectedRole === null
                              ? theme.colors.primary
                              : theme.colors.text,
                        },
                      ]}
                    >
                      Rol Yok
                    </Text>
                    {selectedRole === null && (
                      <Icon
                        name="check"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                  {Object.values(FIXED_ROLES).filter(role => role !== FIXED_ROLES.COMPANY && role !== FIXED_ROLES.CUSTOMER).map((roleName) => (
                    <TouchableOpacity
                      key={roleName}
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor:
                            selectedRole === roleName
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            selectedRole === roleName
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setSelectedRole(roleName);
                        // Clear region if not Regional Manager
                        if (roleName !== FIXED_ROLES.REGIONAL_MANAGER) {
                          setSelectedRegionId(null);
                        }
                        setRoleModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          {
                            color:
                              selectedRole === roleName
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {roleName}
                      </Text>
                      {selectedRole === roleName && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Region Selection Modal - Inside Employee Form Modal, outside ScrollView */}
          {regionModalVisible && (
            <View style={styles.roleModalWrapper}>
              <View style={styles.roleModalBackdrop} />
              <View
                style={[
                  styles.roleModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.roleModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                >
                  <Text
                    style={[styles.roleModalTitle, { color: theme.colors.text }]}
                  >
                    Bölge Seç
                  </Text>
                  <View style={styles.roleModalHeaderActions}>
                    <TouchableOpacity
                      style={[
                        styles.addRegionButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => setAddRegionModalVisible(true)}
                    >
                      <Icon name="add" size={20} color="#FFFFFF" />
                      <Text style={styles.addRegionButtonText}>Yeni Bölge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setRegionModalVisible(false)}
                    >
                      <Icon name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.roleModalScrollView}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor:
                          selectedRegionId === null
                            ? theme.colors.primary + "15"
                            : theme.colors.surface,
                        borderColor:
                          selectedRegionId === null
                            ? theme.colors.primary
                            : theme.colors.gray200,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRegionId(null);
                      setRegionModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        {
                          color:
                            selectedRegionId === null
                              ? theme.colors.primary
                              : theme.colors.text,
                        },
                      ]}
                    >
                      Bölge Seçilmedi
                    </Text>
                    {selectedRegionId === null && (
                      <Icon
                        name="check"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region.id}
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor:
                            selectedRegionId === region.id
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          borderColor:
                            selectedRegionId === region.id
                              ? theme.colors.primary
                              : theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setSelectedRegionId(region.id);
                        setRegionModalVisible(false);
                      }}
                    >
                      <View style={styles.roleOptionContent}>
                        <Text
                          style={[
                            styles.roleOptionText,
                            {
                              color:
                                selectedRegionId === region.id
                                  ? theme.colors.primary
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          {region.name}
                        </Text>
                        {region.description && (
                          <Text
                            style={[
                              styles.roleOptionDescription,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {region.description}
                          </Text>
                        )}
                      </View>
                      {selectedRegionId === region.id && (
                        <Icon
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                  {regions.length === 0 && (
                    <View style={styles.emptyRegionsContainer}>
                      <Icon
                        name="location-off"
                        size={48}
                        color={theme.colors.gray400}
                      />
                      <Text
                        style={[
                          styles.emptyRegionsText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Henüz bölge eklenmemiş.
                      </Text>
                      <Text
                        style={[
                          styles.emptyRegionsSubtext,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Yeni bölge eklemek için yukarıdaki "Yeni Bölge" butonuna tıklayın.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Add Region Modal */}
          {addRegionModalVisible && (
            <View style={styles.roleModalWrapper}>
              <View style={styles.roleModalBackdrop} />
              <View
                style={[
                  styles.roleModalContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.roleModalHeader,
                    { borderBottomColor: theme.colors.gray200 },
                  ]}
                >
                  <Text
                    style={[styles.roleModalTitle, { color: theme.colors.text }]}
                  >
                    Yeni Bölge Ekle
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setAddRegionModalVisible(false);
                      setNewRegionName("");
                      setNewRegionDescription("");
                    }}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.roleModalScrollView}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Bölge Adı *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={newRegionName}
                      onChangeText={setNewRegionName}
                      placeholder="Örn: İstanbul, Ankara"
                      placeholderTextColor={theme.colors.gray500}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Açıklama (Opsiyonel)
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.gray300,
                        },
                      ]}
                      value={newRegionDescription}
                      onChangeText={setNewRegionDescription}
                      placeholder="Bölge hakkında kısa bilgi"
                      placeholderTextColor={theme.colors.gray500}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
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
                    onPress={() => {
                      setAddRegionModalVisible(false);
                      setNewRegionName("");
                      setNewRegionDescription("");
                    }}
                    disabled={creatingRegion}
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
                      {
                        backgroundColor: creatingRegion
                          ? theme.colors.gray400
                          : theme.colors.primaryDark,
                      },
                    ]}
                    onPress={handleAddRegion}
                    disabled={creatingRegion}
                  >
                    <Text style={styles.modalButtonTextWhite}>
                      {creatingRegion ? "Ekleniyor..." : "Ekle"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

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
              onPress={() => setModalVisible(false)}
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
              onPress={handleSaveEmployee}
            >
              <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["bottom", "left", "right"]}
        >
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
          />
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.gray200 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              QR Kod
            </Text>
            <TouchableOpacity onPress={() => setQrModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedEmployee && companyId && (
              <QRCodeGenerator
                url={getEmployeePublicUrl(companyId, selectedEmployee.id)}
                employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                employeeId={selectedEmployee.id}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Appointments Modal */}
      <Modal
        visible={appointmentsModalVisible}
        animationType="slide"
        onRequestClose={() => setAppointmentsModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["bottom", "left", "right"]}
        >
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
          />
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.gray200 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedEmployee
                ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} - Randevular`
                : "Randevular"}
            </Text>
            <TouchableOpacity
              onPress={() => setAppointmentsModalVisible(false)}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {loadingAppointments ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.text }}>Yükleniyor...</Text>
              </View>
            ) : appointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon
                  name="event-busy"
                  size={64}
                  color={theme.colors.gray400}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Henüz randevu yok
                </Text>
              </View>
            ) : (
              <View style={styles.appointmentsList}>
                {appointments.map((apt) => {
                  const date = new Date(apt.appointment_date);
                  const statusColors = {
                    pending: theme.colors.warning,
                    confirmed: theme.colors.success,
                    cancelled: theme.colors.error,
                    completed: theme.colors.info,
                  };
                  const statusLabels = {
                    pending: "Beklemede",
                    confirmed: "Onaylandı",
                    cancelled: "İptal",
                    completed: "Tamamlandı",
                  };

                  return (
                    <View
                      key={apt.id}
                      style={[
                        styles.appointmentCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.gray200,
                        },
                      ]}
                    >
                      <View style={styles.appointmentHeader}>
                        <View style={styles.appointmentDate}>
                          <Icon
                            name="schedule"
                            size={20}
                            color={theme.colors.primary}
                          />
                          <Text
                            style={[
                              styles.appointmentDateText,
                              { color: theme.colors.text },
                            ]}
                          >
                            {date.toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: statusColors[apt.status] + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: statusColors[apt.status] },
                            ]}
                          >
                            {statusLabels[apt.status]}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.appointmentTime,
                          { color: theme.colors.text },
                        ]}
                      >
                        {date.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <View style={styles.appointmentInfo}>
                        <Text
                          style={[
                            styles.appointmentLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Müşteri:
                        </Text>
                        <Text
                          style={[
                            styles.appointmentValue,
                            { color: theme.colors.text },
                          ]}
                        >
                          {apt.customer_name}
                        </Text>
                      </View>
                      {apt.customer_email && (
                        <View style={styles.appointmentInfo}>
                          <Text
                            style={[
                              styles.appointmentLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            E-posta:
                          </Text>
                          <Text
                            style={[
                              styles.appointmentValue,
                              { color: theme.colors.text },
                            ]}
                          >
                            {apt.customer_email}
                          </Text>
                        </View>
                      )}
                      {apt.customer_phone && (
                        <View style={styles.appointmentInfo}>
                          <Text
                            style={[
                              styles.appointmentLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            Telefon:
                          </Text>
                          <Text
                            style={[
                              styles.appointmentValue,
                              { color: theme.colors.text },
                            ]}
                          >
                            {apt.customer_phone}
                          </Text>
                        </View>
                      )}
                      {apt.notes && (
                        <View style={styles.appointmentInfo}>
                          <Text
                            style={[
                              styles.appointmentLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            Notlar:
                          </Text>
                          <Text
                            style={[
                              styles.appointmentValue,
                              { color: theme.colors.text },
                            ]}
                          >
                            {apt.notes}
                          </Text>
                        </View>
                      )}
                      <View style={styles.appointmentActions}>
                        {apt.status === "pending" && (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                { backgroundColor: theme.colors.success },
                              ]}
                              onPress={async () => {
                                const success = await updateAppointmentStatus(
                                  apt.id,
                                  "confirmed"
                                );
                                if (success && selectedEmployee) {
                                  const apts = await getAppointmentsByEmployee(
                                    selectedEmployee.id
                                  );
                                  setAppointments(apts);
                                }
                              }}
                            >
                              <Icon
                                name="check-circle"
                                size={20}
                                color="#FFFFFF"
                              />
                              <Text style={styles.actionButtonText}>
                                Onayla
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                { backgroundColor: theme.colors.error },
                              ]}
                              onPress={async () => {
                                const success = await updateAppointmentStatus(
                                  apt.id,
                                  "cancelled"
                                );
                                if (success && selectedEmployee) {
                                  const apts = await getAppointmentsByEmployee(
                                    selectedEmployee.id
                                  );
                                  setAppointments(apts);
                                }
                              }}
                            >
                              <Icon name="cancel" size={20} color="#FFFFFF" />
                              <Text style={styles.actionButtonText}>
                                İptal Et
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              { backgroundColor: theme.colors.info },
                            ]}
                            onPress={async () => {
                              const success = await updateAppointmentStatus(
                                apt.id,
                                "completed"
                              );
                              if (success && selectedEmployee) {
                                const apts = await getAppointmentsByEmployee(
                                  selectedEmployee.id
                                );
                                setAppointments(apts);
                              }
                            }}
                          >
                            <Icon
                              name="check-circle"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={styles.actionButtonText}>
                              Tamamlandı
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { backgroundColor: theme.colors.error },
                          ]}
                          onPress={async () => {
                            Alert.alert(
                              "Randevu Sil",
                              "Bu randevuyu silmek istediğinize emin misiniz?",
                              [
                                { text: "İptal", style: "cancel" },
                                {
                                  text: "Sil",
                                  style: "destructive",
                                  onPress: async () => {
                                    const success = await deleteAppointment(
                                      apt.id
                                    );
                                    if (success && selectedEmployee) {
                                      const apts =
                                        await getAppointmentsByEmployee(
                                          selectedEmployee.id
                                        );
                                      setAppointments(apts);
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Icon name="delete" size={20} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Employee Detail Modal */}
      <Modal
        visible={employeeDetailModalVisible}
        animationType="slide"
        onRequestClose={() => setEmployeeDetailModalVisible(false)}
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
                onPress={() => setEmployeeDetailModalVisible(false)}
                style={styles.modalBackButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Personel Detayı
              </Text>
              <TouchableOpacity
                onPress={() => setEmployeeDetailModalVisible(false)}
                style={styles.modalCloseButton}
              >
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

                {employeeTasks.length > 0 ? (
                  <View style={styles.tasksList}>
                    {employeeTasks.map((task) => {
                      const statusColors: Record<string, string> = {
                        pending: "#FF9800",
                        in_progress: "#2196F3",
                        completed: "#4CAF50",
                        cancelled: "#F44336",
                      };
                      const statusLabels: Record<string, string> = {
                        pending: "Beklemede",
                        in_progress: "Devam Ediyor",
                        completed: "Tamamlandı",
                        cancelled: "İptal",
                      };
                      const statusColor = statusColors[task.status] || "#757575";
                      const statusLabel = statusLabels[task.status] || task.status;
                      
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
                          onPress={() => {
                            setSelectedTask(task);
                            setTaskModalVisible(true);
                          }}
                          activeOpacity={0.7}
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

                {employeeLeads.length > 0 ? (
                  <View style={styles.tasksList}>
                    {employeeLeads.map((lead) => {
                      return (
                        <TouchableOpacity
                          key={lead.id}
                          style={[
                            styles.taskItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.gray200,
                            },
                          ]}
                          onPress={() => {
                            setSelectedLead(lead);
                            setLeadModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.taskItemContent}>
                            <Text
                              style={[
                                styles.taskTitle,
                                { color: theme.colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {lead.customer_name || lead.contact_name || "İsimsiz Müşteri"}
                            </Text>
                            {lead.email && (
                              <View style={styles.taskItemFooter}>
                                <Icon
                                  name="email"
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
                                  {lead.email}
                                </Text>
                              </View>
                            )}
                            {lead.phone && (
                              <View style={styles.taskItemFooter}>
                                <Icon
                                  name="phone"
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
                                  {lead.phone}
                                </Text>
                              </View>
                            )}
                            {lead.status && (
                              <View style={styles.taskItemFooter}>
                                <View
                                  style={[
                                    styles.taskStatusBadge,
                                    {
                                      backgroundColor: theme.colors.primary + "20",
                                      borderColor: theme.colors.primary + "40",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.taskStatusText,
                                      { color: theme.colors.primary },
                                    ]}
                                  >
                                    {lead.status}
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

          {selectedTask && (() => {
            const statusColors: Record<string, string> = {
              pending: "#F59E0B",
              in_progress: "#3B82F6",
              completed: "#10B981",
              cancelled: "#EF4444",
            };
            const statusLabels: Record<string, string> = {
              pending: "Beklemede",
              in_progress: "Devam Ediyor",
              completed: "Tamamlandı",
              cancelled: "İptal",
            };
            const statusColor = statusColors[selectedTask.status] || "#757575";
            const statusLabel = statusLabels[selectedTask.status] || selectedTask.status;
            
            return (
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
                        backgroundColor: statusColor + "20",
                        borderColor: statusColor + "40",
                        alignSelf: "flex-start",
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
                </View>

              {selectedTask.due_date && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Bitiş Tarihi
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {new Date(selectedTask.due_date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}

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
                
                if (Array.isArray(checklistItems) && checklistItems.length > 0) {
                  return (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Kontrol Listesi
                      </Text>
                      {checklistItems.map((item: string, index: number) => {
                        const isCompleted = Array.isArray(checklistCompleted) && checklistCompleted.includes(index);
                        return (
                          <View
                            key={index}
                            style={[
                              styles.checklistItem,
                              {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.gray200,
                              },
                            ]}
                          >
                            <Icon
                              name={isCompleted ? "check-circle" : "radio-button-unchecked"}
                              size={20}
                              color={isCompleted ? "#10B981" : theme.colors.gray400}
                            />
                            <Text
                              style={[
                                styles.checklistText,
                                {
                                  color: isCompleted
                                    ? theme.colors.textSecondary
                                    : theme.colors.text,
                                  textDecorationLine: isCompleted ? "line-through" : "none",
                                },
                              ]}
                            >
                              {item}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                }
                return null;
              })()}

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
                
                if (Array.isArray(attachments) && attachments.length > 0) {
                  return (
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        Ekler
                      </Text>
                      {attachments.map((attachment: string, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.attachmentItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.gray200,
                            },
                          ]}
                          onPress={() => {
                            // Handle attachment view
                            if (attachment.startsWith("http")) {
                              // Open URL
                            }
                          }}
                        >
                          <Icon name="attach-file" size={20} color={theme.colors.primary} />
                          <Text
                            style={[styles.attachmentText, { color: theme.colors.text }]}
                            numberOfLines={1}
                          >
                            {attachment.split("/").pop() || `Ek ${index + 1}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                }
                return null;
              })()}
              </ScrollView>
            );
              })()}
        </View>
          </Modal>

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
                    styles.taskStatusBadge,
                    {
                      backgroundColor: theme.colors.primary + "20",
                      borderColor: theme.colors.primary + "40",
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.taskStatusText,
                      { color: theme.colors.primary },
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
            </ScrollView>
          )}
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  jobTitle: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  actionSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionSheetItemText: {
    fontSize: 16,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 55,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextWhite: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appointmentDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appointmentDateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  appointmentTime: {
    fontSize: 14,
    marginBottom: 12,
  },
  appointmentInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  appointmentLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
    minWidth: 80,
  },
  appointmentValue: {
    fontSize: 14,
    flex: 1,
  },
  appointmentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  photoContainer: {
    alignItems: "center",
    gap: 12,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  removePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  removePhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 0,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionDivider: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  durationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 100,
    textAlign: "center",
  },
  dayScheduleRow: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  dayScheduleHeader: {
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
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
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 14,
  },
  roleModalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  roleModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  roleModalContainer: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    borderRadius: 20,
    maxHeight: "60%",
    minHeight: "40%",
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  roleModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  roleModalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addRegionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  addRegionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  roleModalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  roleModalScrollView: {
    flex: 1,
    padding: 16,
  },
  emptyRegionsContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRegionsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyRegionsSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  modalEmployeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalEmployeePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
  },
  modalEmployeeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmployeeAvatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
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
    padding: 20,
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  tasksSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tasksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  taskItemContent: {
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  taskItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  taskStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  taskDueDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueDateText: {
    fontSize: 12,
  },
  tasksEmptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  tasksEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  modalBackButton: {
    padding: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: 14,
    flex: 1,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 14,
    flex: 1,
  },
});
