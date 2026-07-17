import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/AuthContext";
import { useIsDesktop } from "../../src/components/WebDashboardShell";

type Flight = {
  id: string; flight_number: string; airline: string; airline_code: string;
  from_code: string; from_city: string; to_code: string; to_city: string;
  depart_time: string; arrive_time: string; duration_minutes: number;
  duration_label: string; stops: number; price: number; class: string;
  seats_available: number; active: boolean;
};

const AIRPORTS = ["DEL","BOM","BLR","MAA","HYD","CCU","GOI","COK","PNQ","AMD","JAI","LKO","IXC","SXR","GAU","ATQ","VNS","PAT","IXR","DED"];

export default function FlightsAdmin({ scope = "admin" as "admin" | "vendor" }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    flight_number: "", airline: "", airline_code: "",
    from_code: "DEL", to_code: "BOM",
    depart_time: "10:00", arrive_time: "12:00",
    duration_minutes: 120, stops: 0, price: 5000,
    travel_class: "economy", seats_available: 100,
    baggage: "15 kg", cabin_baggage: "7 kg", refundable: false, active: true,
  });
  const [busy, setBusy] = useState(false);
  const apiPath = scope === "admin" ? "/admin/flights" : "/vendor/flights";

  const load = useCallback(async () => {
    try { setFlights(await api<Flight[]>(apiPath, { auth: true })); } catch (e: any) { console.warn(e); }
    finally { setLoading(false); }
  }, [apiPath]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const save = async () => {
    if (!form.flight_number || !form.airline || !form.airline_code) {
      Alert.alert("Missing fields", "Flight number, airline name & code required"); return;
    }
    try {
      setBusy(true);
      await api(apiPath, { method: "POST", auth: true, body: form });
      Alert.alert("Saved", "Flight created successfully");
      setOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this flight?")) return;
    try { await api(`${apiPath}/${id}`, { method: "DELETE", auth: true }); await load(); }
    catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;

  const Content = (
    <View>
      <View style={styles.actionsBar}>
        <Text style={styles.subtle}>{flights.length} flight{flights.length !== 1 ? "s" : ""} listed</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setOpen(true)} testID="add-flight">
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Flight</Text>
        </TouchableOpacity>
      </View>

      {flights.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="airplane-outline" size={40} color={theme.colors.borderMedium} />
          <Text style={styles.emptyTitle}>No flights yet</Text>
          <Text style={styles.emptySub}>Add your first flight to start managing inventory.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {flights.map((f) => (
            <View key={f.id} style={styles.row}>
              <View style={styles.rowIcon}><Text style={styles.rowIconText}>{f.airline_code}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{f.airline} · {f.flight_number}</Text>
                <Text style={styles.rowSub}>{f.from_city} ({f.from_code}) → {f.to_city} ({f.to_code}) · {f.depart_time}–{f.arrive_time} · {f.duration_label}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={styles.tag}><Text style={styles.tagText}>₹{f.price}</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>{f.seats_available} seats</Text></View>
                  <View style={[styles.tag, f.active ? { backgroundColor: "rgba(107,142,90,0.15)" } : { backgroundColor: "rgba(228,95,68,0.15)" }]}>
                    <Text style={[styles.tagText, { color: f.active ? theme.colors.success : "#E45F44" }]}>{f.active ? "ACTIVE" : "INACTIVE"}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => remove(f.id)} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={16} color="#E45F44" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ padding: 20 }}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Flight</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Field label="Airline" value={form.airline} onChangeText={(v: string) => setForm({...form, airline: v})} placeholder="IndiGo" /></View>
              <View style={{ flex: 1 }}><Field label="Code" value={form.airline_code} onChangeText={(v: string) => setForm({...form, airline_code: v.toUpperCase()})} placeholder="6E" /></View>
            </View>
            <Field label="Flight Number" value={form.flight_number} onChangeText={(v: string) => setForm({...form, flight_number: v})} placeholder="6E-251" />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><FieldChoice label="From" value={form.from_code} options={AIRPORTS} onChange={(v) => setForm({...form, from_code: v})} /></View>
              <View style={{ flex: 1 }}><FieldChoice label="To" value={form.to_code} options={AIRPORTS} onChange={(v) => setForm({...form, to_code: v})} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Field label="Depart Time" value={form.depart_time} onChangeText={(v: string) => setForm({...form, depart_time: v})} placeholder="10:00" /></View>
              <View style={{ flex: 1 }}><Field label="Arrive Time" value={form.arrive_time} onChangeText={(v: string) => setForm({...form, arrive_time: v})} placeholder="12:30" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Field label="Duration (min)" value={String(form.duration_minutes)} onChangeText={(v: string) => setForm({...form, duration_minutes: parseInt(v) || 0})} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Field label="Stops" value={String(form.stops)} onChangeText={(v: string) => setForm({...form, stops: parseInt(v) || 0})} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Field label="Price (₹)" value={String(form.price)} onChangeText={(v: string) => setForm({...form, price: parseInt(v) || 0})} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Field label="Seats" value={String(form.seats_available)} onChangeText={(v: string) => setForm({...form, seats_available: parseInt(v) || 0})} keyboardType="numeric" /></View>
            </View>
            <FieldChoice label="Class" value={form.travel_class} options={["economy","premium","business","first"]} onChange={(v) => setForm({...form, travel_class: v})} />

            <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.7 }]} onPress={save} disabled={busy} testID="save-flight">
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Flight</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  if (isDesktop) return <View>{Content}</View>;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Flights</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>{Content}</ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.fieldInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textTertiary} keyboardType={keyboardType} />
    </View>
  );
}

function FieldChoice({ label, value, options, onChange }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {options.map((o: string) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[styles.chip, value === o && styles.chipActive]}>
            <Text style={[styles.chipText, value === o && { color: "#fff" }]}>{o.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  actionsBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  subtle: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  emptyCard: { padding: 40, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary },
  emptySub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  rowIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  rowIconText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.5 },
  rowTitle: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary },
  rowSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.muted, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: 0.4 },
  delBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(228,95,68,0.1)", alignItems: "center", justifyContent: "center" },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { maxHeight: "90%", backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderMedium, alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, fontSize: 13, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  chip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.colors.surface, borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary, letterSpacing: 0.3 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md, marginTop: 16, marginBottom: 30 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
