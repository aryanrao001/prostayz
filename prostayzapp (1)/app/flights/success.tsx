import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";

export default function FlightSuccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ booking_id: string; mock: string; payment_id: string }>();
  const isMock = params.mock === "1";

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40 }]}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
      </View>
      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>Your flight has been booked successfully.</Text>

      <View style={styles.detailCard}>
        <Row label="Booking ID" value={params.booking_id || "—"} />
        <Row label="Payment ID" value={(params.payment_id || "—").substring(0, 24) + "..."} />
        <Row label="Status" value="Confirmed" />
      </View>

      {isMock && (
        <View style={styles.mockBanner}>
          <Ionicons name="information-circle" size={14} color={theme.colors.warning} />
          <Text style={styles.mockText}>Mock payment used. Add real Razorpay keys to enable production payments.</Text>
        </View>
      )}

      <View style={{ width: "100%", marginTop: 28, gap: 10 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/trips")}>
          <Text style={styles.primaryBtnText}>View My Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, alignItems: "center" },
  successIcon: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, textAlign: "center" },
  detailCard: { width: "100%", marginTop: 28, padding: 18, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  rowValue: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: "700", flexShrink: 1, marginLeft: 12 },
  mockBanner: { flexDirection: "row", gap: 8, alignItems: "center", padding: 12, backgroundColor: "rgba(255,184,0,0.1)", borderRadius: theme.radius.md, marginTop: 16, width: "100%" },
  mockText: { flex: 1, fontSize: 11, color: theme.colors.warning, fontWeight: "600" },
  primaryBtn: { paddingVertical: 14, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondaryBtn: { paddingVertical: 14, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border },
  secondaryBtnText: { color: theme.colors.textPrimary, fontWeight: "800", fontSize: 14 },
});
