import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getAppointments } from "../../services/appointmentService";
import { getEmployeesByCompany } from "../../services/employeeService";
import type { Appointment, Employee } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function CalendarScreen() {
  const { user, userType } = useAuth();
  const { theme, isDark } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, currentDate]);

  const loadData = async () => {
    if (!user) return;

    try {
      const companyId =
        userType === "company" ? user.id : (user as any).company_id;
      if (companyId && userType === "company") {
        const employeesData = await getEmployeesByCompany(companyId);
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadAppointments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId =
        userType === "company" ? user.id : (user as any).company_id;
      const employeeId = userType === "employee" ? user.id : undefined;
      const data = await getAppointments(companyId, employeeId);
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAppointmentsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      const aptYear = aptDate.getFullYear();
      const aptMonth = aptDate.getMonth();
      const aptDay = aptDate.getDate();
      const aptDateStr = `${aptYear}-${String(aptMonth + 1).padStart(
        2,
        "0"
      )}-${String(aptDay).padStart(2, "0")}`;
      return aptDateStr === dateStr;
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : "Bilinmiyor";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return theme.colors.success;
      case "pending":
        return theme.colors.warning;
      case "cancelled":
        return theme.colors.error;
      case "completed":
        return theme.colors.info;
      default:
        return theme.colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Onaylandı";
      case "pending":
        return "Beklemede";
      case "cancelled":
        return "İptal Edildi";
      case "completed":
        return "Tamamlandı";
      default:
        return status;
    }
  };

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

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadAppointments}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.monthYear, { color: theme.colors.text }]}>
              {monthNames[month]} {year}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray200,
                  },
                ]}
                onPress={goToToday}
              >
                <Text
                  style={[
                    styles.headerButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Bugün
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray200,
                  },
                ]}
                onPress={goToPreviousMonth}
              >
                <Icon name="chevron-left" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.gray200,
                  },
                ]}
                onPress={goToNextMonth}
              >
                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Calendar Grid */}
        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.gray200,
            },
          ]}
        >
          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((day) => (
              <View key={day} style={styles.dayNameCell}>
                <Text
                  style={[
                    styles.dayName,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dayAppointments = getAppointmentsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isToday
                        ? theme.colors.primary + "15"
                        : "transparent",
                      borderColor: isToday
                        ? theme.colors.primary
                        : theme.colors.gray200,
                    },
                  ]}
                  onPress={() => handleDayPress(date)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: isToday
                          ? theme.colors.primary
                          : theme.colors.text,
                        fontWeight: isToday ? "bold" : "normal",
                      },
                    ]}
                  >
                    {day}
                  </Text>
                  <View style={styles.appointmentsContainer}>
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const aptDate = new Date(apt.appointment_date);
                      const timeStr = formatTime(apt.appointment_date);
                      return (
                        <View
                          key={apt.id}
                          style={[
                            styles.appointmentDot,
                            {
                              backgroundColor:
                                getStatusColor(apt.status) + "80",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.appointmentTime,
                              { color: theme.colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {timeStr}
                          </Text>
                        </View>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <Text
                        style={[
                          styles.moreText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        +{dayAppointments.length - 3}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.warning + "80" },
              ]}
            />
            <Text
              style={[styles.legendText, { color: theme.colors.textSecondary }]}
            >
              Beklemede
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.success + "80" },
              ]}
            />
            <Text
              style={[styles.legendText, { color: theme.colors.textSecondary }]}
            >
              Onaylandı
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.error + "80" },
              ]}
            />
            <Text
              style={[styles.legendText, { color: theme.colors.textSecondary }]}
            >
              İptal
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.info + "80" },
              ]}
            />
            <Text
              style={[styles.legendText, { color: theme.colors.textSecondary }]}
            >
              Tamamlandı
            </Text>
          </View>
        </View>

        {/* Selected Date Appointments List */}
        {selectedDate && (
          <View
            style={[
              styles.appointmentsList,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.gray200,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {selectedDate.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <View style={styles.emptyAppointments}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Bu gün için randevu yok
                </Text>
              </View>
            ) : (
              getAppointmentsForDate(selectedDate).map((apt) => (
                <TouchableOpacity
                  key={apt.id}
                  style={[
                    styles.appointmentCard,
                    { borderColor: theme.colors.gray200 },
                  ]}
                  onPress={() => {
                    setSelectedAppointment(apt);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.appointmentCardHeader}>
                    <View style={styles.appointmentCardLeft}>
                      <Icon
                        name="schedule"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.appointmentTime,
                          { color: theme.colors.text },
                        ]}
                      >
                        {formatTime(apt.appointment_date)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(apt.status) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(apt.status) },
                        ]}
                      >
                        {getStatusText(apt.status)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.appointmentCustomer,
                      { color: theme.colors.text },
                    ]}
                  >
                    {apt.customer_name}
                  </Text>
                  {userType === "company" && apt.employee_id && (
                    <Text
                      style={[
                        styles.appointmentEmployee,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {getEmployeeName(apt.employee_id)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Appointment Detail Modal */}
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
              Randevu Detayı
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectedAppointment && (
              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Icon
                    name="schedule"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <View style={styles.detailContent}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Tarih & Saat
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: theme.colors.text }]}
                    >
                      {formatDate(selectedAppointment.appointment_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(selectedAppointment.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedAppointment.status) },
                      ]}
                    >
                      {getStatusText(selectedAppointment.status)}
                    </Text>
                  </View>
                </View>

                {userType === "company" && selectedAppointment.employee_id && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="person"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Personel
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {getEmployeeName(selectedAppointment.employee_id)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Icon
                    name="person-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <View style={styles.detailContent}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Müşteri
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: theme.colors.text }]}
                    >
                      {selectedAppointment.customer_name}
                    </Text>
                  </View>
                </View>

                {selectedAppointment.customer_email && (
                  <View style={styles.detailRow}>
                    <Icon name="email" size={20} color={theme.colors.primary} />
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
                        style={[
                          styles.detailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedAppointment.customer_email}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedAppointment.customer_phone && (
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={20} color={theme.colors.primary} />
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
                        style={[
                          styles.detailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedAppointment.customer_phone}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedAppointment.duration_minutes && (
                  <View style={styles.detailRow}>
                    <Icon name="timer" size={20} color={theme.colors.primary} />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Süre
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedAppointment.duration_minutes} dakika
                      </Text>
                    </View>
                  </View>
                )}

                {selectedAppointment.notes && (
                  <View style={styles.detailRow}>
                    <Icon name="notes" size={20} color={theme.colors.primary} />
                    <View style={styles.detailContent}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Notlar
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedAppointment.notes}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthYear: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calendarContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    borderWidth: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dayNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  appointmentsContainer: {
    width: "100%",
    alignItems: "center",
    gap: 2,
  },
  appointmentDot: {
    width: "100%",
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    alignItems: "center",
  },
  appointmentTime: {
    fontSize: 8,
    fontWeight: "600",
  },
  moreText: {
    fontSize: 8,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    padding: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  appointmentsList: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  appointmentCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  appointmentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appointmentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appointmentCustomer: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  appointmentEmployee: {
    fontSize: 14,
  },
  emptyAppointments: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
  modalDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
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
});
