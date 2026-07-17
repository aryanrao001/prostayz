import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Booking = { id: string; item_type: string; item_title: string; item_image: string; item_location: string; user_name: string; user_email: string; check_in?: string; check_out?: string; guests: number; total_price: number; status: string };

export default function VendorBookings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems(await api<Booking[]>("/vendor/bookings", { auth: true })); }
    catch (e: any) { Alert.alert("Error", e.message); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const revenue = items.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Bookings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLbl}>REVENUE</Text>
          <Text style={styles.summaryAmt}>₹{revenue.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.summaryLbl}>ORDERS</Text>
          <Text style={styles.summaryAmt}>{items.length}</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.item_image }} style={styles.img} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.rowBetween}>
                  <View style={styles.typePill}>
                    <Ionicons name={item.item_type === "stay" ? "bed-outline" : "airplane-outline"} size={10} color={theme.colors.primary} />
                    <Text style={styles.typeText}>{item.item_type.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusPill, item.status === "confirmed" && { backgroundColor: "#E8F0E9" }]}>
                    <Text style={[styles.statusText, item.status === "confirmed" && { color: theme.colors.success }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.title} numberOfLines={1}>{item.item_title}</Text>
                <Text style={styles.userText}>{item.user_name} · {item.user_email}</Text>
                {item.check_in && <Text style={styles.dates}>{item.check_in} → {item.check_out} · {item.guests} guest{item.guests > 1 ? "s" : ""}</Text>}
                <Text style={styles.price}>₹{item.total_price.toLocaleString()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>Your incoming reservations will show up here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  summary: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: theme.colors.secondary, marginHorizontal: 20, borderRadius: theme.radius.lg, marginTop: 10 },
  summaryLbl: { fontSize: 10, letterSpacing: 1.4, color: theme.colors.accent, fontWeight: "700" },
  summaryAmt: { fontSize: 22, fontWeight: "700", color: theme.colors.textInverse, marginTop: 4 },
  card: { flexDirection: "row", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  img: { width: 60, height: 60, borderRadius: theme.radius.md },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FBE8CE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radius.full },
  typeText: { fontSize: 9, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.full, backgroundColor: theme.colors.muted },
  statusText: { fontSize: 10, fontWeight: "700", color: theme.colors.textPrimary, textTransform: "capitalize" },
  title: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  userText: { fontSize: 11, color: theme.colors.textSecondary },
  dates: { fontSize: 11, color: theme.colors.textSecondary },
  price: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 4 },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6 },
});
