import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";

type Day = { day: number; title: string; description: string };
type Pkg = {
  id: string;
  title: string;
  destination: string;
  duration_nights: number;
  duration_days: number;
  price: number;
  original_price?: number;
  rating: number;
  reviews_count: number;
  category: string;
  cover_image: string;
  gallery: string[];
  short_description: string;
  highlights: string[];
  itinerary: Day[];
  inclusions: string[];
  exclusions: string[];
};

export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [saved, setSaved] = useState(false);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<Pkg>(`/packages/${id}`);
      setPkg(res);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not load package");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleBook = async () => {
    if (!user) {
      Alert.alert("Log in required", "Please log in to book this trip.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    if (!pkg) return;
    try {
      setBooking(true);
      const today = new Date();
      const checkIn = new Date(today.getTime() + 14 * 864e5).toISOString().slice(0, 10);
      const checkOut = new Date(today.getTime() + (14 + pkg.duration_days) * 864e5).toISOString().slice(0, 10);
      await api("/bookings", {
        method: "POST",
        auth: true,
        body: {
          item_type: "package",
          item_id: pkg.id,
          check_in: checkIn,
          check_out: checkOut,
          guests: 2,
          total_price: pkg.price * 2,
        },
      });
      Alert.alert("Trip booked!", `Your ${pkg.duration_nights}N/${pkg.duration_days}D ${pkg.title} is confirmed.`, [
        { text: "View trips", onPress: () => router.replace("/(tabs)/trips") },
      ]);
    } catch (e: any) {
      Alert.alert("Booking failed", e.message || "Try again.");
    } finally {
      setBooking(false);
    }
  };

  const handleSave = async () => {
    if (!user) { router.push("/auth/login"); return; }
    try {
      const res = await api<{ saved: boolean }>("/wishlist/toggle", {
        method: "POST",
        auth: true,
        body: { item_type: "package", item_id: id },
      });
      setSaved(res.saved);
    } catch (e) { console.warn(e); }
  };

  if (loading || !pkg) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.floatBar, { top: insets.top + 10 }]}>
        <TouchableOpacity testID="pkg-back-btn" style={styles.circleBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity testID="pkg-save-btn" style={styles.circleBtn} onPress={handleSave}>
          <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? theme.colors.primary : theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: pkg.cover_image }} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.durationBadge}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.textPrimary} />
              <Text style={styles.durationText}>{pkg.duration_nights}N / {pkg.duration_days}D</Text>
            </View>
            <Text style={styles.heroTitle}>{pkg.title}</Text>
            <Text style={styles.heroDest}>{pkg.destination}</Text>
            <View style={styles.heroStats}>
              <Ionicons name="star" size={12} color={theme.colors.accent} />
              <Text style={styles.heroStat}>{pkg.rating.toFixed(1)} ({pkg.reviews_count} reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.desc}>{pkg.short_description}</Text>

          <Text style={styles.sectionTitle}>Trip highlights</Text>
          <View style={styles.highlightWrap}>
            {pkg.highlights.map((h, i) => (
              <View key={i} style={styles.highlightPill}>
                <Ionicons name="sparkles-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Day-by-day itinerary</Text>
          {pkg.itinerary.map((d) => {
            const expanded = expandedDay === d.day;
            return (
              <TouchableOpacity
                key={d.day}
                testID={`day-${d.day}`}
                activeOpacity={0.85}
                onPress={() => setExpandedDay(expanded ? null : d.day)}
                style={styles.dayCard}
              >
                <View style={styles.dayHead}>
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>D{d.day}</Text>
                  </View>
                  <Text style={styles.dayTitle}>{d.title}</Text>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textSecondary} />
                </View>
                {expanded && <Text style={styles.dayDesc}>{d.description}</Text>}
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Inclusions</Text>
          {pkg.inclusions.map((x, i) => (
            <View key={i} style={styles.listLine}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.listText}>{x}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Exclusions</Text>
          {pkg.exclusions.map((x, i) => (
            <View key={i} style={styles.listLine}>
              <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.listText}>{x}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bookBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          {pkg.original_price && (
            <Text style={styles.strike}>₹{pkg.original_price.toLocaleString()}</Text>
          )}
          <Text style={styles.price}>₹{pkg.price.toLocaleString()}</Text>
          <Text style={styles.perPerson}>per person · all-inclusive</Text>
        </View>
        <TouchableOpacity testID="book-trip-btn" style={styles.bookBtn} onPress={handleBook} disabled={booking}>
          {booking ? <ActivityIndicator color={theme.colors.textInverse} /> : <Text style={styles.bookText}>Book trip</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  floatBar: {
    position: "absolute", left: 16, right: 16, zIndex: 10,
    flexDirection: "row", justifyContent: "space-between",
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
    ...theme.shadow.subtle,
  },
  heroWrap: { height: 460, position: "relative" },
  heroImg: { position: "absolute", width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(28,25,23,0.35)" },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 24, paddingBottom: 36 },
  durationBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radius.sm, marginBottom: 10,
  },
  durationText: { fontSize: 11, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: "600", color: "#FFF", letterSpacing: -0.5, lineHeight: 36 },
  heroDest: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 6 },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  heroStat: { fontSize: 12, color: "#FFF", fontWeight: "500" },
  body: { padding: 20 },
  desc: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 28, marginBottom: 14 },
  highlightWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  highlightPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FBE9E3",
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: theme.radius.full,
  },
  highlightText: { fontSize: 12, fontWeight: "500", color: theme.colors.textPrimary },
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  dayNumber: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    alignItems: "center", justifyContent: "center",
  },
  dayNumberText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 13 },
  dayTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  dayDesc: { marginTop: 10, paddingLeft: 52, fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary },
  listLine: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  listText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  bookBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 20, paddingTop: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  strike: { fontSize: 12, color: theme.colors.textTertiary, textDecorationLine: "line-through" },
  price: { fontSize: 20, fontWeight: "700", color: theme.colors.textPrimary },
  perPerson: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  bookBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: theme.radius.full,
  },
  bookText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 14 },
});
