import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { api } from "../../src/api";
import { startPayment } from "../../src/payments";
import { useAuth } from "../../src/AuthContext";

type Passenger = { name: string; age: string; gender: "M" | "F" | "O" };

export default function FlightBooking() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ outbound: string; inbound: string; passengers: string; travel_class: string }>();
  const { user } = useAuth();

  const outbound = params.outbound ? JSON.parse(params.outbound) : null;
  const inbound = params.inbound ? JSON.parse(params.inbound) : null;
  const paxCount = parseInt(params.passengers || "1") || 1;

  const [paxList, setPaxList] = useState<Passenger[]>(
    Array.from({ length: paxCount }, () => ({ name: "", age: "", gender: "M" }))
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const total = (outbound?.price || 0) * paxCount + (inbound?.price || 0) * paxCount;
  const taxes = Math.round(total * 0.05);
  const grandTotal = total + taxes;

  const updatePax = (i: number, k: keyof Passenger, v: string) => {
    const next = [...paxList];
    // @ts-ignore
    next[i][k] = v;
    setPaxList(next);
  };

  const doPay = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to book flights", [
        { text: "Cancel" },
        { text: "Log in", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    for (const p of paxList) {
      if (!p.name.trim() || !p.age.trim()) {
        Alert.alert("Missing info", "Please fill all passenger details");
        return;
      }
    }
    if (!email || !phone) {
      Alert.alert("Missing contact", "Please enter email and phone");
      return;
    }
    setBusy(true);
    try {
      // 1) Create flight booking
      const booking = await api<any>("/flights/book", {
        method: "POST",
        auth: true,
        body: {
          outbound,
          inbound,
          passengers: paxList,
          total_price: grandTotal,
          contact: { email, phone },
        },
      });
      // 2) Start payment
      const result = await startPayment({
        amount: grandTotal,
        bookingId: booking.id,
        bookingType: "flight",
        description: `${outbound.from_city} → ${outbound.to_city}`,
        name: paxList[0].name,
        email,
        contact: phone,
      });
      if (result.success) {
        router.replace({
          pathname: "/flights/success",
          params: {
            booking_id: booking.id,
            mock: result.mock ? "1" : "0",
            payment_id: result.payment_id || "",
          },
        });
      } else {
        Alert.alert("Payment cancelled", "Your booking was saved as pending");
      }
    } catch (e: any) {
      Alert.alert("Booking failed", e.message || "Could not complete booking");
    } finally {
      setBusy(false);
    }
  };

  const FlightSummary = ({ flight, label }: { flight: any; label: string }) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHead}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryDate}>{flight.depart_date}</Text>
      </View>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.sumTime}>{flight.depart_time}</Text>
          <Text style={styles.sumCode}>{flight.from_code}</Text>
          <Text style={styles.sumCity}>{flight.from_city}</Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.sumAirline}>{flight.airline} · {flight.flight_number}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginVertical: 4 }}>
            <View style={styles.dot} />
            <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.borderMedium }} />
            <Ionicons name="airplane" size={12} color={theme.colors.primary} />
            <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.borderMedium }} />
            <View style={styles.dot} />
          </View>
          <Text style={styles.sumDuration}>{flight.duration_label} · {flight.stop_label}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.sumTime}>{flight.arrive_time}</Text>
          <Text style={styles.sumCode}>{flight.to_code}</Text>
          <Text style={styles.sumCity}>{flight.to_city}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Review & Pay</Text>
          <Text style={styles.headerSub}>{paxCount} passenger{paxCount > 1 ? "s" : ""} · {params.travel_class}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {outbound && <FlightSummary flight={outbound} label="OUTBOUND" />}
        {inbound && <FlightSummary flight={inbound} label="RETURN" />}

        <Text style={styles.sectionTitle}>Passenger details</Text>
        {paxList.map((p, i) => (
          <View key={i} style={styles.paxCard}>
            <Text style={styles.paxLabel}>PASSENGER {i + 1}</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name (as per ID)"
              placeholderTextColor={theme.colors.textTertiary}
              value={p.name}
              onChangeText={(v) => updatePax(i, "name", v)}
              testID={`pax-name-${i}`}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Age"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={p.age}
                onChangeText={(v) => updatePax(i, "age", v)}
                testID={`pax-age-${i}`}
              />
              <View style={[styles.input, styles.genderWrap]}>
                {["M", "F", "O"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, p.gender === g && styles.genderBtnActive]}
                    onPress={() => updatePax(i, "gender", g)}
                  >
                    <Text style={[styles.genderText, p.gender === g && { color: "#fff" }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Contact info</Text>
        <View style={styles.paxCard}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            testID="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (+91...)"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            testID="phone"
          />
        </View>

        <Text style={styles.sectionTitle}>Fare breakup</Text>
        <View style={styles.fareCard}>
          <Row label={`Base fare (${paxCount} pax)`} value={`₹${total.toLocaleString()}`} />
          <Row label="Taxes & fees" value={`₹${taxes.toLocaleString()}`} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${grandTotal.toLocaleString()}`} bold />
        </View>
      </ScrollView>

      {/* Bottom pay bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomLabel}>TOTAL</Text>
          <Text style={styles.bottomPrice}>₹{grandTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={[styles.payBtn, busy && { opacity: 0.7 }]} disabled={busy} onPress={doPay} testID="pay-btn">
          {busy ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.payBtnText}>Pay with Razorpay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={[styles.fareLabel, bold && { fontWeight: "800", color: theme.colors.textPrimary, fontSize: 14 }]}>{label}</Text>
      <Text style={[styles.fareValue, bold && { fontWeight: "800", fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  headerSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  summaryCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 10, fontWeight: "800", color: theme.colors.primary, letterSpacing: 0.8 },
  summaryDate: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sumTime: { fontSize: 20, fontWeight: "800", color: theme.colors.textPrimary },
  sumCode: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "700", marginTop: 2 },
  sumCity: { fontSize: 10, color: theme.colors.textTertiary, marginTop: 1 },
  sumAirline: { fontSize: 11, color: theme.colors.textPrimary, fontWeight: "700" },
  sumDuration: { fontSize: 10, color: theme.colors.textSecondary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.borderMedium },
  sectionTitle: { marginTop: 22, marginBottom: 10, fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary },
  paxCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, gap: 8 },
  paxLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "700", letterSpacing: 0.8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, fontSize: 14, color: theme.colors.textPrimary, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  genderWrap: { flex: 1, flexDirection: "row", padding: 4, gap: 4 },
  genderBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  genderBtnActive: { backgroundColor: theme.colors.primary },
  genderText: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  fareCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
  fareLabel: { fontSize: 13, color: theme.colors.textSecondary },
  fareValue: { fontSize: 13, color: theme.colors.textPrimary, fontWeight: "600" },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  bottomLabel: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: "700", letterSpacing: 0.5 },
  bottomPrice: { fontSize: 22, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.5 },
  payBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 14, backgroundColor: theme.colors.secondary, borderRadius: theme.radius.md },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
