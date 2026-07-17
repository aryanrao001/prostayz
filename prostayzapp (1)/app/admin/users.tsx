import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type User = { id: string; name: string; email: string; role: string; created_at: string; bookings_count: number; wishlist_count: number };

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setUsers(await api<User[]>("/admin/users", { auth: true })); }
    catch (e: any) { Alert.alert("Error", e.message); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.length - adminCount;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Users</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{userCount}</Text>
          <Text style={styles.summaryLbl}>Travellers</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{adminCount}</Text>
          <Text style={styles.summaryLbl}>Admins</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{users.reduce((s, u) => s + u.bookings_count, 0)}</Text>
          <Text style={styles.summaryLbl}>Bookings</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, item.role === "admin" && { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "U"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {item.role === "admin" && (
                    <View style={styles.adminPill}><Text style={styles.adminPillText}>ADMIN</Text></View>
                  )}
                </View>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Ionicons name="receipt-outline" size={10} color={theme.colors.textSecondary} />
                    <Text style={styles.statText}>{item.bookings_count} bookings</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Ionicons name="heart-outline" size={10} color={theme.colors.textSecondary} />
                    <Text style={styles.statText}>{item.wishlist_count} saved</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.joined}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No users yet.</Text>}
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
  summary: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 14 },
  summaryCard: { flex: 1, padding: 14, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  summaryNum: { fontSize: 22, fontWeight: "700", color: theme.colors.primary },
  summaryLbl: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 0.8, marginTop: 2, textTransform: "uppercase" },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 16 },
  name: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  email: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  adminPill: { backgroundColor: theme.colors.accent, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  adminPillText: { fontSize: 9, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "600" },
  joined: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: "600" },
  empty: { textAlign: "center", color: theme.colors.textSecondary, marginTop: 60, fontSize: 13 },
});
