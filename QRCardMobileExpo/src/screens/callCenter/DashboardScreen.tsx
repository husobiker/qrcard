import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { getLeads } from "../../services/crmService";
import { getCompanyById } from "../../services/companyService";
import { getEmployeePublicUrl } from "../../utils/url";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { Employee, Company } from "../../types";

export default function CallCenterDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const employee = user as Employee;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [customerStatusDistribution, setCustomerStatusDistribution] = useState({
    Yeni: 0,
    Görüşüldü: 0,
    "Satış Yapıldı": 0,
    Reddedildi: 0,
    Takipte: 0,
  });

  useEffect(() => {
    if (employee?.company_id) {
      loadCustomerStatusDistribution();
      loadCompany();
    }
  }, [employee]);

  const loadCompany = async () => {
    if (!employee?.company_id) return;
    try {
      const companyData = await getCompanyById(employee.company_id);
      if (companyData) {
        setCompany(companyData);
      }
    } catch (error) {
      console.error("Error loading company:", error);
    }
  };

  const loadCustomerStatusDistribution = async () => {
    if (!employee?.company_id) return;

    setLoading(true);
    try {
      // Load all customers
      const customers = await getLeads(employee.company_id);

      // Calculate customer status distribution
      const statusDistribution = {
        Yeni: customers.filter((c) => c.status === "Yeni").length,
        Görüşüldü: customers.filter((c) => c.status === "Görüşüldü").length,
        "Satış Yapıldı": customers.filter((c) => c.status === "Satış Yapıldı").length,
        Reddedildi: customers.filter((c) => c.status === "Reddedildi").length,
        Takipte: customers.filter((c) => c.status === "Takipte").length,
      };

      setCustomerStatusDistribution(statusDistribution);
    } catch (error) {
      console.error("Error loading customer status distribution:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomerStatusDistribution();
    await loadCompany();
  };

  const getPublicUrl = () => {
    if (!employee || !company) return "";
    return getEmployeePublicUrl(company.id, employee.id);
  };

  const handleShare = async () => {
    const url = getPublicUrl();
    try {
      await Share.share({
        message: `${employee?.first_name} ${employee?.last_name} - ${company?.name}\n${url}`,
        url: url,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const QuickActionButton = ({
    title,
    icon,
    onPress,
  }: {
    title: string;
    icon: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.quickActionButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray200,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
        <Icon name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Çağrı Merkezi Paneli
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {employee?.first_name && employee?.last_name
              ? `${employee.first_name} ${employee.last_name}`
              : employee?.username || "Kullanıcı"}
          </Text>
        </View>

        {/* Customer Status Distribution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Müşteri Durum Dağılımı
          </Text>
          <View style={styles.statusGrid}>
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={[styles.statusBadge, { backgroundColor: "#6B7280" + "20" }]}>
                <Text style={[styles.statusText, { color: "#6B7280" }]}>Yeni</Text>
              </View>
              <Text style={[styles.statusCount, { color: theme.colors.text }]}>
                {customerStatusDistribution.Yeni}
              </Text>
            </View>
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={[styles.statusBadge, { backgroundColor: "#3B82F6" + "20" }]}>
                <Text style={[styles.statusText, { color: "#3B82F6" }]}>Görüşüldü</Text>
              </View>
              <Text style={[styles.statusCount, { color: theme.colors.text }]}>
                {customerStatusDistribution.Görüşüldü}
              </Text>
            </View>
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={[styles.statusBadge, { backgroundColor: "#10B981" + "20" }]}>
                <Text style={[styles.statusText, { color: "#10B981" }]}>Satış Yapıldı</Text>
              </View>
              <Text style={[styles.statusCount, { color: theme.colors.text }]}>
                {customerStatusDistribution["Satış Yapıldı"]}
              </Text>
            </View>
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={[styles.statusBadge, { backgroundColor: "#F59E0B" + "20" }]}>
                <Text style={[styles.statusText, { color: "#F59E0B" }]}>Takipte</Text>
              </View>
              <Text style={[styles.statusCount, { color: theme.colors.text }]}>
                {customerStatusDistribution.Takipte}
              </Text>
            </View>
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                },
              ]}
            >
              <View style={[styles.statusBadge, { backgroundColor: "#EF4444" + "20" }]}>
                <Text style={[styles.statusText, { color: "#EF4444" }]}>Reddedildi</Text>
              </View>
              <Text style={[styles.statusCount, { color: theme.colors.text }]}>
                {customerStatusDistribution.Reddedildi}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Hızlı İşlemler
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title="Müşteri Ara"
              icon="phone"
              onPress={() => navigation.navigate("CallCenterSearchCall")}
            />
            <QuickActionButton
              title="Yeni Müşteri"
              icon="person-add"
              onPress={() => {
                navigation.navigate("CallCenterCRM");
                // Navigate to CRM screen and open new customer modal
                setTimeout(() => {
                  navigation.navigate("CallCenterCRM", { openNewCustomerModal: true });
                }, 100);
              }}
            />
            <QuickActionButton
              title="Müşteri Kayıtları"
              icon="people"
              onPress={() => navigation.navigate("CallCenterCRM")}
            />
            <QuickActionButton
              title="Performans"
              icon="bar-chart"
              onPress={() => navigation.navigate("CallCenterPerformance")}
            />
          </View>
        </View>

        {/* QR Code Section */}
        {employee && company && (
          <View style={styles.section}>
            <View
              style={[
                styles.qrSection,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>QR Kodum</Text>
              <QRCodeGenerator
                url={getPublicUrl()}
                employeeName={`${employee?.first_name || ""} ${employee?.last_name || ""}`}
                employeeId={employee.id}
              />
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: theme.colors.primaryDark }]}
                onPress={handleShare}
              >
                <Icon name="share" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusCount: {
    fontSize: 24,
    fontWeight: "700",
  },
  qrSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
