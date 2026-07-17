import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export type StaySearchValues = {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  adults: number;
  children: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSearch: (v: StaySearchValues) => void;
  initial?: Partial<StaySearchValues>;
  accent?: string;
  title?: string;
};

function formatISO(d: Date) {
  return d.toISOString().split("T")[0];
}
function prettyDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function StaySearchSheet({ visible, onClose, onSearch, initial, accent = theme.colors.primary, title = "Search stays" }: Props) {
  const [destination, setDestination] = useState(initial?.destination || "");
  const [checkIn, setCheckIn] = useState<Date>(initial?.checkIn || (() => {
    const d = new Date(); d.setDate(d.getDate() + 2); return d;
  })());
  const [checkOut, setCheckOut] = useState<Date>(initial?.checkOut || (() => {
    const d = new Date(); d.setDate(d.getDate() + 5); return d;
  })());
  const [rooms, setRooms] = useState(initial?.rooms || 1);
  const [adults, setAdults] = useState(initial?.adults || 2);
  const [children, setChildren] = useState(initial?.children || 0);
  const [step, setStep] = useState<"main" | "travellers" | "dates">("main");

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSearch = () => {
    onSearch({ destination: destination.trim(), checkIn, checkOut, rooms, adults, children });
    onClose();
  };

  const Counter = ({ label, sub, value, onMinus, onPlus, minVal = 0 }: any) => (
    <View style={styles.counterRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.counterLabel}>{label}</Text>
        <Text style={styles.counterSub}>{sub}</Text>
      </View>
      <View style={styles.counterControl}>
        <TouchableOpacity onPress={onMinus} disabled={value <= minVal} style={[styles.counterBtn, value <= minVal && { opacity: 0.4 }]}>
          <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity onPress={onPlus} style={styles.counterBtn}>
          <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {step === "main" && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Destination */}
              <View style={[styles.field, { borderColor: destination ? accent : theme.colors.border }]}>
                <Ionicons name="location" size={18} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Where to?</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="City, location or property"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={destination}
                    onChangeText={setDestination}
                    autoFocus
                    testID="sheet-destination"
                  />
                </View>
              </View>

              {/* Dates */}
              <TouchableOpacity style={styles.field} onPress={() => setStep("dates")} testID="sheet-dates">
                <Ionicons name="calendar-outline" size={18} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Dates</Text>
                  <Text style={styles.fieldValue}>{prettyDate(checkIn)} – {prettyDate(checkOut)} · {nights}N</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              {/* Travellers */}
              <TouchableOpacity style={styles.field} onPress={() => setStep("travellers")} testID="sheet-travellers">
                <Ionicons name="people-outline" size={18} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Travellers</Text>
                  <Text style={styles.fieldValue}>
                    {adults + children} traveller{adults + children > 1 ? "s" : ""}, {rooms} room{rooms > 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              {/* Popular cities chips */}
              <Text style={styles.popLabel}>Popular cities</Text>
              <View style={styles.chipsRow}>
                {["Goa", "Jaipur", "Manali", "Udaipur", "Kerala", "Mumbai"].map((c) => (
                  <TouchableOpacity key={c} style={styles.chip} onPress={() => setDestination(c)}>
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: accent }]} onPress={handleSearch} testID="sheet-search-btn">
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "travellers" && (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep("main")}>
                  <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { flex: 1, textAlign: "center" }]}>Travellers & Rooms</Text>
                <View style={{ width: 22 }} />
              </View>

              <Counter
                label="Adults"
                sub="Above 12 years"
                value={adults}
                minVal={1}
                onMinus={() => setAdults(Math.max(1, adults - 1))}
                onPlus={() => setAdults(Math.min(20, adults + 1))}
              />
              <Counter
                label="Children"
                sub="Below 12 years"
                value={children}
                onMinus={() => setChildren(Math.max(0, children - 1))}
                onPlus={() => setChildren(Math.min(10, children + 1))}
              />
              <Counter
                label="Rooms"
                sub="Number of rooms needed"
                value={rooms}
                minVal={1}
                onMinus={() => setRooms(Math.max(1, rooms - 1))}
                onPlus={() => setRooms(Math.min(8, rooms + 1))}
              />

              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: accent }]} onPress={() => setStep("main")}>
                <Text style={styles.searchBtnText}>Apply</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "dates" && (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep("main")}>
                  <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { flex: 1, textAlign: "center" }]}>Select dates</Text>
                <View style={{ width: 22 }} />
              </View>

              {Platform.OS === "web" ? (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={styles.fieldLabel}>Check-in</Text>
                    {/* @ts-ignore */}
                    <input
                      type="date"
                      value={formatISO(checkIn)}
                      min={formatISO(new Date())}
                      onChange={(e: any) => {
                        const d = new Date(e.target.value);
                        setCheckIn(d);
                        if (d >= checkOut) {
                          const newOut = new Date(d); newOut.setDate(d.getDate() + 1); setCheckOut(newOut);
                        }
                      }}
                      style={{ fontSize: 16, padding: 12, border: `1px solid ${theme.colors.border}`, borderRadius: 12, marginTop: 6 } as any}
                    />
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Check-out</Text>
                    {/* @ts-ignore */}
                    <input
                      type="date"
                      value={formatISO(checkOut)}
                      min={formatISO(checkIn)}
                      onChange={(e: any) => setCheckOut(new Date(e.target.value))}
                      style={{ fontSize: 16, padding: 12, border: `1px solid ${theme.colors.border}`, borderRadius: 12, marginTop: 6 } as any}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <Text style={styles.dateBig}>Check-in: {prettyDate(checkIn)}</Text>
                  <Text style={styles.dateBig}>Check-out: {prettyDate(checkOut)}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    {[3, 5, 7, 10, 14].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={styles.chip}
                        onPress={() => {
                          const today = new Date();
                          today.setDate(today.getDate() + 2);
                          const out = new Date(today);
                          out.setDate(today.getDate() + d);
                          setCheckIn(today);
                          setCheckOut(out);
                        }}
                      >
                        <Text style={styles.chipText}>{d} nights</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: accent }]} onPress={() => setStep("main")}>
                <Text style={styles.searchBtnText}>Apply</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: theme.colors.bg, padding: 20, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderMedium, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3 },
  field: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  fieldLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 2 },
  fieldInput: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 2, padding: 0, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  popLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 0.5, marginTop: 6, marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.colors.surface, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border },
  chipText: { fontSize: 12, fontWeight: "600", color: theme.colors.textPrimary },
  searchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: theme.radius.md, marginTop: 10 },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  counterRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  counterLabel: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  counterSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  counterControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  counterValue: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary, minWidth: 24, textAlign: "center" },
  dateBig: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary, padding: 14, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
});
