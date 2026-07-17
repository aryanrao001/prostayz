import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Booking = {
  id: string; item_type: string; item_id: string; item_title: string; item_image: string;
  item_location: string; user_name: string; user_email: string;
  check_in?: string; check_out?: string; guests: number;
  total_price: number; status: string; created_at: string;
};

const STATUSES = ["confirmed", "completed", "pending", "cancelled"];

export default function AdminBookings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try { setBookings(await api<Booking[]>("/admin/bookings", { auth: true })); }
    catch (e: any) { Alert.alert("Error", e.message); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const changeStatus = (b: Booking) => {
    Alert.alert("Update status", `Current: ${b.status}\nSelect new status for this booking.`,
      [...STATUSES.filter(s => s !== b.status).map(s => ({
        text: s.charAt(0).toUpperCase() + s.slice(1),
        onPress: async () => {
          try { await api(`/admin/bookings/${b.id}`, { method: "PUT", auth: true, body: { status: s } }); await load(); }
          catch (e: any) { Alert.alert("Error", e.message); }
        }
      })), { text: "Cancel", style: "cancel" }]);
  };

  const handleDelete = (b: Booking) => {
    Alert.alert("Delete booking?", `Permanently delete booking for ${b.item_title}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try { await api(`/admin/bookings/${b.id}`, { method: "DELETE", auth: true }); await load(); }
          catch (e: any) { Alert.alert("Error", e.message); }
        }
      },
    ]);
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const totalRevenue = filtered.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>All Bookings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>{filter === "all" ? "TOTAL" : filter.toUpperCase()} REVENUE</Text>
          <Text style={styles.summaryAmount}>₹{totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.summaryLabel}>BOOKINGS</Text>
          <Text style={styles.summaryAmount}>{filtered.length}</Text>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["all", ...STATUSES]}
        keyExtractor={(s) => s}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity testID={`filter-${item}`} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.item_image }} style={styles.img} />
              <View style={styles.body}>
                <View style={styles.rowBetween}>
                  <View style={styles.typePill}>
                    <Ionicons name={item.item_type === "stay" ? "bed-outline" : "airplane-outline"} size={10} color={theme.colors.primary} />
                    <Text style={styles.typeText}>{item.item_type.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity testID={`status-${item.id}`} onPress={() => changeStatus(item)} style={[styles.statusPill, statusStyle(item.status)]}>
                    <View style={[styles.statusDot, { backgroundColor: statusDot(item.status) }]} />
                    <Text style={styles.statusText}>{item.status}</Text>
                    <Ionicons name="chevron-down" size={10} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.title} numberOfLines={1}>{item.item_title}</Text>
                <Text style={styles.loc} numberOfLines={1}>{item.item_location}</Text>
                <View style={styles.userRow}>
                  <Ionicons name="person-circle-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.userText}>{item.user_name} · {item.user_email}</Text>
                </View>
                {item.check_in && <Text style={styles.dates}>{item.check_in} → {item.check_out} · {item.guests} guest{item.guests > 1 ? "s" : ""}</Text>}
                <View style={styles.rowBetween}>
                  <Text style={styles.price}>₹{item.total_price.toLocaleString()}</Text>
                  <TouchableOpacity testID={`del-${item.id}`} onPress={() => handleDelete(item)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No bookings in this filter.</Text>}
        />
      )}
    </View>
  );
}

const statusStyle = (s: string) => {
  if (s === "confirmed") return { backgroundColor: "#E8F0E9" };
  if (s === "completed") return { backgroundColor: "#E4F0D1" };
  if (s === "cancelled") return { backgroundColor: "#FBE8CE" };
  return { backgroundColor: theme.colors.muted };
};
const statusDot = (s: string) => {
  if (s === "confirmed") return theme.colors.success;
  if (s === "completed") return theme.colors.primary;
  if (s === "cancelled") return "#B94C36";
  return theme.colors.textTertiary;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  summary: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: theme.colors.secondary, marginHorizontal: 20, borderRadius: theme.radius.lg, marginTop: 10 },
  summaryLabel: { fontSize: 10, letterSpacing: 1.4, color: theme.colors.accent, fontWeight: "700" },
  summaryAmount: { fontSize: 24, fontWeight: "700", color: theme.colors.textInverse, marginTop: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: theme.colors.surface, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 10, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: 0.8 },
  filterTextActive: { color: theme.colors.textInverse },
  card: { flexDirection: "row", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  img: { width: 64, height: 64, borderRadius: theme.radius.md, backgroundColor: theme.colors.muted },
  body: { flex: 1, gap: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FBE8CE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radius.full },
  typeText: { fontSize: 9, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.5 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", color: theme.colors.textPrimary, textTransform: "capitalize" },
  title: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  loc: { fontSize: 11, color: theme.colors.textSecondary },
  userRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  userText: { fontSize: 11, color: theme.colors.textSecondary },
  dates: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 4 },
  delBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FBE8CE" },
  empty: { textAlign: "center", color: theme.colors.textSecondary, marginTop: 60, fontSize: 13 },
});
