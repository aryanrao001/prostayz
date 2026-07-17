// import React, { useCallback, useState } from "react";
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useFocusEffect, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { theme } from "../../src/theme";
// import { api } from "../../src/api";
// import { useAuth } from "../../src/AuthContext";

// type Booking = {
//   id: string; item_type: string; item_id: string; item_title: string; item_image: string;
//   item_location: string; check_in?: string; check_out?: string; guests: number;
//   total_price: number; status: string; created_at: string;
// };

// export default function Trips() {
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const { user } = useAuth();
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);

//   const load = useCallback(async () => {
//     if (!user) { setBookings([]); return; }
//     try {
//       const res = await api<Booking[]>("/bookings", { auth: true });
//       setBookings(res);
//     } catch (e) { console.warn(e); }
//   }, [user]);

//   useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

//   if (!user) {
//     return (
//       <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
//         <Text style={styles.h1}>Your trips</Text>
//         <View style={styles.emptyBox}>
//           <Ionicons name="airplane-outline" size={48} color={theme.colors.primary} />
//           <Text style={styles.emptyTitle}>Log in to see your trips</Text>
//           <Text style={styles.emptySub}>Your past, upcoming and saved journeys all in one place.</Text>
//           <TouchableOpacity testID="trips-login-btn" onPress={() => router.push("/auth/login")} style={styles.primaryBtn}>
//             <Text style={styles.primaryBtnText}>Log in</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
//       <Text style={styles.h1}>Your trips</Text>
//       {loading ? (
//         <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
//       ) : bookings.length === 0 ? (
//         <View style={styles.emptyBox}>
//           <Ionicons name="map-outline" size={48} color={theme.colors.primary} />
//           <Text style={styles.emptyTitle}>No trips yet</Text>
//           <Text style={styles.emptySub}>Your reservations and booked journeys will appear here.</Text>
//           <TouchableOpacity testID="explore-trips-btn" onPress={() => router.push("/(tabs)")} style={styles.primaryBtn}>
//             <Text style={styles.primaryBtnText}>Start exploring</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
//           {bookings.map((b) => (
//             <TouchableOpacity
//               key={b.id}
//               testID={`booking-${b.id}`}
//               style={styles.card}
//               onPress={() => router.push(b.item_type === "stay" ? `/stay/${b.item_id}` : `/package/${b.item_id}`)}
//             >
//               <Image source={{ uri: b.item_image }} style={styles.img} />
//               <View style={styles.body}>
//                 <View style={styles.typePill}>
//                   <Ionicons name={b.item_type === "stay" ? "bed-outline" : "airplane-outline"} size={12} color={theme.colors.primary} />
//                   <Text style={styles.typeText}>{b.item_type === "stay" ? "Stay" : "Holiday Package"}</Text>
//                 </View>
//                 <Text style={styles.title} numberOfLines={1}>{b.item_title}</Text>
//                 <Text style={styles.loc} numberOfLines={1}>{b.item_location}</Text>
//                 {b.check_in && (
//                   <Text style={styles.dates}>{b.check_in} → {b.check_out}</Text>
//                 )}
//                 <View style={styles.bottomRow}>
//                   <Text style={styles.price}>₹{b.total_price.toLocaleString()}</Text>
//                   <View style={styles.statusPill}>
//                     <View style={styles.statusDot} />
//                     <Text style={styles.statusText}>{b.status}</Text>
//                   </View>
//                 </View>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 20 },
//   h1: { fontSize: 28, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 18, letterSpacing: -0.3 },
//   card: {
//     backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl,
//     overflow: "hidden", marginBottom: 16,
//     borderWidth: 1, borderColor: theme.colors.border,
//   },
//   img: { width: "100%", height: 160 },
//   body: { padding: 14 },
//   typePill: {
//     flexDirection: "row", alignItems: "center", gap: 4,
//     alignSelf: "flex-start", backgroundColor: "#FBE9E3",
//     paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.full,
//     marginBottom: 6,
//   },
//   typeText: { fontSize: 10, fontWeight: "700", color: theme.colors.primary, letterSpacing: 0.5 },
//   title: { fontSize: 16, fontWeight: "600", color: theme.colors.textPrimary },
//   loc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
//   dates: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 6 },
//   bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
//   price: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
//   statusPill: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     paddingHorizontal: 10, paddingVertical: 4,
//     borderRadius: theme.radius.full, backgroundColor: "#E8F0E9",
//   },
//   statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
//   statusText: { fontSize: 11, fontWeight: "600", color: theme.colors.success, textTransform: "capitalize" },
//   emptyBox: {
//     marginTop: 60, padding: 28, alignItems: "center",
//     backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl,
//     borderWidth: 1, borderColor: theme.colors.border,
//   },
//   emptyTitle: { fontSize: 17, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 14 },
//   emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
//   primaryBtn: {
//     marginTop: 20, backgroundColor: theme.colors.primary,
//     paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full,
//   },
//   primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
// });


import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api, BASE } from "../../src/api";
import { useAuth } from "../../src/AuthContext";

// ---------------------------------------------------------------------
// Brand palette — same sage green system used across the app, sampled
// from the Prostayz logo (#B5D985). Keep this in sync with the Home
// screen's BRAND constant (or better, move it into src/theme once).
// ---------------------------------------------------------------------
const BRAND = {
  primary: "#637749", // deep sage — buttons, active tabs, icons, links
  primaryLight: "#B5D985", // exact logo green — accents, glows
  primarySoft: "#EEF3E3", // pale tint — pill/chip backgrounds
  primaryDeep: "#3A4A2C", // near-black green — strong fills
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
type PaymentStatus = "pending" | "paid" | "partially_paid" | "refunded" | "failed";
type RoomCategory = "whole_property" | "private" | "dorm";

type ApiBooking = {
  id: number;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  total_amount: string;
  currency: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  property_id: number;
  property_name: string;
  slug: string;
  city: string | null;
  area: string | null;
  cover_image: string | null;
  room_name: string | null;
  room_category: RoomCategory | null;
  bed_label: string | null;
};

type Trip = {
  id: string;
  bookingNumber: string;
  propertyId: string;
  propertyName: string;
  slug: string;
  location: string;
  image: string | null;
  roomName: string | null;
  roomType: RoomCategory;
  bedLabel: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  currency: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
};

// If your images are served from e.g. https://api.yourapp.com/uploads/properties/<file>,
// set this to that base path.
const IMAGE_BASE_URL = `${BASE}/uploads/properties`;

function mapBooking(b: ApiBooking): Trip {
  return {
    id: String(b.id),
    bookingNumber: b.booking_number,
    propertyId: String(b.property_id),
    propertyName: b.property_name,
    slug: b.slug,
    location: [b.area, b.city].filter(Boolean).join(", ") || "Location unavailable",
    image: b.cover_image
      ? `${IMAGE_BASE_URL}/${b.property_id}/${b.cover_image}`
      : null, roomName: b.room_name,
    roomType: b.room_category || "private",
    bedLabel: b.bed_label,
    checkIn: b.check_in_date,
    checkOut: b.check_out_date,
    nights: b.nights,
    guests: b.adults + (b.children || 0),
    amount: Number(b.total_amount),
    currency: b.currency,
    bookingStatus: b.booking_status,
    paymentStatus: b.payment_status,
  };
}

// Status colors stay semantic (amber = pending, red = cancelled/no-show) —
// only the "brand" states (checked_in) use the green accent.
const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#95721E", bg: "#FBF0DA" },
  confirmed: { label: "Confirmed", color: theme.colors.success, bg: "#E8F0E9" },
  checked_in: { label: "Checked in", color: BRAND.primary, bg: BRAND.primarySoft },
  checked_out: { label: "Completed", color: theme.colors.textSecondary, bg: "#EFEFEF" },
  cancelled: { label: "Cancelled", color: "#B3452E", bg: "#F6E4DF" },
  no_show: { label: "No-show", color: "#B3452E", bg: "#F6E4DF" },
};

const TYPE_META: Record<RoomCategory, { label: string; icon: any }> = {
  whole_property: { label: "Whole property", icon: "home-outline" },
  private: { label: "Private room", icon: "bed-outline" },
  dorm: { label: "Dorm bed", icon: "people-outline" },
};

const TABS: { key: string; label: string; match: (s: BookingStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "upcoming", label: "Upcoming", match: (s) => s === "confirmed" || s === "pending" || s === "checked_in" },
  { key: "completed", label: "Completed", match: (s) => s === "checked_out" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" || s === "no_show" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function currencySymbol(code: string) {
  return code === "USD" ? "$" : code === "AED" ? "AED " : "₹";
}

/* ------------------------------------------------------------------ */
/* Screen                                                               */
/* ------------------------------------------------------------------ */

export default function Trips() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    if (!user) { setTrips([]); return; }
    try {
      const res = await api<{ success: boolean; data: ApiBooking[] }>("/bookings/me", { auth: true });
      setTrips((res.data || []).map(mapBooking));
    } catch (e) {
      console.warn(e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const tabFilter = TABS.find((t) => t.key === tab) ?? TABS[0];
    return trips.filter((t) => tabFilter.match(t.bookingStatus));
  }, [tab, trips]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.h1}>Your trips</Text>
        <View style={styles.emptyBox}>
          <Ionicons name="airplane-outline" size={48} color={BRAND.primary} />
          <Text style={styles.emptyTitle}>Log in to see your trips</Text>
          <Text style={styles.emptySub}>Your past, upcoming and saved journeys all in one place.</Text>
          <TouchableOpacity testID="trips-login-btn" onPress={() => router.push("/auth/login")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.h1}>Your trips</Text>

      {!loading && trips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={{ flexGrow: 0, marginBottom: 16 }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator color={BRAND.primary} style={{ marginTop: 40 }} />
      ) : trips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="map-outline" size={48} color={BRAND.primary} />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Your reservations and booked journeys will appear here.</Text>
          <TouchableOpacity testID="explore-trips-btn" onPress={() => router.push("/(tabs)")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start exploring</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="filter-outline" size={40} color={BRAND.primary} />
          <Text style={styles.emptyTitle}>Nothing in this view</Text>
          <Text style={styles.emptySub}>Try a different tab above.</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        >
          {filtered.map((t) => (
            <TripCard key={t.id} trip={t} router={router} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                 */
/* ------------------------------------------------------------------ */

function TripCard({ trip: t, router }: { trip: Trip; router: ReturnType<typeof useRouter> }) {
  const statusMeta = STATUS_META[t.bookingStatus];
  const typeMeta = TYPE_META[t.roomType];
  const symbol = currencySymbol(t.currency);

  const paymentDue = t.paymentStatus !== "paid" && t.paymentStatus !== "refunded"
    && !["cancelled", "no_show", "checked_out"].includes(t.bookingStatus);
  const isPartial = t.paymentStatus === "partially_paid";

  return (
    <TouchableOpacity
      testID={`booking-${t.id}`}
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => router.push(`/stay/${t.propertyId}`)}
    >
      <View style={styles.imgWrap}>
        {t.image ? (
          <>
            <Image source={{ uri: t.image }} style={styles.img} />
          </>
        ) : (

          <View style={[styles.img, styles.imgFallback]}>

            <Ionicons name="image-outline" size={28} color={theme.colors.border} />
          </View>
        )}
        <View style={styles.imgOverlay} />
        <View style={styles.statusPillFloating}>
          <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
          <Text style={[styles.statusTextFloating, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
        <Text style={styles.refFloating}>{t.bookingNumber}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.typePill}>
          <Ionicons name={typeMeta.icon} size={12} color={BRAND.primary} />
          <Text style={styles.typeText}>{typeMeta.label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>{t.propertyName}</Text>
        <Text style={styles.loc} numberOfLines={1}>
          {[t.roomName, t.bedLabel].filter(Boolean).join(" · ")}
          {t.roomName || t.bedLabel ? "  ·  " : ""}
          {t.location}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{fmtDate(t.checkIn)} → {fmtDate(t.checkOut)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="moon-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{t.nights}n</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{t.guests}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceLabel}>{isPartial ? "Balance may apply" : "Total"}</Text>
            <Text style={styles.price}>{symbol}{t.amount.toLocaleString("en-IN")}</Text>
          </View>

          {paymentDue ? (
            <TouchableOpacity
              testID={`pay-btn-${t.id}`}
              style={styles.payBtn}
            // onPress={() => router.push(`/booking/${t.id}/pay`)}
            >
              <Ionicons name="card-outline" size={14} color={theme.colors.textInverse} />
              <Text style={styles.payBtnText}>{isPartial ? "Complete payment" : "Pay now"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidPill}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              <Text style={styles.paidPillText}>Paid</Text>
            </View>
          )}
        </View>

        {paymentDue && (
          <View style={styles.dueRibbon}>
            <Ionicons name="alert-circle-outline" size={13} color="#B3452E" />
            <Text style={styles.dueRibbonText}>
              {isPartial ? "Partial payment received — balance due" : "Payment pending to confirm this booking"}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 20 },
  h1: { fontSize: 28, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 14, letterSpacing: -0.3 },

  tabRow: { gap: 8, paddingRight: 20 },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  tabChipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  tabChipText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textSecondary },
  tabChipTextActive: { color: theme.colors.textInverse },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl,
    overflow: "hidden", marginBottom: 18, marginTop: 18,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imgWrap: { position: "relative" },
  img: { width: "100%", height: 170 },
  imgFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#F3F1EC" },
  imgOverlay: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 60,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  statusPillFloating: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTextFloating: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  refFloating: {
    position: "absolute", right: 12, bottom: 10,
    fontSize: 11, fontWeight: "600", color: "#FFFFFF", opacity: 0.9,
    letterSpacing: 0.3,
  },

  body: { padding: 14 },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", backgroundColor: BRAND.primarySoft,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.full,
    marginBottom: 8,
  },
  typeText: { fontSize: 10, fontWeight: "700", color: BRAND.primary, letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: "600", color: theme.colors.textPrimary },
  loc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },

  metaRow: { flexDirection: "row", gap: 14, marginTop: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: theme.colors.textSecondary },

  divider: { height: 1, backgroundColor: theme.colors.border, marginTop: 14, marginBottom: 12 },

  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceLabel: { fontSize: 10.5, color: theme.colors.textSecondary, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  price: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },

  payBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.full,
  },
  payBtnText: { fontSize: 13, fontWeight: "700", color: theme.colors.textInverse },

  paidPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#E8F0E9",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.full,
  },
  paidPillText: { fontSize: 12.5, fontWeight: "700", color: theme.colors.success },

  dueRibbon: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F6E4DF",
    borderRadius: theme.radius.md ?? 10,
    paddingHorizontal: 10, paddingVertical: 8,
    marginTop: 12,
  },
  dueRibbonText: { fontSize: 11.5, color: "#B3452E", fontWeight: "500", flex: 1 },

  emptyBox: {
    marginTop: 60, padding: 28, alignItems: "center",
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: theme.colors.textPrimary, marginTop: 14 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center" },
  primaryBtn: {
    marginTop: 20, backgroundColor: BRAND.primary,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.radius.full,
  },
  primaryBtnText: { color: theme.colors.textInverse, fontWeight: "700" },
});
