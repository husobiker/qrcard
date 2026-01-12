import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  StatusBar,
  ImageBackground,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../services/supabase";
import {
  getCompanyByUserId,
  updateCompany,
} from "../../services/companyService";
import type { Company } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function DashboardScreen({ navigation }: any) {
  const { user, userType } = useAuth();
  const { theme } = useTheme();
  const { t, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    crm: 0,
    tasks: 0,
    appointments: 0,
    vehicles: 0,
  });

  useEffect(() => {
    if (user && userType === "company") {
      loadCompany();
      loadStats();
    } else {
      loadStats();
    }
  }, [user]);

  const loadCompany = async () => {
    if (!user || userType !== "company") return;

    try {
      const companyData = await getCompanyByUserId(user.id);
      if (companyData) {
        setCompany(companyData);
        // Set language from company data
        if (companyData.language) {
          setLanguage(companyData.language);
        }
      } else {
        // Company doesn't exist, create it
        const { data, error } = await supabase
          .from("companies")
          .insert({
            id: user.id,
            name: "My Company",
            language: "tr" as "tr" | "en",
          } as any)
          .select()
          .single();

        if (data && !error) {
          setCompany(data);
        }
      }
    } catch (error) {
      console.error("Error loading company:", error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId =
        userType === "company" ? user.id : (user as any).company_id;

      // Get CRM leads count
      const { count: crmCount } = await supabase
        .from("crm_leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      // Get tasks count
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .neq("status", "completed");

      // Get appointments count
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "pending");

      // Get vehicles count
      const { count: vehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active");

      setStats({
        crm: crmCount || 0,
        tasks: tasksCount || 0,
        appointments: appointmentsCount || 0,
        vehicles: vehiclesCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.statIconContainer,
          {
            backgroundColor: color + "15",
            borderColor: color + "30",
          },
        ]}
      >
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, icon, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}
    >
      <Icon name={icon} size={24} color={theme.colors.primary} />
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadStats}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Hero Section with Background Image */}
          <View style={styles.heroSection}>
            {company?.background_image_url ? (
              <ImageBackground
                source={{ uri: company.background_image_url }}
                style={styles.heroBackground}
                imageStyle={styles.heroBackgroundImage}
              >
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                  {company?.logo_url && (
                    <View style={styles.logoCard}>
                      <Image
                        source={{ uri: company.logo_url }}
                        style={styles.companyLogo}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={[styles.companyName, { color: "#FFFFFF" }]}>
                    {userType === "company"
                      ? company?.name || (user as any).name || "Welcome"
                      : `${(user as any).first_name} ${
                          (user as any).last_name
                        }`}
                  </Text>
                </View>
              </ImageBackground>
            ) : (
              <View
                style={[
                  styles.heroSectionFallback,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <View style={styles.heroContent}>
                  {company?.logo_url && (
                    <View style={styles.logoCard}>
                      <Image
                        source={{ uri: company.logo_url }}
                        style={styles.companyLogo}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={[styles.companyName, { color: "#FFFFFF" }]}>
                    {userType === "company"
                      ? company?.name || (user as any).name || "Welcome"
                      : `${(user as any).first_name} ${
                          (user as any).last_name
                        }`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <StatCard
              title="CRM Leads"
              value={stats.crm}
              icon="people"
              color={theme.colors.primary}
              onPress={() => navigation.navigate("CRM")}
            />
            <StatCard
              title="Tasks"
              value={stats.tasks}
              icon="check-circle"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate("Tasks")}
            />
            <StatCard
              title="Appointments"
              value={stats.appointments}
              icon="calendar-today"
              color={theme.colors.warning}
              onPress={() => navigation.navigate("Calendar")}
            />
            <StatCard
              title="Vehicles"
              value={stats.vehicles}
              icon="directions-car"
              color={theme.colors.info}
              onPress={() => navigation.navigate("Vehicles")}
            />
          </View>

          <View style={styles.quickAccessSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Hızlı Erişim
            </Text>
            <View style={styles.quickActionsContainer}>
              {userType === "company" && (
                <QuickAction
                  title="Personeller"
                  icon="people-outline"
                  onPress={() => navigation.navigate("Employees")}
                />
              )}
              <QuickAction
                title="Takvim"
                icon="calendar-today"
                onPress={() => navigation.navigate("Calendar")}
              />
              <QuickAction
                title="Araç Takip"
                icon="directions-car"
                onPress={() => navigation.navigate("Vehicles")}
              />
              <QuickAction
                title="Satış Takibi"
                icon="trending-up"
                onPress={() => navigation.navigate("CRM")}
              />
              <QuickAction
                title="İletişim"
                icon="message"
                onPress={() => navigation.navigate("Communications")}
              />
              <QuickAction
                title="Arama Geçmişi"
                icon="phone"
                onPress={() => navigation.navigate("CallLogs")}
              />
              <QuickAction
                title="Görevler"
                icon="check-circle"
                onPress={() => navigation.navigate("Tasks")}
              />
              <QuickAction
                title="Hedefler"
                icon="flag"
                onPress={() => navigation.navigate("Goals")}
              />
              <QuickAction
                title="İşlemler"
                icon="account-balance-wallet"
                onPress={() => navigation.navigate("Transactions")}
              />
              <QuickAction
                title="Komisyon"
                icon="attach-money"
                onPress={() => navigation.navigate("Commissions")}
              />
              <QuickAction
                title="Raporlar"
                icon="assessment"
                onPress={() => navigation.navigate("Reports")}
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
  content: {
    padding: 0,
    paddingTop: 0,
  },
  heroSection: {
    marginTop: 55,
    marginBottom: 20,
    borderRadius: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroBackground: {
    width: "100%",
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  heroBackgroundImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  heroSectionFallback: {
    width: "100%",
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 1,
    width: "100%",
  },
  logoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  companyLogo: {
    width: 100,
    height: 100,
  },
  companyName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  companyForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statCard: {
    width: "47%",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  quickAccessSection: {
    paddingHorizontal: 16,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: "30%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
