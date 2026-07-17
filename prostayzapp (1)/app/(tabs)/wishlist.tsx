import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";

type Stay = { id: string; title: string; location: string; price_per_night: number; rating: number; images: string[] };
type Pkg = { id: string; title: string; destination: string; duration_nights: number; duration_days: number; price: number; cover_image: string; rating: number };

export default function Wishlist() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<{ stays: Stay[]; packages: Pkg[] }>({ stays: [], packages: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setData({ stays: [], packages: [] }); return; }
    try {
      const res = await api<{ stays: Stay[]; packages: Pkg[] }>("/wishlist", { auth: true });
      setData(res);
    } catch (e) { console.warn(e); }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.h1}>Your wishlist</Text>
        <View style={styles.emptyBox}>
          <Ionicons name="heart-outline" size={48} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>Log in to save favourites</Text>
          <Text style={styles.emptySub}>You can keep a collection of your favourite stays and trips here.</Text>
          <TouchableOpacity testID="wishlist-login-btn" onPress={() => router.push("/auth/login")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.h1}>Your wishlist</Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {data.stays.length === 0 && data.packages.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="heart-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySub}>Tap the heart on a stay or journey to collect it here.</Text>
            </View>
          )}
          {data.stays.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Stays</Text>
              {data.stays.map((s) => (
                <TouchableOpacity key={s.id} testID={`wl-stay-${s.id}`} style={styles.row} onPress={() => router.push(`/stay/${s.id}`)}>
                  <Image source={{ uri: s.images[0] }} style={styles.rowImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{s.location}</Text>
                    <Text style={styles.rowPrice}>₹{s.price_per_night.toLocaleString()} / night</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </>
          )}
          {data.packages.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Journeys</Text>
              {data.packages.map((p) => (
                <TouchableOpacity key={p.id} testID={`wl-pkg-${p.id}`} style={styles.row} onPress={() => router.push(`/package/${p.id}`)}>
                  <Image source={{ uri: p.cover_image }} style={styles.rowImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{p.duration_nights}N/{p.duration_days}D · {p.destination}</Text>
                    <Text style={styles.rowPrice}>₹{p.price.toLocaleString()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 20 },
  h1: { fontSize: 28, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 18, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 10,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  rowImg: { width: 76, height: 76, borderRadius: theme.radius.md },
  rowTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  rowSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  rowPrice: { fontSize: 13, fontWeight: "700", color: theme.colors.primary, marginTop: 4 },
  emptyBox: {
    marginTop: 60, padding: 28, alignItems: "center",
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
  primaryBtn: {
    marginTop: 20, backgroundColor: theme.colors.primary,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full,
  },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
});
