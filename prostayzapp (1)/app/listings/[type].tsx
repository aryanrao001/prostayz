import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import StaySearchSheet, { StaySearchValues } from "../../src/components/StaySearchSheet";

const { width } = Dimensions.get("window");
const FEATURE_W = Math.round(width * 0.72);

type Stay = {
  id: string; title: string; location: string; city: string; category: string;
  price_per_night: number; rating: number; reviews_count: number; images: string[];
  thumbnail?: string;
};

type Package = {
  id: string; title: string; destination: string; duration_nights: number; duration_days: number;
  price: number; original_price?: number; rating: number; reviews_count: number;
  category: string; cover_image: string; short_description: string; thumbnail?: string;
};

const STAY_CATEGORIES = [
  { key: "all", label: "All", icon: "globe-outline" as const },
  { key: "Beachfront", label: "Beach", icon: "sunny-outline" as const },
  { key: "Cabin", label: "Cabins", icon: "home-outline" as const },
  { key: "Heritage", label: "Heritage", icon: "business-outline" as const },
  { key: "Houseboat", label: "Houseboat", icon: "boat-outline" as const },
  { key: "Treehouse", label: "Treehouse", icon: "leaf-outline" as const },
  { key: "Mountain", label: "Mountain", icon: "triangle-outline" as const },
  { key: "Unique", label: "Unique", icon: "sparkles-outline" as const },
];

const PKG_CATEGORIES = [
  { key: "all", label: "All", icon: "compass-outline" as const },
  { key: "Beach", label: "Beach", icon: "sunny-outline" as const },
  { key: "Mountain", label: "Mountain", icon: "triangle-outline" as const },
  { key: "Heritage", label: "Heritage", icon: "business-outline" as const },
  { key: "Adventure", label: "Adventure", icon: "bicycle-outline" as const },
  { key: "Spiritual", label: "Spiritual", icon: "flower-outline" as const },
];

const TITLE_MAP: Record<string, { title: string; subtitle: string; accent: string }> = {
  hotel: { title: "Hotels & Resorts", subtitle: "Stay in style across India", accent: theme.colors.secondary },
  villa: { title: "Villas & Homestays", subtitle: "Private, unique, hand-picked", accent: "#C97B5C" },
  packages: { title: "Holiday Packages", subtitle: "Curated trips with everything included", accent: "#8B6FA6" },
};

export default function Listings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const type = (params.type === "hotel" || params.type === "villa" || params.type === "packages") ? params.type : "villa";
  const isPackages = type === "packages";
  const meta = TITLE_MAP[type] || TITLE_MAP.villa;

  const [category, setCategory] = useState("all");
  const [stays, setStays] = useState<Stay[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<StaySearchValues | null>(null);

  const load = useCallback(async () => {
    try {
      const q = searchFilters?.destination ? `&q=${encodeURIComponent(searchFilters.destination)}` : "";
      if (isPackages) {
        const data = await api<Package[]>(`/packages?category=${category}${q}`);
        setPackages(data);
      } else {
        const data = await api<Stay[]>(`/stays?category=${category}&type=${type}${q}`);
        setStays(data);
      }
    } catch (e) {
      console.warn("load err", e);
    }
  }, [type, category, isPackages, searchFilters]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  };

  const cats = isPackages ? PKG_CATEGORIES : STAY_CATEGORIES;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: meta.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="back">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{meta.title}</Text>
          <Text style={styles.headerSub}>{meta.subtitle}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/wishlist")} style={styles.iconBtn}>
          <Ionicons name="heart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search shortcut */}
      <TouchableOpacity style={styles.searchBar} onPress={() => setSearchOpen(true)} testID="search-bar">
        <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
        <View style={{ flex: 1 }}>
          {searchFilters ? (
            <>
              <Text style={styles.searchText} numberOfLines={1}>{searchFilters.destination || "Anywhere"}</Text>
              <Text style={styles.searchSub} numberOfLines={1}>
                {searchFilters.checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {searchFilters.checkOut.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {searchFilters.adults + searchFilters.children} guests · {searchFilters.rooms} room{searchFilters.rooms > 1 ? "s" : ""}
              </Text>
            </>
          ) : (
            <Text style={styles.searchText}>Where to? Add dates · guests</Text>
          )}
        </View>
        <View style={[styles.filterDot, { backgroundColor: meta.accent }]}>
          <Ionicons name="options-outline" size={14} color="#fff" />
        </View>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          {cats.map((c) => {
            const active = category === c.key;
            return (
              <TouchableOpacity key={c.key} testID={`cat-${c.key}`} onPress={() => setCategory(c.key)} style={styles.catItem}>
                <View style={[styles.catIcon, active && { backgroundColor: meta.accent, borderColor: meta.accent }]}>
                  <Ionicons name={c.icon} size={18} color={active ? "#fff" : theme.colors.textSecondary} />
                </View>
                <Text style={[styles.catLabel, active && { color: theme.colors.textPrimary, fontWeight: "800" }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ paddingVertical: 60 }}>
            <ActivityIndicator color={meta.accent} />
          </View>
        ) : isPackages ? (
          <PackagesList packages={packages} router={router} />
        ) : (
          <StaysList stays={stays} router={router} />
        )}
      </ScrollView>

      <StaySearchSheet
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={(v) => setSearchFilters(v)}
        initial={searchFilters || undefined}
        accent={meta.accent}
        title={`Search ${meta.title}`}
      />
    </View>
  );
}

function StaysList({ stays, router }: { stays: Stay[]; router: any }) {
  if (stays.length === 0) return <Text style={styles.empty}>No properties found in this category.</Text>;
  const featured = stays.slice(0, 4);
  const rest = stays.slice(4);
  return (
    <View>
      <Text style={styles.sectionTitle}>Editor's picks</Text>
      <Text style={styles.sectionSub}>Top-rated this week</Text>
      <FlatList
        data={featured}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.featureCard, { width: FEATURE_W }]}
            onPress={() => router.push(`/stay/${item.id}`)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.thumbnail || item.images[0] }} style={styles.featureImg} />
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color={theme.colors.textPrimary} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.featureLoc} numberOfLines={1}>{item.location}</Text>
              <Text style={styles.featurePrice}><Text style={{ fontWeight: "800" }}>₹{item.price_per_night.toLocaleString()}</Text> / night</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {rest.length > 0 && <Text style={styles.sectionTitle}>More to explore</Text>}
      <View style={styles.listWrap}>
        {rest.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.listCard}
            onPress={() => router.push(`/stay/${item.id}`)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.thumbnail || item.images[0] }} style={styles.listImg} />
            <View style={{ flex: 1, padding: 12 }}>
              <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.listLoc} numberOfLines={1}>{item.location}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                <Ionicons name="star" size={11} color="#F4B400" />
                <Text style={styles.listRating}>{item.rating.toFixed(1)}</Text>
                <Text style={styles.listRev}>({item.reviews_count})</Text>
              </View>
              <Text style={styles.listPrice}>₹{item.price_per_night.toLocaleString()}<Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" }}> / night</Text></Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PackagesList({ packages, router }: { packages: Package[]; router: any }) {
  if (packages.length === 0) return <Text style={styles.empty}>No packages in this category.</Text>;
  return (
    <View style={styles.listWrap}>
      {packages.map((p) => (
        <TouchableOpacity key={p.id} style={styles.pkgCard} onPress={() => router.push(`/package/${p.id}`)} activeOpacity={0.9}>
          <Image source={{ uri: p.thumbnail || p.cover_image }} style={styles.pkgImg} />
          {p.original_price && (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>SAVE ₹{(p.original_price - p.price).toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.pkgBody}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <View style={styles.pkgChip}><Text style={styles.pkgChipText}>{p.category}</Text></View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Ionicons name="star" size={11} color="#F4B400" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary }}>{p.rating.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.pkgTitle} numberOfLines={1}>{p.title}</Text>
            <Text style={styles.pkgDest} numberOfLines={1}>{p.destination}</Text>
            <Text style={styles.pkgDur}>{p.duration_nights}N · {p.duration_days}D</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <Text style={styles.pkgPrice}>₹{p.price.toLocaleString()}</Text>
              {p.original_price && <Text style={styles.pkgOrig}>₹{p.original_price.toLocaleString()}</Text>}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 22,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: -16,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    elevation: 4,
  },
  searchText: { flex: 1, fontSize: 13, color: theme.colors.textPrimary, fontWeight: "700" },
  searchSub: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "500", marginTop: 2 },
  filterDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  catsRow: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, gap: 20 },
  catItem: { alignItems: "center", marginRight: 14 },
  catIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border },
  catLabel: { marginTop: 6, fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600" },
  sectionTitle: { marginTop: 22, paddingHorizontal: 16, fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3 },
  sectionSub: { paddingHorizontal: 16, marginTop: 2, marginBottom: 12, fontSize: 12, color: theme.colors.textSecondary },
  featureCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border },
  featureImg: { width: "100%", height: 180 },
  ratingPill: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  featureBody: { padding: 12 },
  featureTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
  featureLoc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  featurePrice: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 6 },
  listWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  listCard: { flexDirection: "row", backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border },
  listImg: { width: 110, height: 110 },
  listTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
  listLoc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  listRating: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  listRev: { fontSize: 11, color: theme.colors.textSecondary },
  listPrice: { marginTop: 6, fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
  pkgCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, position: "relative" },
  pkgImg: { width: "100%", height: 180 },
  discountPill: { position: "absolute", top: 10, left: 10, backgroundColor: "#E45F44", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  pkgBody: { padding: 12 },
  pkgChip: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: theme.colors.muted, borderRadius: 6 },
  pkgChipText: { fontSize: 10, fontWeight: "700", color: theme.colors.primary, letterSpacing: 0.5 },
  pkgTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 4 },
  pkgDest: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  pkgDur: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 4, fontWeight: "600" },
  pkgPrice: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  pkgOrig: { fontSize: 12, color: theme.colors.textTertiary, textDecorationLine: "line-through" },
  empty: { paddingHorizontal: 16, paddingVertical: 40, textAlign: "center", color: theme.colors.textSecondary, fontSize: 13 },
});
