import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Stay = { id: string; title: string; location: string; category: string; price_per_night: number; rating: number; images: string[] };

export default function AdminStaysList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api<Stay[]>("/admin/stays", { auth: true });
      setStays(data);
    } catch (e: any) { Alert.alert("Error", e.message); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete stay?", `Are you sure you want to remove "${title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try { await api(`/admin/stays/${id}`, { method: "DELETE", auth: true }); await load(); }
          catch (e: any) { Alert.alert("Error", e.message); }
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Stays / Villas / Hotels</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.subBar}>
        <Text style={styles.subBarText}>{stays.length} properties</Text>
        <TouchableOpacity testID="add-stay" style={styles.addBtn} onPress={() => router.push("/admin/stay-form/new")}>
          <Ionicons name="add" size={18} color={theme.colors.textInverse} />
          <Text style={styles.addBtnText}>Add new</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={stays}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={{ uri: item.images?.[0] }} style={styles.img} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cat}>{item.category.toUpperCase()}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.loc} numberOfLines={1}>{item.location}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Ionicons name="star" size={11} color={theme.colors.accent} />
                    <Text style={styles.rating}>{item.rating}</Text>
                  </View>
                  <Text style={styles.price}>₹{item.price_per_night.toLocaleString()}/night</Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity testID={`edit-${item.id}`} style={styles.actionBtn} onPress={() => router.push(`/admin/stay-form/${item.id}`)}>
                  <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity testID={`delete-${item.id}`} style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No stays yet. Tap "Add new" to create one.</Text>}
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
  subBarText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600", letterSpacing: 0.5 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full },
  addBtnText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 12 },
  row: { flexDirection: "row", gap: 12, padding: 10, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  img: { width: 80, height: 80, borderRadius: theme.radius.md, backgroundColor: theme.colors.muted },
  cat: { fontSize: 9, letterSpacing: 1.2, fontWeight: "700", color: theme.colors.primary },
  title: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 2 },
  loc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 11, fontWeight: "600", color: theme.colors.textPrimary },
  price: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#E4F0D1" },
  deleteBtn: { backgroundColor: theme.colors.primary },
  empty: { textAlign: "center", color: theme.colors.textSecondary, marginTop: 60, fontSize: 13 },
});
