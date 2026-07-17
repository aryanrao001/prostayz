import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Pkg = { id: string; title: string; destination: string; duration_nights: number; duration_days: number; price: number; category: string; cover_image: string };

export default function VendorPackages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems(await api<Pkg[]>("/vendor/packages", { auth: true })); }
    catch (e: any) { Alert.alert("Error", e.message); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete?", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api(`/vendor/packages/${id}`, { method: "DELETE", auth: true }); await load(); }
        catch (e: any) { Alert.alert("Error", e.message); }
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Holiday Packages</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.subBar}>
        <Text style={styles.subBarText}>{items.length} packages</Text>
        <TouchableOpacity testID="add-new" style={styles.addBtn} onPress={() => router.push("/admin/package-form/new")}>
          <Ionicons name="add" size={18} color={theme.colors.textInverse} />
          <Text style={styles.addBtnText}>Add package</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={{ uri: item.cover_image }} style={styles.img} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cat}>{item.duration_nights}N/{item.duration_days}D · {item.category.toUpperCase()}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.loc} numberOfLines={1}>{item.destination}</Text>
                <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity testID={`edit-${item.id}`} style={styles.actionBtn} onPress={() => router.push(`/admin/package-form/${item.id}`)}>
                  <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity testID={`delete-${item.id}`} style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="airplane-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No packages yet</Text>
              <Text style={styles.emptySub}>Curate your first holiday trip with day-by-day itinerary.</Text>
              <TouchableOpacity style={styles.addBtnLarge} onPress={() => router.push("/admin/package-form/new")}>
                <Text style={styles.addBtnText}>Add package</Text>
              </TouchableOpacity>
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
  subBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  subBarText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full },
  addBtnLarge: { marginTop: 18, backgroundColor: theme.colors.primary, paddingHorizontal: 26, paddingVertical: 12, borderRadius: theme.radius.full },
  addBtnText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 12 },
  row: { flexDirection: "row", gap: 12, padding: 10, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  img: { width: 80, height: 96, borderRadius: theme.radius.md, backgroundColor: theme.colors.muted },
  cat: { fontSize: 9, letterSpacing: 1.2, fontWeight: "700", color: theme.colors.primary },
  title: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 4, lineHeight: 17 },
  loc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  price: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#E4F0D1" },
  deleteBtn: { backgroundColor: theme.colors.primary },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6 },
});
