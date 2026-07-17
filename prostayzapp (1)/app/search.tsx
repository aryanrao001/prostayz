import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../src/theme";
import { api } from "../src/api";

type Result = {
  id: string;
  title: string;
  image: string;
  location: string;
  price: number;
  type: "stay" | "package";
};

export default function Search() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) { setResults([]); return; }
      setLoading(true);
      try {
        const [stays, pkgs] = await Promise.all([
          api<any[]>(`/stays?q=${encodeURIComponent(q)}`),
          api<any[]>(`/packages?q=${encodeURIComponent(q)}`),
        ]);
        const mapped: Result[] = [
          ...stays.map((s) => ({ id: s.id, title: s.title, image: s.images[0], location: s.location, price: s.price_per_night, type: "stay" as const })),
          ...pkgs.map((p) => ({ id: p.id, title: p.title, image: p.cover_image, location: p.destination, price: p.price, type: "package" as const })),
        ];
        setResults(mapped);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const suggestions = ["Kerala", "Manali", "Goa", "Rajasthan", "Ladakh", "Rishikesh"];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity testID="search-close" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={16} color={theme.colors.textPrimary} />
          <TextInput
            testID="search-input"
            style={styles.input}
            value={q}
            onChangeText={setQ}
            placeholder="Where would you like to go?"
            placeholderTextColor={theme.colors.textTertiary}
            autoFocus
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!q && (
        <View style={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Trending destinations</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} testID={`sugg-${s}`} style={styles.sugg} onPress={() => setQ(s)}>
                <Ionicons name="trending-up-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.suggText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primary} />}

      <FlatList
        data={results}
        keyExtractor={(i) => `${i.type}-${i.id}`}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`sr-${item.type}-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.replace(item.type === "stay" ? `/stay/${item.id}` : `/package/${item.id}`)}
          >
            <Image source={{ uri: item.image }} style={styles.resultImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultType}>{item.type === "stay" ? "STAY" : "HOLIDAY PACKAGE"}</Text>
              <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.resultLoc} numberOfLines={1}>{item.location}</Text>
              <Text style={styles.resultPrice}>₹{item.price.toLocaleString()}{item.type === "stay" ? " / night" : ""}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          q && !loading ? (
            <Text style={styles.empty}>No matches for "{q}"</Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: theme.colors.bg,
  },
  closeBtn: { padding: 4 },
  searchInputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, padding: 0 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1.2, textTransform: "uppercase" },
  sugg: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  suggText: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  resultRow: {
    flexDirection: "row", gap: 14, padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  resultImg: { width: 80, height: 80, borderRadius: theme.radius.md },
  resultType: { fontSize: 10, letterSpacing: 1.2, fontWeight: "700", color: theme.colors.primary },
  resultTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 4 },
  resultLoc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  resultPrice: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 6 },
  empty: { textAlign: "center", color: theme.colors.textSecondary, marginTop: 40 },
});
