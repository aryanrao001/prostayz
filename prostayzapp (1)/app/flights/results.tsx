import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Flight = {
  id: string;
  flight_number: string;
  airline: string;
  airline_code: string;
  airline_logo: string;
  from_code: string;
  from_city: string;
  to_code: string;
  to_city: string;
  depart_date: string;
  depart_time: string;
  arrive_time: string;
  next_day_arrival: boolean;
  duration_minutes: number;
  duration_label: string;
  stops: number;
  stop_label: string;
  price: number;
  currency: string;
  class: string;
  baggage: string;
  cabin_baggage: string;
  refundable: boolean;
};

type Results = {
  trip_type: "oneway" | "round";
  outbound: Flight[];
  inbound: Flight[];
  data_source: string;
};

const SORT_OPTIONS = [
  { key: "cheapest", label: "Cheapest", icon: "cash-outline" as const },
  { key: "fastest", label: "Fastest", icon: "flash-outline" as const },
  { key: "earliest", label: "Earliest", icon: "sunny-outline" as const },
];

export default function FlightResults() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    from: string; to: string; from_city: string; to_city: string;
    depart: string; return_date: string; trip_type: string;
    passengers: string; travel_class: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Results | null>(null);
  const [sort, setSort] = useState("cheapest");
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedInbound, setSelectedInbound] = useState<Flight | null>(null);
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<Results>("/flights/search", {
          method: "POST",
          body: {
            from_code: params.from,
            to_code: params.to,
            depart_date: params.depart,
            return_date: params.return_date || null,
            passengers: parseInt(params.passengers) || 1,
            travel_class: params.travel_class || "economy",
            trip_type: params.trip_type || "oneway",
          },
        });
        setData(res);
      } catch (e: any) {
        console.log("Search err", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.from, params.to, params.depart]);

  const sortFlights = (flights: Flight[]) => {
    const arr = [...flights];
    if (sort === "cheapest") arr.sort((a, b) => a.price - b.price);
    else if (sort === "fastest") arr.sort((a, b) => a.duration_minutes - b.duration_minutes);
    else if (sort === "earliest") arr.sort((a, b) => a.depart_time.localeCompare(b.depart_time));
    return arr;
  };

  const onSelectOutbound = (f: Flight) => {
    setSelectedOutbound(f);
    if (params.trip_type === "round") {
      setShowReturn(true);
    } else {
      proceedToBooking(f, null);
    }
  };

  const onSelectInbound = (f: Flight) => {
    setSelectedInbound(f);
    proceedToBooking(selectedOutbound!, f);
  };

  const proceedToBooking = (outbound: Flight, inbound: Flight | null) => {
    router.push({
      pathname: "/flights/booking",
      params: {
        outbound: JSON.stringify(outbound),
        inbound: inbound ? JSON.stringify(inbound) : "",
        passengers: params.passengers,
        travel_class: params.travel_class,
      },
    });
  };

  const renderFlight = (item: Flight, isReturn = false) => (
    <TouchableOpacity
      key={item.id}
      style={styles.flightCard}
      onPress={() => (isReturn ? onSelectInbound(item) : onSelectOutbound(item))}
      activeOpacity={0.85}
      testID={`flight-${item.id}`}
    >
      <View style={styles.flightTopRow}>
        <View style={styles.airlineBlock}>
          <View style={styles.airlineLogoFallback}>
            <Text style={styles.airlineLogoText}>{item.airline_code}</Text>
          </View>
          <View>
            <Text style={styles.airlineName}>{item.airline}</Text>
            <Text style={styles.flightNum}>{item.flight_number}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.priceText}>₹{item.price.toLocaleString()}</Text>
          <Text style={styles.priceSub}>per adult</Text>
        </View>
      </View>

      <View style={styles.flightTimeRow}>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.timeText}>{item.depart_time}</Text>
          <Text style={styles.codeText}>{item.from_code}</Text>
        </View>
        <View style={styles.flightLineWrap}>
          <Text style={styles.durationText}>{item.duration_label}</Text>
          <View style={styles.flightLine}>
            <View style={styles.flightDot} />
            <View style={styles.flightDash} />
            <Ionicons name="airplane" size={14} color={theme.colors.primary} />
            <View style={styles.flightDash} />
            <View style={styles.flightDot} />
          </View>
          <Text style={[styles.stopText, item.stops === 0 && { color: theme.colors.success }]}>{item.stop_label}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.timeText}>
            {item.arrive_time}
            {item.next_day_arrival && <Text style={styles.nextDay}> +1</Text>}
          </Text>
          <Text style={styles.codeText}>{item.to_code}</Text>
        </View>
      </View>

      <View style={styles.flightFooter}>
        <View style={styles.amenity}><Ionicons name="bag-handle-outline" size={11} color={theme.colors.textSecondary} /><Text style={styles.amenityText}>{item.cabin_baggage}</Text></View>
        <View style={styles.amenity}><Ionicons name="briefcase-outline" size={11} color={theme.colors.textSecondary} /><Text style={styles.amenityText}>{item.baggage}</Text></View>
        {item.refundable && <View style={styles.amenity}><Ionicons name="shield-checkmark-outline" size={11} color={theme.colors.success} /><Text style={[styles.amenityText, { color: theme.colors.success }]}>Refundable</Text></View>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
          Searching best flights for you...
        </Text>
      </View>
    );
  }

  const list = showReturn ? data?.inbound || [] : data?.outbound || [];
  const sorted = sortFlights(list);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => showReturn ? setShowReturn(false) : router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.routeTitle}>
            {params.from_city} <Ionicons name={params.trip_type === "round" ? "swap-horizontal" : "arrow-forward"} size={14} /> {params.to_city}
          </Text>
          <Text style={styles.routeSub}>
            {showReturn ? "Return" : "Outbound"} · {params.depart} · {params.passengers} · {params.travel_class}
          </Text>
        </View>
        <View style={styles.dataBadge}>
          <Text style={styles.dataBadgeText}>{data?.data_source?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Step indicator */}
      {params.trip_type === "round" && (
        <View style={styles.stepBar}>
          <View style={[styles.stepDot, { backgroundColor: theme.colors.primary }]}><Text style={styles.stepDotText}>1</Text></View>
          <Text style={[styles.stepLabel, !showReturn && { fontWeight: "800", color: theme.colors.textPrimary }]}>Choose departure</Text>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, showReturn ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.borderMedium }]}><Text style={styles.stepDotText}>2</Text></View>
          <Text style={[styles.stepLabel, showReturn && { fontWeight: "800", color: theme.colors.textPrimary }]}>Choose return</Text>
        </View>
      )}

      {/* Sort tabs */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            onPress={() => setSort(s.key)}
          >
            <Ionicons name={s.icon} size={12} color={sort === s.key ? "#fff" : theme.colors.textPrimary} />
            <Text style={[styles.sortText, sort === s.key && { color: "#fff" }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Flight list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{sorted.length} flights found</Text>
        {sorted.map((f) => renderFlight(f, showReturn))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  routeTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary },
  routeSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  dataBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.muted, borderRadius: 6 },
  dataBadgeText: { fontSize: 9, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.8 },
  stepBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepDotText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepLabel: { fontSize: 11, color: theme.colors.textSecondary },
  stepLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  sortRow: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sortChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.muted },
  sortChipActive: { backgroundColor: theme.colors.primary },
  sortText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  resultCount: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 12, fontWeight: "600" },
  flightCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  flightTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  airlineBlock: { flexDirection: "row", gap: 10, alignItems: "center" },
  airlineLogoFallback: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  airlineLogoText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.5 },
  airlineName: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  flightNum: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 1 },
  priceText: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  priceSub: { fontSize: 10, color: theme.colors.textTertiary, marginTop: 1 },
  flightTimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  timeText: { fontSize: 20, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 },
  nextDay: { fontSize: 10, color: theme.colors.primary, fontWeight: "700" },
  codeText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: "600" },
  flightLineWrap: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  durationText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "700", marginBottom: 4 },
  flightLine: { flexDirection: "row", alignItems: "center", gap: 2, width: "100%" },
  flightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.borderMedium },
  flightDash: { flex: 1, height: 1, backgroundColor: theme.colors.borderMedium },
  stopText: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4, fontWeight: "600" },
  flightFooter: { flexDirection: "row", gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  amenity: { flexDirection: "row", alignItems: "center", gap: 4 },
  amenityText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600" },
});
