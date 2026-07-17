import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Modal, FlatList, Platform, KeyboardAvoidingView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";

type Airport = { code: string; city: string; name: string };
type TripType = "oneway" | "round";
type TravelClass = "economy" | "premium" | "business" | "first";

const CLASS_LABELS: Record<TravelClass, string> = {
  economy: "Economy",
  premium: "Premium Economy",
  business: "Business",
  first: "First Class",
};

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}
function prettyDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function FlightSearch() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [airports, setAirports] = useState<Airport[]>([]);
  const [tripType, setTripType] = useState<TripType>("oneway");
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });
  const [returnDate, setReturnDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;
  const [travelClass, setTravelClass] = useState<TravelClass>("economy");
  const [pickerOpen, setPickerOpen] = useState<"from" | "to" | null>(null);
  const [classOpen, setClassOpen] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState<"depart" | "return" | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Airport[]>("/flights/airports").then((a) => {
      setAirports(a);
      // Default DEL → BOM
      setFrom(a.find((x) => x.code === "DEL") || a[0]);
      setTo(a.find((x) => x.code === "BOM") || a[1]);
    });
  }, []);

  const swap = () => {
    if (!from || !to) return;
    setFrom(to);
    setTo(from);
  };

  const doSearch = async () => {
    if (!from || !to) {
      Alert.alert("Select cities", "Please choose origin and destination");
      return;
    }
    if (from.code === to.code) {
      Alert.alert("Same cities", "Origin and destination cannot be the same");
      return;
    }
    setBusy(true);
    try {
      router.push({
        pathname: "/flights/results",
        params: {
          from: from.code,
          to: to.code,
          from_city: from.city,
          to_city: to.city,
          depart: formatDate(departDate),
          return_date: tripType === "round" ? formatDate(returnDate) : "",
          trip_type: tripType,
          passengers: String(totalPassengers),
          adults: String(passengers.adults),
          children: String(passengers.children),
          infants: String(passengers.infants),
          travel_class: travelClass,
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const filteredAirports = airports.filter(
    (a) => !search || a.city.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  );

  const adjustDate = (d: Date, days: number) => {
    const n = new Date(d);
    n.setDate(n.getDate() + days);
    return n;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="back">
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.brand}>Prostayz</Text>
          <Text style={styles.headerTitle}>Search Flights</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Trip type toggle */}
        <View style={styles.tripToggle}>
          <TouchableOpacity
            onPress={() => setTripType("oneway")}
            style={[styles.tripTab, tripType === "oneway" && styles.tripTabActive]}
            testID="trip-oneway"
          >
            <Ionicons name="arrow-forward" size={14} color={tripType === "oneway" ? "#fff" : theme.colors.textPrimary} />
            <Text style={[styles.tripTabText, tripType === "oneway" && { color: "#fff" }]}>One Way</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTripType("round")}
            style={[styles.tripTab, tripType === "round" && styles.tripTabActive]}
            testID="trip-round"
          >
            <Ionicons name="swap-horizontal" size={14} color={tripType === "round" ? "#fff" : theme.colors.textPrimary} />
            <Text style={[styles.tripTabText, tripType === "round" && { color: "#fff" }]}>Round Trip</Text>
          </TouchableOpacity>
        </View>

        {/* Main card */}
        <View style={styles.searchCard}>
          {/* From */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => { setPickerOpen("from"); setSearch(""); }} testID="pick-from">
            <Ionicons name="airplane" size={18} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>FROM</Text>
              <Text style={styles.fieldValue}>{from ? from.city : "Select city"}</Text>
              {from && <Text style={styles.fieldSub}>{from.code} · {from.name}</Text>}
            </View>
          </TouchableOpacity>

          {/* Swap button */}
          <View style={{ alignItems: "center", marginVertical: -8, zIndex: 10 }}>
            <TouchableOpacity onPress={swap} style={styles.swapBtn} testID="swap">
              <Ionicons name="swap-vertical" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* To */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => { setPickerOpen("to"); setSearch(""); }} testID="pick-to">
            <Ionicons name="flag" size={18} color={theme.colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>TO</Text>
              <Text style={styles.fieldValue}>{to ? to.city : "Select city"}</Text>
              {to && <Text style={styles.fieldSub}>{to.code} · {to.name}</Text>}
            </View>
          </TouchableOpacity>

          {/* Dates */}
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={[styles.dateField, { flex: 1 }]} onPress={() => setDateOpen("depart")} testID="date-depart">
              <Ionicons name="calendar" size={16} color={theme.colors.primary} />
              <View>
                <Text style={styles.fieldLabel}>DEPART</Text>
                <Text style={styles.fieldValue}>{prettyDate(departDate)}</Text>
              </View>
            </TouchableOpacity>
            {tripType === "round" && (
              <TouchableOpacity style={[styles.dateField, { flex: 1 }]} onPress={() => setDateOpen("return")} testID="date-return">
                <Ionicons name="calendar-outline" size={16} color={theme.colors.secondary} />
                <View>
                  <Text style={styles.fieldLabel}>RETURN</Text>
                  <Text style={styles.fieldValue}>{prettyDate(returnDate)}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Passengers + Class */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={[styles.smallField, { flex: 1 }]} onPress={() => setPaxOpen(true)} testID="pick-pax">
              <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
              <View>
                <Text style={styles.fieldLabel}>TRAVELLERS</Text>
                <Text style={styles.fieldValue}>{totalPassengers} {totalPassengers === 1 ? "Pax" : "Pax"}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallField, { flex: 1 }]} onPress={() => setClassOpen(true)} testID="pick-class">
              <Ionicons name="briefcase" size={16} color={theme.colors.textSecondary} />
              <View>
                <Text style={styles.fieldLabel}>CLASS</Text>
                <Text style={styles.fieldValue}>{CLASS_LABELS[travelClass]}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search button */}
        <TouchableOpacity style={styles.searchBtn} onPress={doSearch} disabled={busy} testID="search-flights">
          {busy ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}>Search Flights</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Popular routes */}
        <Text style={styles.sectionTitle}>Popular routes</Text>
        <View style={styles.routeChips}>
          {[
            { from: "DEL", to: "BOM", label: "Delhi → Mumbai" },
            { from: "BLR", to: "DEL", label: "Bengaluru → Delhi" },
            { from: "DEL", to: "GOI", label: "Delhi → Goa" },
            { from: "BOM", to: "GOI", label: "Mumbai → Goa" },
          ].map((r) => (
            <TouchableOpacity
              key={r.label}
              style={styles.routeChip}
              onPress={() => {
                const f = airports.find((a) => a.code === r.from);
                const t = airports.find((a) => a.code === r.to);
                if (f && t) { setFrom(f); setTo(t); }
              }}
            >
              <Ionicons name="airplane" size={12} color={theme.colors.primary} />
              <Text style={styles.routeChipText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Airport picker modal */}
      <Modal visible={!!pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(null)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerOpen(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select {pickerOpen === "from" ? "origin" : "destination"}</Text>
            <View style={styles.searchInput}>
              <Ionicons name="search" size={16} color={theme.colors.textTertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search city or code..."
                placeholderTextColor={theme.colors.textTertiary}
                style={styles.searchInputText}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredAirports}
              keyExtractor={(a) => a.code}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.airportRow}
                  onPress={() => {
                    if (pickerOpen === "from") setFrom(item);
                    else setTo(item);
                    setPickerOpen(null);
                  }}
                >
                  <View style={styles.airportCode}><Text style={styles.airportCodeText}>{item.code}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.airportCity}>{item.city}</Text>
                    <Text style={styles.airportName}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date picker modal */}
      <Modal visible={!!dateOpen} animationType="slide" transparent onRequestClose={() => setDateOpen(null)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDateOpen(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{dateOpen === "depart" ? "Depart date" : "Return date"}</Text>
            {Platform.OS === "web" ? (
              // @ts-ignore - native input for web
              <input
                type="date"
                value={formatDate(dateOpen === "depart" ? departDate : returnDate)}
                min={formatDate(new Date())}
                onChange={(e: any) => {
                  const d = new Date(e.target.value);
                  if (dateOpen === "depart") setDepartDate(d);
                  else setReturnDate(d);
                }}
                style={{ fontSize: 16, padding: 12, border: `1px solid ${theme.colors.border}`, borderRadius: 12, marginVertical: 12 } as any}
              />
            ) : (
              <View style={styles.simpleDatePicker}>
                <Text style={styles.simpleDateValue}>
                  {prettyDate(dateOpen === "depart" ? departDate : returnDate)}
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {[1, 3, 7, 14, 30].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={styles.dateChip}
                      onPress={() => {
                        const next = adjustDate(new Date(), days);
                        if (dateOpen === "depart") setDepartDate(next);
                        else setReturnDate(next);
                      }}
                    >
                      <Text style={styles.dateChipText}>+{days}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setDateOpen(null)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Passengers picker */}
      <Modal visible={paxOpen} animationType="slide" transparent onRequestClose={() => setPaxOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPaxOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Travellers</Text>

            <PaxRow
              label="Adults"
              sub="12+ years"
              value={passengers.adults}
              onChange={(v) => setPassengers({ ...passengers, adults: Math.max(1, Math.min(9, v)) })}
              min={1}
            />
            <PaxRow
              label="Children"
              sub="2 – 12 years"
              value={passengers.children}
              onChange={(v) => setPassengers({ ...passengers, children: Math.max(0, Math.min(8, v)) })}
            />
            <PaxRow
              label="Infants"
              sub="Below 2 years"
              value={passengers.infants}
              onChange={(v) => setPassengers({ ...passengers, infants: Math.max(0, Math.min(passengers.adults, v)) })}
            />

            <Text style={styles.paxNote}>Infants must be carried on an adult's lap. One infant per adult.</Text>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setPaxOpen(false)}>
              <Text style={styles.modalDoneText}>Done ({totalPassengers} traveller{totalPassengers > 1 ? "s" : ""})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Class picker */}
      <Modal visible={classOpen} animationType="slide" transparent onRequestClose={() => setClassOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setClassOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Travel class</Text>
            {(Object.keys(CLASS_LABELS) as TravelClass[]).map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.classRow, travelClass === k && styles.classRowActive]}
                onPress={() => { setTravelClass(k); setClassOpen(false); }}
              >
                <Text style={[styles.classLabel, travelClass === k && { color: theme.colors.primary, fontWeight: "700" }]}>{CLASS_LABELS[k]}</Text>
                {travelClass === k && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PaxRow({ label, sub, value, onChange, min = 0 }: { label: string; sub: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <View style={styles.paxRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.paxRowLabel}>{label}</Text>
        <Text style={styles.paxRowSub}>{sub}</Text>
      </View>
      <View style={styles.paxRowControl}>
        <TouchableOpacity onPress={() => onChange(value - 1)} disabled={value <= min} style={[styles.paxBtnSmall, value <= min && { opacity: 0.4 }]}>
          <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.paxRowValue}>{value}</Text>
        <TouchableOpacity onPress={() => onChange(value + 1)} style={styles.paxBtnSmall}>
          <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
  brand: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 2 },
  tripToggle: { flexDirection: "row", backgroundColor: theme.colors.surface, padding: 4, borderRadius: 999, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  tripTab: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 999 },
  tripTabActive: { backgroundColor: theme.colors.primary },
  tripTabText: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  searchCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 6 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  fieldLabel: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: "700", letterSpacing: 0.6 },
  fieldValue: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 2, letterSpacing: -0.3 },
  fieldSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  swapBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  dateField: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: theme.radius.md },
  smallField: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.colors.muted, borderRadius: theme.radius.md },
  searchBtn: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 0.3 },
  routeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  routeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border },
  routeChipText: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: "600" },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: theme.colors.bg, padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderMedium, alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 14 },
  searchInput: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  searchInputText: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  airportRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  airportCode: { width: 48, height: 36, borderRadius: 8, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  airportCodeText: { fontSize: 13, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.5 },
  airportCity: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  airportName: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  paxControl: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30, paddingVertical: 20 },
  paxBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  paxBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  paxRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  paxRowLabel: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  paxRowSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  paxRowControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  paxRowValue: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary, minWidth: 24, textAlign: "center" },
  paxNote: { fontSize: 10, color: theme.colors.textTertiary, fontStyle: "italic", marginTop: 14, textAlign: "center" },
  paxValue: { fontSize: 28, fontWeight: "800", color: theme.colors.textPrimary, minWidth: 50, textAlign: "center" },
  classRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  classRowActive: {},
  classLabel: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: "600" },
  modalDoneBtn: { marginTop: 14, backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: "center" },
  modalDoneText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  simpleDatePicker: { padding: 16, backgroundColor: theme.colors.muted, borderRadius: theme.radius.md },
  simpleDateValue: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, textAlign: "center" },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 999 },
  dateChipText: { fontSize: 12, fontWeight: "700", color: theme.colors.primary },
});
