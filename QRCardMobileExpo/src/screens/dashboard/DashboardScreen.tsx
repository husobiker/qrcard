import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    monthlyGoal: 0,
    monthlyGoalProgress: 0,
    statistics: 0,
    activeEmployees: 0,
  });

  useEffect(() => {
    if (user && userType === "company") {
      loadCompany();
      loadStats();
    } else {
      loadStats();
    }
  }, [user]);

  // Reload company data when screen comes into focus (e.g., after profile update)
  useFocusEffect(
    React.useCallback(() => {
      if (user && userType === "company") {
        loadCompany();
      }
    }, [user, userType])
  );

  const loadCompany = async () => {
    if (!user || userType !== "company") return;

    try {
      const companyData = await getCompanyByUserId(user.id);
      if (companyData) {
        console.log('Dashboard: Company loaded, logo_url:', companyData.logo_url);
        console.log('Dashboard: Company loaded, background_image_url:', companyData.background_image_url);
        setCompany(companyData);
        // Set language from company data
        if (companyData.language) {
          setLanguage(companyData.language);
        }
      } else {
        // Company doesn't exist, check for pending company name from signup
        const pendingCompanyName = await AsyncStorage.getItem(`pending_company_${user.id}`);
        
        // Use pending company name if available, otherwise don't create with default
        if (pendingCompanyName) {
          const { data, error } = await supabase
            .from("companies")
            .insert({
              id: user.id,
              name: pendingCompanyName,
              language: "tr" as "tr" | "en",
            } as any)
            .select()
            .single();

          if (data && !error) {
            await AsyncStorage.removeItem(`pending_company_${user.id}`);
            setCompany(data);
            if (data.language) {
              setLanguage(data.language);
            }
          }
        }
        // If no pending company name, don't create company automatically
        // User should complete their profile in ProfileScreen
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

      // Get active employees count
      const { count: activeEmployeesCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      // Get monthly goals (current month)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data: monthlyGoals } = await supabase
        .from("performance_goals")
        .select("*")
        .eq("company_id", companyId)
        .eq("period_type", "monthly")
        .gte("period_start", monthStart.toISOString().split("T")[0])
        .lte("period_end", monthEnd.toISOString().split("T")[0]);

      // Calculate total monthly goal progress
      let totalGoal = 0;
      let totalProgress = 0;
      if (monthlyGoals && monthlyGoals.length > 0) {
        monthlyGoals.forEach((goal: any) => {
          totalGoal += Number(goal.target_value || 0);
          totalProgress += Number(goal.current_value || 0);
        });
      }

      // Get general statistics (total tasks + appointments + CRM leads)
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const { count: crmCount } = await supabase
        .from("crm_leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const totalStatistics = (tasksCount || 0) + (appointmentsCount || 0) + (crmCount || 0);

      setStats({
        monthlyGoal: totalGoal,
        monthlyGoalProgress: totalProgress,
        statistics: totalStatistics,
        activeEmployees: activeEmployeesCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress, style, progress }: any) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200 || "#E5E7EB",
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View
          style={[
            styles.statIconContainer,
            {
              backgroundColor: color + "15",
              borderColor: color + "30",
            },
          ]}
        >
          <Icon name={icon} size={20} color={color} />
        </View>
        <View style={styles.statCardMain}>
          <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {value}
          </Text>
          {progress !== undefined && (
            <View style={styles.progressBars}>
              {Array.from({ length: 10 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: index < progress ? color : theme.colors.gray200 || "#E5E7EB",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
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
      edges={["left", "right"]}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (user && userType === "company") {
                loadCompany();
              }
              loadStats();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Hero Section with Background Image */}
          <View style={styles.heroSection}>
            {company?.background_image_url ? (
              <ImageBackground
                key={`dashboard-bg-${company.background_image_url}`}
                source={{ 
                  uri: company.background_image_url + (company.background_image_url.includes('?') ? '&' : '?') + 't=' + Date.now()
                }}
                style={styles.heroBackground}
                imageStyle={styles.heroBackgroundImage}
                onError={(e) => {
                  console.error('Dashboard: Error loading background image:', company.background_image_url, e.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log('Dashboard: Background image loaded successfully:', company.background_image_url);
                }}
              >
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                  {company?.logo_url && (
                    <View style={styles.logoCard}>
                      <Image
                        key={`dashboard-logo-bg-${company.logo_url}`}
                        source={{ 
                          uri: company.logo_url + (company.logo_url.includes('?') ? '&' : '?') + 't=' + Date.now()
                        }}
                        style={styles.companyLogo}
                        resizeMode="contain"
                        onError={(e) => {
                          console.error('Dashboard: Error loading logo (with bg):', company.logo_url, e.nativeEvent.error);
                        }}
                        onLoad={() => {
                          console.log('Dashboard: Logo loaded successfully (with bg):', company.logo_url);
                        }}
                      />
                    </View>
                  )}
                  <Text style={[styles.companyName, { color: "#FFFFFF" }]}>
                    {userType === "company"
                      ? company?.name || (user as Company)?.name || "Welcome"
                      : user
                      ? `${(user as any).first_name || ""} ${
                          (user as any).last_name || ""
                        }`.trim() || "Welcome"
                      : "Welcome"}
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
                        key={`dashboard-logo-fallback-${company.logo_url}`}
                        source={{ 
                          uri: company.logo_url + (company.logo_url.includes('?') ? '&' : '?') + 't=' + Date.now()
                        }}
                        style={styles.companyLogo}
                        resizeMode="contain"
                        onError={(e) => {
                          console.error('Dashboard: Error loading logo (fallback):', company.logo_url, e.nativeEvent.error);
                        }}
                        onLoad={() => {
                          console.log('Dashboard: Logo loaded successfully (fallback):', company.logo_url);
                        }}
                      />
                    </View>
                  )}
                  <Text style={[styles.companyName, { color: "#FFFFFF" }]}>
                    {userType === "company"
                      ? company?.name || (user as Company)?.name || "Welcome"
                      : user
                      ? `${(user as any).first_name || ""} ${
                          (user as any).last_name || ""
                        }`.trim() || "Welcome"
                      : "Welcome"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <StatCard
              title="Aylık Hedef"
              value={`${Math.round((stats.monthlyGoalProgress / (stats.monthlyGoal || 1)) * 100)}%`}
              icon="flag"
              color={theme.colors.primary}
              onPress={() => navigation.navigate("Goals")}
              progress={Math.min(10, Math.round((stats.monthlyGoalProgress / (stats.monthlyGoal || 1)) * 10))}
            />
            <View style={styles.twoCardsRow}>
              <StatCard
                title="İstatistik"
                value={stats.statistics}
                icon="bar-chart"
                color={theme.colors.secondary || "#10B981"}
                onPress={() => navigation.navigate("Reports")}
                style={{ width: "48%" }}
              />
              <StatCard
                title="Aktif Personel"
                value={stats.activeEmployees}
                icon="people"
                color={theme.colors.warning || "#F59E0B"}
                onPress={() => navigation.navigate("Employees")}
                style={{ width: "48%" }}
              />
            </View>
          </View>

          <View style={styles.quickAccessSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Hızlı Erişim
            </Text>
            <View style={styles.quickActionsContainer}>
              {userType === "company" && (
                <>
                  <QuickAction
                    title="Personeller"
                    icon="people-outline"
                    onPress={() => navigation.navigate("Employees")}
                  />
                  <QuickAction
                    title="Müşteriler"
                    icon="business"
                    onPress={() => navigation.navigate("Customers")}
                  />
                </>
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
              {userType === "company" && (
                <>
                  <QuickAction
                    title="Personel Raporları"
                    icon="assessment"
                    onPress={() => navigation.navigate("EmployeeReports")}
                  />
                  <QuickAction
                    title="Roller"
                    icon="admin-panel-settings"
                    onPress={() => navigation.navigate("Roles")}
                  />
                </>
              )}
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
    flexDirection: "column",
    gap: 12,
    marginBottom: 0,
    paddingHorizontal: 16,
  },
  twoCardsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 0,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statCardMain: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  progressBars: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  quickAccessSection: {
    paddingHorizontal: 16,
    marginBottom: 0,
    paddingBottom: 0,
    marginTop: 8,
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
