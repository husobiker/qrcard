import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function MarketingStaffSearchCallScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
          <Icon name="phone" size={64} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Sanal Santral Özelliği
        </Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Sanal santral özelliği yakında eklenecek. Bu özellik ile müşterileri arayıp iletişime geçebileceksiniz.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
