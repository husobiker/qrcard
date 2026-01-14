import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { FIXED_ROLES } from "../../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface FixedRoleInfo {
  name: string;
  description: string;
  capabilities: string[];
  icon: string;
  color: string;
}

const FIXED_ROLES_INFO: Record<string, FixedRoleInfo> = {
  [FIXED_ROLES.COMPANY]: {
    name: FIXED_ROLES.COMPANY,
    description: "Tüm sistem yetkilerine sahiptir. Tüm verileri görüntüleyebilir ve yönetebilir.",
    capabilities: [
      "Tüm personelleri görüntüleme ve yönetme",
      "Tüm müşterileri ve kayıtları görüntüleme",
      "Tüm görevleri görüntüleme ve atama",
      "Bölge yönetimi",
      "Raporlara erişim",
      "Sistem ayarları"
    ],
    icon: "business",
    color: "#3B82F6"
  },
  [FIXED_ROLES.REGIONAL_MANAGER]: {
    name: FIXED_ROLES.REGIONAL_MANAGER,
    description: "Sadece kendi bölgesindeki verileri görüntüleyebilir ve yönetebilir.",
    capabilities: [
      "Kendi bölgesindeki personelleri görüntüleme",
      "Kendi bölgesindeki müşterileri görüntüleme",
      "Kendi bölgesindeki görevleri görüntüleme ve atama",
      "Bölge içi işlem yapma yetkisi"
    ],
    icon: "location-on",
    color: "#10B981"
  },
  [FIXED_ROLES.CALL_CENTER]: {
    name: FIXED_ROLES.CALL_CENTER,
    description: "Tüm müşterileri ve kayıtları görüntüleyebilir, görev atayabilir.",
    capabilities: [
      "Tüm müşterileri görüntüleme",
      "Yeni müşteri kaydı oluşturma",
      "Görev atama yetkisi",
      "Tüm kayıtları görüntüleme"
    ],
    icon: "phone",
    color: "#F59E0B"
  },
  [FIXED_ROLES.MARKETING_STAFF]: {
    name: FIXED_ROLES.MARKETING_STAFF,
    description: "Sadece kendi kayıtlarını ve kendisine atanan görevleri görüntüleyebilir.",
    capabilities: [
      "Kendi kayıtlarını görüntüleme",
      "Kendisine atanan görevleri görüntüleme ve güncelleme",
      "Kendi kayıtlarını oluşturma ve düzenleme"
    ],
    icon: "person",
    color: "#8B5CF6"
  },
  [FIXED_ROLES.CUSTOMER]: {
    name: FIXED_ROLES.CUSTOMER,
    description: "Müşteri rolü. Sadece okuma yetkisi vardır.",
    capabilities: [
      "Kendi bilgilerini görüntüleme",
      "Randevularını görüntüleme"
    ],
    icon: "account-circle",
    color: "#6B7280"
  }
};

export default function RolesScreen({ navigation }: any) {
  const { theme } = useTheme();

  const renderRoleCard = (roleKey: string, roleInfo: FixedRoleInfo) => {
    return (
      <View
        key={roleKey}
        style={[
          styles.roleCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray200 || "#E5E7EB",
          },
        ]}
      >
        <View style={styles.roleCardHeader}>
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: roleInfo.color + "15" },
            ]}
          >
            <Icon name={roleInfo.icon as any} size={24} color={roleInfo.color} />
          </View>
          <View style={styles.roleCardTitleContainer}>
            <Text style={[styles.roleTitle, { color: theme.colors.text }]}>
              {roleInfo.name}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.roleDescription,
            { color: theme.colors.textSecondary },
          ]}
        >
          {roleInfo.description}
        </Text>
        <View style={styles.capabilitiesContainer}>
          <Text
            style={[
              styles.capabilitiesTitle,
              { color: theme.colors.text },
            ]}
          >
            Yetkiler:
          </Text>
          {roleInfo.capabilities.map((capability, index) => (
            <View key={index} style={styles.capabilityItem}>
              <Icon
                name="check-circle"
                size={16}
                color={roleInfo.color}
                style={styles.capabilityIcon}
              />
              <Text
                style={[
                  styles.capabilityText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {capability}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200, paddingTop: 10 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Rol Yönetimi
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Sistem rolleri ve yetkileri
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(FIXED_ROLES_INFO)
          .filter(([key]) => key !== FIXED_ROLES.COMPANY && key !== FIXED_ROLES.CUSTOMER)
          .map(([key, info]) => renderRoleCard(key, info))}
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  roleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  roleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roleCardTitleContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  capabilitiesContainer: {
    marginTop: 8,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  capabilityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  capabilityIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  capabilityText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
