import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
import {
  getCustomerMeetings,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  type CommunicationFormData,
} from "../../services/communicationService";
import { getLeads } from "../../services/crmService";
import type { CustomerCommunication, CRMLead } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function MarketingStaffMeetingsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const employee = user as any;
  const [meetings, setMeetings] = useState<CustomerCommunication[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CustomerCommunication | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<CustomerCommunication | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  const [formData, setFormData] = useState<CommunicationFormData>({
    employee_id: employee?.id || "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    communication_type: "meeting",
    subject: "",
    notes: "",
    communication_date: new Date().toISOString(),
  });

  useEffect(() => {
    if (employee && employee.company_id) {
      loadData();
    }
  }, [employee]);

  const loadData = async () => {
    if (!employee || !employee.company_id) return;

    setLoading(true);
    try {
      // Load meetings for this employee
      const meetingsData = await getCustomerMeetings(employee.company_id, employee.id);
      setMeetings(meetingsData);

      // Load CRM leads for customer selection
      const leadsData = await getLeads(employee.company_id, employee.id);
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setViewingMeeting(null);
    setFormData({
      employee_id: employee?.id || "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      communication_type: "meeting",
      subject: "",
      notes: "",
      communication_date: new Date().toISOString(),
    });
    setModalVisible(true);
  };

  const handleViewMeeting = (meeting: CustomerCommunication) => {
    setViewingMeeting(meeting);
    setEditingMeeting(null);
    setModalVisible(true);
  };

  const handleEditMeeting = (meeting: CustomerCommunication) => {
    setEditingMeeting(meeting);
    setViewingMeeting(null);
    setFormData({
      employee_id: meeting.employee_id,
      customer_name: meeting.customer_name,
      customer_email: meeting.customer_email || "",
      customer_phone: meeting.customer_phone || "",
      communication_type: "meeting",
      subject: meeting.subject || "",
      notes: meeting.notes || "",
      communication_date: meeting.communication_date,
    });
    setModalVisible(true);
  };

  const handleSaveMeeting = async () => {
    if (!employee || !employee.company_id || !formData.customer_name) {
      Alert.alert("Hata", "Lütfen müşteri adını girin");
      return;
    }

    try {
      if (editingMeeting) {
        const updated = await updateCommunication(editingMeeting.id, formData);
        if (updated) {
          await loadData();
          setModalVisible(false);
          setViewingMeeting(null);
          setEditingMeeting(null);
          Alert.alert("Başarılı", "Görüşme kaydı güncellendi");
        }
      } else {
        const newMeeting = await createCommunication(employee.company_id, formData);
        if (newMeeting) {
          await loadData();
          setModalVisible(false);
          setViewingMeeting(null);
          setEditingMeeting(null);
          Alert.alert("Başarılı", "Görüşme kaydı eklendi");
        }
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      Alert.alert("Hata", "Görüşme kaydı kaydedilemedi");
    }
  };

  const handleDeleteMeeting = (meetingId: string) => {
    Alert.alert("Görüşme Kaydını Sil", "Bu görüşme kaydını silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const deleted = await deleteCommunication(meetingId);
          if (deleted) {
            await loadData();
            Alert.alert("Başarılı", "Görüşme kaydı silindi");
          }
        },
      },
    ]);
  };

  const filteredLeads = leads.filter((lead) => {
    if (!customerSearchQuery) return true;
    const searchLower = customerSearchQuery.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower)
    );
  });

  const renderMeeting = ({ item }: { item: CustomerCommunication }) => {
    return (
      <TouchableOpacity
        style={[
          styles.meetingCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200,
          },
        ]}
        onPress={() => handleViewMeeting(item)}
        activeOpacity={0.7}
      >
        <View style={styles.meetingHeader}>
          <Text style={[styles.meetingCustomerName, { color: theme.colors.text }]}>
            {item.customer_name}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteMeeting(item.id);
            }}
          >
            <Icon name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
        {item.subject && (
          <View style={styles.meetingInfo}>
            <Icon name="subject" size={16} color={theme.colors.gray500} />
            <Text
              style={[styles.meetingInfoText, { color: theme.colors.textSecondary }]}
            >
              {item.subject}
            </Text>
          </View>
        )}
        <View style={styles.meetingInfo}>
          <Icon name="event" size={16} color={theme.colors.gray500} />
          <Text
            style={[styles.meetingInfoText, { color: theme.colors.textSecondary }]}
          >
            {new Date(item.communication_date).toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
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
          Görüşme Kayıtları
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddMeeting}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Meetings List */}
      <FlatList
        data={meetings}
        renderItem={renderMeeting}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event" size={64} color={theme.colors.gray400} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Henüz görüşme kaydı eklenmemiş
            </Text>
          </View>
        }
      />

      {/* Create/Edit/View Modal */}
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
                  setViewingMeeting(null);
                  setEditingMeeting(null);
                }}
                style={styles.modalBackButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {viewingMeeting
                  ? "Görüşme Detayı"
                  : editingMeeting
                  ? "Görüşme Kaydı Düzenle"
                  : "Yeni Görüşme Kaydı"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setViewingMeeting(null);
                  setEditingMeeting(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {viewingMeeting ? (
              // View Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri Adı
                  </Text>
                  <Text style={[styles.detailText, { color: theme.colors.text }]}>
                    {viewingMeeting.customer_name}
                  </Text>
                </View>

                {viewingMeeting.customer_email && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      E-posta
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingMeeting.customer_email}
                    </Text>
                  </View>
                )}

                {viewingMeeting.customer_phone && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Telefon
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingMeeting.customer_phone}
                    </Text>
                  </View>
                )}

                {viewingMeeting.subject && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Konu
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingMeeting.subject}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Görüşme Tarihi
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {new Date(viewingMeeting.communication_date).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                {viewingMeeting.notes && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Notlar
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {viewingMeeting.notes}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Edit/Create Mode
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Müşteri *
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.selectContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={() => setCustomerModalVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        {
                          color: formData.customer_name
                            ? theme.colors.text
                            : theme.colors.gray500,
                        },
                      ]}
                    >
                      {formData.customer_name || "Müşteri seçin"}
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
                    value={formData.customer_email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, customer_email: text })
                    }
                    placeholder="musteri@email.com"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
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
                    value={formData.customer_phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, customer_phone: text })
                    }
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Konu
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.subject}
                    onChangeText={(text) =>
                      setFormData({ ...formData, subject: text })
                    }
                    placeholder="Görüşme konusu"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Görüşme Tarihi
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={
                      formData.communication_date
                        ? new Date(formData.communication_date).toLocaleString("tr-TR")
                        : ""
                    }
                    placeholder="YYYY-MM-DD HH:mm"
                    placeholderTextColor={theme.colors.gray500}
                    editable={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Notlar
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    value={formData.notes}
                    onChangeText={(text) =>
                      setFormData({ ...formData, notes: text })
                    }
                    placeholder="Görüşme notları"
                    placeholderTextColor={theme.colors.gray500}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </ScrollView>

          {viewingMeeting ? (
            // View Mode - Show edit button
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
                  if (viewingMeeting) {
                    handleEditMeeting(viewingMeeting);
                  }
                }}
              >
                <Icon name="edit" size={18} color="#FFFFFF" />
                <Text style={[styles.modalButtonTextWhite, { marginLeft: 8 }]}>
                  Düzenle
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Edit/Create Mode - Show cancel and save buttons
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
                  setViewingMeeting(null);
                  setEditingMeeting(null);
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
                onPress={handleSaveMeeting}
              >
                <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Customer Selection Modal */}
          {customerModalVisible && (
            <View style={styles.employeeModalWrapper}>
              <View
                style={[
                  styles.employeeModal,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.employeeModalHeader}>
                  <Text style={[styles.employeeModalTitle, { color: theme.colors.text }]}>
                    Müşteri Seç
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCustomerModalVisible(false);
                      setCustomerSearchQuery("");
                    }}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.gray300,
                      margin: 16,
                    },
                  ]}
                >
                  <Icon name="search" size={20} color={theme.colors.gray500} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Müşteri ara..."
                    placeholderTextColor={theme.colors.gray500}
                    value={customerSearchQuery}
                    onChangeText={setCustomerSearchQuery}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.customerOption,
                    {
                      backgroundColor: theme.colors.background,
                      borderBottomColor: theme.colors.gray200,
                    },
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, customer_name: "" });
                    setCustomerModalVisible(false);
                    setCustomerSearchQuery("");
                  }}
                >
                  <Text style={[styles.customerOptionText, { color: theme.colors.text }]}>
                    Manuel Giriş
                  </Text>
                </TouchableOpacity>

                <FlatList
                  data={filteredLeads}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.customerOption,
                        {
                          backgroundColor: theme.colors.background,
                          borderBottomColor: theme.colors.gray200,
                        },
                      ]}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          customer_name: item.customer_name,
                          customer_email: item.email || "",
                          customer_phone: item.phone || "",
                        });
                        setCustomerModalVisible(false);
                        setCustomerSearchQuery("");
                      }}
                    >
                      <Text style={[styles.customerOptionText, { color: theme.colors.text }]}>
                        {item.customer_name}
                      </Text>
                      {item.phone && (
                        <Text
                          style={[
                            styles.customerOptionSubtext,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {item.phone}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Müşteri bulunamadı
                      </Text>
                    </View>
                  }
                />
              </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  meetingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  meetingCustomerName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  meetingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  meetingInfoText: {
    fontSize: 14,
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
    marginTop: 4,
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
    minHeight: 120,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  employeeModal: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  employeeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  employeeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  customerOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  customerOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  customerOptionSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
