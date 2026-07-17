import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../src/theme";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(tabs)"), 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logoMark}>
          <Ionicons name="compass" size={42} color={theme.colors.textInverse} />
        </View>
        <Text style={styles.brand}>Prostayz</Text>
        <Text style={styles.tag}>Wander thoughtfully.</Text>
      </View>
      <View style={styles.bottomBar}>
        <View style={[styles.barDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.barDot, { backgroundColor: theme.colors.sageLight }]} />
        <View style={[styles.barDot, { backgroundColor: theme.colors.accentSoft }]} />
        <View style={[styles.barDot, { backgroundColor: theme.colors.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center" },
  logoMark: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 22,
  },
  brand: { fontSize: 42, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: -1 },
  tag: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 6, letterSpacing: 3, textTransform: "uppercase" },
  bottomBar: { position: "absolute", bottom: 80, flexDirection: "row", gap: 8 },
  barDot: { width: 32, height: 6, borderRadius: 3 },
});
