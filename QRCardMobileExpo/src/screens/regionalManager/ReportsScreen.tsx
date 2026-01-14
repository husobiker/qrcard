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
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function RegionalReportsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right", "top"]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Bölge Raporları
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyContainer}>
          <Icon
            name="bar-chart"
            size={64}
            color={theme.colors.gray400}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Raporlar yakında eklenecek
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
});
