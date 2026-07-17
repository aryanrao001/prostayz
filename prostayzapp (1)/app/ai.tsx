import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../src/theme";
import { api } from "../src/api";

type Msg = { role: "user" | "ai"; text: string };
type Mode = "plan" | "chat";

const DAY_OPTIONS = [3, 5, 7, 10, 14];
const TRAVELER_OPTIONS = [1, 2, 3, 4, 5];
const BUDGETS = [
  { key: "budget", label: "Under ₹25k", range: "<₹25,000" },
  { key: "mid", label: "₹25-60k", range: "₹25,000-60,000" },
  { key: "premium", label: "₹60k-1.2L", range: "₹60,000-1,20,000" },
  { key: "luxury", label: "Luxury", range: "above ₹1,20,000" },
];
const VIBES = [
  { key: "beach", label: "Beach", icon: "sunny-outline" as const },
  { key: "mountain", label: "Mountain", icon: "triangle-outline" as const },
  { key: "heritage", label: "Heritage", icon: "business-outline" as const },
  { key: "adventure", label: "Adventure", icon: "bicycle-outline" as const },
  { key: "spiritual", label: "Spiritual", icon: "flower-outline" as const },
  { key: "wildlife", label: "Wildlife", icon: "paw-outline" as const },
  { key: "relax", label: "Relaxation", icon: "leaf-outline" as const },
  { key: "food", label: "Food & culture", icon: "restaurant-outline" as const },
];

export default function AiAssistant() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("plan");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  // Form state
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState<number>(5);
  const [travelers, setTravelers] = useState<number>(2);
  const [budget, setBudget] = useState<string>("mid");
  const [vibes, setVibes] = useState<string[]>([]);

  // Chat state
  const [q, setQ] = useState("");

  const toggleVibe = (k: string) =>
    setVibes((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));

  const submit = async (text: string) => {
    if (!text.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      setBusy(true);
      const res = await api<{ response: string }>("/ai/search", { method: "POST", body: { query: text } });
      setMessages((m) => [...m, { role: "ai", text: res.response }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "ai", text: `Sorry, I hit a snag: ${e.message}. Please try again.` }]);
    } finally {
      setBusy(false);
    }
  };

  const craftItinerary = () => {
    if (!destination.trim()) return;
    const b = BUDGETS.find((x) => x.key === budget);
    const vibeLabel = vibes.length
      ? vibes.map((k) => VIBES.find((v) => v.key === k)?.label).filter(Boolean).join(", ")
      : "any vibe";
    const query = `Please plan a ${days}-day trip to ${destination.trim()} for ${travelers} traveler${travelers > 1 ? "s" : ""} with a ${b?.range || "flexible"} total budget. Vibe: ${vibeLabel}. Give me a day-by-day itinerary and 2-3 recommended stays plus the best matching holiday package from your catalog.`;
    submit(query);
  };

  const handleChat = () => {
    const v = q.trim();
    if (!v) return;
    setQ("");
    submit(v);
  };

  const tapLink = (tag: string) => {
    if (tag.startsWith("stay-")) router.replace(`/stay/${tag}`);
    else if (tag.startsWith("pkg-")) router.replace(`/package/${tag}`);
  };

  const formReady = destination.trim().length > 1;
  const showIntro = messages.length === 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoDot}><Ionicons name="sparkles" size={16} color={theme.colors.textInverse} /></View>
            <View>
              <Text style={styles.title}>Roamie</Text>
              <Text style={styles.subtitle}>Your Prostayz travel AI</Text>
            </View>
          </View>
          <TouchableOpacity testID="ai-close" onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Mode switcher */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            testID="mode-plan"
            onPress={() => setMode("plan")}
            style={[styles.modeBtn, mode === "plan" && styles.modeBtnActive]}
          >
            <Ionicons name="map-outline" size={14} color={mode === "plan" ? theme.colors.textInverse : theme.colors.textPrimary} />
            <Text style={[styles.modeTxt, mode === "plan" && styles.modeTxtActive]}>Plan a trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="mode-chat"
            onPress={() => setMode("chat")}
            style={[styles.modeBtn, mode === "chat" && styles.modeBtnActive]}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={mode === "chat" ? theme.colors.textInverse : theme.colors.textPrimary} />
            <Text style={[styles.modeTxt, mode === "chat" && styles.modeTxtActive]}>Quick chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {mode === "plan" && showIntro && (
          <View>
            <View style={styles.introBox}>
              <View style={styles.heroIcon}><Ionicons name="compass" size={26} color={theme.colors.primary} /></View>
              <Text style={styles.introHead}>Craft your itinerary</Text>
              <Text style={styles.introSub}>Tell Roamie where you want to wander, and we'll stitch together a day-by-day plan from our curated catalog.</Text>
            </View>

            <Text style={styles.lbl}>WHERE TO?</Text>
            <View style={styles.inputField}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <TextInput
                testID="form-destination"
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Goa, Kerala, Manali, Ladakh…"
                placeholderTextColor={theme.colors.textTertiary}
                returnKeyType="done"
              />
            </View>
            <View style={styles.destChips}>
              {["Kerala", "Manali", "Goa", "Rajasthan", "Ladakh", "Rishikesh"].map((d) => (
                <TouchableOpacity
                  key={d}
                  testID={`dest-chip-${d}`}
                  onPress={() => setDestination(d)}
                  style={[styles.chipSmall, destination === d && styles.chipSmallActive]}
                >
                  <Text style={[styles.chipSmallText, destination === d && styles.chipSmallTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.lbl}>DURATION</Text>
            <View style={styles.rowChips}>
              {DAY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  testID={`days-${d}`}
                  onPress={() => setDays(d)}
                  style={[styles.numChip, days === d && styles.numChipActive]}
                >
                  <Text style={[styles.numChipText, days === d && styles.numChipTextActive]}>{d}</Text>
                  <Text style={[styles.numChipUnit, days === d && { color: theme.colors.textInverse }]}>days</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.lbl}>TRAVELERS</Text>
            <View style={styles.rowChips}>
              {TRAVELER_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n}
                  testID={`travelers-${n}`}
                  onPress={() => setTravelers(n)}
                  style={[styles.numChip, travelers === n && styles.numChipActive]}
                >
                  <Text style={[styles.numChipText, travelers === n && styles.numChipTextActive]}>{n}{n === 5 ? "+" : ""}</Text>
                  <Ionicons name={n === 1 ? "person-outline" : "people-outline"} size={12} color={travelers === n ? theme.colors.textInverse : theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.lbl}>BUDGET (TOTAL)</Text>
            <View style={styles.budgetGrid}>
              {BUDGETS.map((b) => (
                <TouchableOpacity
                  key={b.key}
                  testID={`budget-${b.key}`}
                  onPress={() => setBudget(b.key)}
                  style={[styles.budgetCard, budget === b.key && styles.budgetCardActive]}
                >
                  <Text style={[styles.budgetLabel, budget === b.key && { color: theme.colors.textInverse }]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.lbl}>YOUR VIBE <Text style={styles.lblThin}>(pick any)</Text></Text>
            <View style={styles.vibeWrap}>
              {VIBES.map((v) => {
                const active = vibes.includes(v.key);
                return (
                  <TouchableOpacity
                    key={v.key}
                    testID={`vibe-${v.key}`}
                    onPress={() => toggleVibe(v.key)}
                    style={[styles.vibePill, active && styles.vibePillActive]}
                  >
                    <Ionicons name={v.icon} size={14} color={active ? theme.colors.textInverse : theme.colors.textPrimary} />
                    <Text style={[styles.vibeText, active && styles.vibeTextActive]}>{v.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              testID="craft-btn"
              disabled={!formReady || busy}
              onPress={craftItinerary}
              style={[styles.craftBtn, (!formReady || busy) && { opacity: 0.5 }]}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color={theme.colors.textInverse} />
                  <Text style={styles.craftText}>Craft my itinerary</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === "chat" && showIntro && (
          <View>
            <View style={styles.introBox}>
              <View style={styles.heroIcon}><Ionicons name="chatbubbles" size={26} color={theme.colors.primary} /></View>
              <Text style={styles.introHead}>Ask Roamie anything</Text>
              <Text style={styles.introSub}>Type your travel question and I'll suggest 2-4 picks from our catalog.</Text>
            </View>

            <Text style={styles.lbl}>TRY ASKING</Text>
            <View style={{ gap: 10 }}>
              {[
                "Best stay for a romantic weekend in Udaipur",
                "Adventure package for next month under ₹20,000",
                "Suggest a spiritual retreat near the Ganges",
                "Kid-friendly mountain stay for 5 days",
              ].map((p) => (
                <TouchableOpacity
                  key={p}
                  testID={`ai-prompt-${p.slice(0, 8)}`}
                  style={styles.promptCard}
                  onPress={() => submit(p)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.promptText}>{p}</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!showIntro && messages.map((m, i) => (
          <MessageBubble key={i} msg={m} onTapLink={tapLink} />
        ))}
        {busy && !showIntro && (
          <View style={styles.aiBubbleRow}>
            <View style={styles.aiAvatar}><Ionicons name="sparkles" size={14} color={theme.colors.textInverse} /></View>
            <View style={styles.aiBubble}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.typingText}>Roamie is curating your itinerary…</Text>
            </View>
          </View>
        )}

        {!showIntro && (
          <TouchableOpacity
            testID="ai-reset"
            onPress={() => { setMessages([]); setQ(""); }}
            style={styles.resetBtn}
          >
            <Ionicons name="refresh" size={14} color={theme.colors.primary} />
            <Text style={styles.resetText}>Start over</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {mode === "chat" && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={16} color={theme.colors.textPrimary} />
            <TextInput
              testID="ai-input"
              style={styles.chatInput}
              value={q}
              onChangeText={setQ}
              placeholder="Search stays, packages, or ask anything…"
              placeholderTextColor={theme.colors.textTertiary}
              returnKeyType="send"
              onSubmitEditing={handleChat}
            />
          </View>
          <TouchableOpacity
            testID="ai-send"
            style={[styles.sendBtn, (!q.trim() || busy) && { opacity: 0.5 }]}
            onPress={handleChat}
            disabled={!q.trim() || busy}
          >
            <Ionicons name="arrow-up" size={20} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg, onTapLink }: { msg: Msg; onTapLink: (tag: string) => void }) {
  const parts = useMemo(() => {
    if (msg.role !== "ai") return [{ kind: "text" as const, value: msg.text }];
    const out: { kind: "text" | "link"; value: string }[] = [];
    const re = /\[(stay-[a-z0-9-]+|pkg-[a-z0-9-]+)\]/gi;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(msg.text)) !== null) {
      if (m.index > last) out.push({ kind: "text", value: msg.text.slice(last, m.index) });
      out.push({ kind: "link", value: m[1] });
      last = m.index + m[0].length;
    }
    if (last < msg.text.length) out.push({ kind: "text", value: msg.text.slice(last) });
    return out;
  }, [msg]);

  if (msg.role === "user") {
    return (
      <View style={styles.userBubbleRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  // Bolded **text** rendering
  const renderWithBold = (text: string, keyPrefix: string) => {
    const chunks = text.split(/(\*\*[^*]+\*\*)/g);
    return chunks.map((c, i) => {
      if (c.startsWith("**") && c.endsWith("**")) {
        return <Text key={`${keyPrefix}-${i}`} style={styles.aiBold}>{c.slice(2, -2)}</Text>;
      }
      return <Text key={`${keyPrefix}-${i}`} style={styles.aiText}>{c}</Text>;
    });
  };

  return (
    <View style={styles.aiBubbleRow}>
      <View style={styles.aiAvatar}><Ionicons name="sparkles" size={14} color={theme.colors.textInverse} /></View>
      <View style={styles.aiBubble}>
        <Text style={styles.aiText}>
          {parts.map((p, i) =>
            p.kind === "text" ? (
              <Text key={i}>{renderWithBold(p.value, `t${i}`)}</Text>
            ) : (
              <Text
                key={i}
                testID={`ai-link-${p.value}`}
                onPress={() => onTapLink(p.value)}
                style={styles.linkChip}
              >
                {" "}[{p.value}]{" "}
              </Text>
            )
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoDot: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },
  subtitle: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.muted,
    alignItems: "center", justifyContent: "center",
  },
  modeSwitch: {
    flexDirection: "row", gap: 6,
    backgroundColor: theme.colors.muted,
    padding: 4, borderRadius: theme.radius.full,
    marginTop: 14,
  },
  modeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: theme.radius.full,
  },
  modeBtnActive: { backgroundColor: theme.colors.secondary },
  modeTxt: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  modeTxtActive: { color: theme.colors.textInverse },
  introBox: { alignItems: "center", marginBottom: 24 },
  heroIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#E4F0D1", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  introHead: { fontSize: 20, fontWeight: "700", color: theme.colors.textPrimary, textAlign: "center" },
  introSub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 19 },
  lbl: { fontSize: 11, letterSpacing: 1.4, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 10, marginTop: 18 },
  lblThin: { fontWeight: "400", textTransform: "none", letterSpacing: 0, color: theme.colors.textTertiary },
  inputField: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: theme.colors.textPrimary, padding: 0 },
  destChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chipSmall: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.full,
  },
  chipSmallActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipSmallText: { fontSize: 12, fontWeight: "600", color: theme.colors.textPrimary },
  chipSmallTextActive: { color: theme.colors.textInverse },
  rowChips: { flexDirection: "row", gap: 8 },
  numChip: {
    flex: 1, alignItems: "center", gap: 2,
    paddingVertical: 12, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  numChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  numChipText: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  numChipTextActive: { color: theme.colors.textInverse },
  numChipUnit: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "500" },
  budgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  budgetCard: {
    flexGrow: 1, minWidth: "47%",
    paddingVertical: 14, paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  budgetCardActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  budgetLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  vibeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vibePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
  },
  vibePillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  vibeText: { fontSize: 12, fontWeight: "600", color: theme.colors.textPrimary },
  vibeTextActive: { color: theme.colors.textInverse },
  craftBtn: {
    marginTop: 26,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  craftText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 15 },
  promptCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 14, borderRadius: theme.radius.lg,
  },
  promptText: { flex: 1, fontSize: 13, color: theme.colors.textPrimary, lineHeight: 18 },
  userBubbleRow: { alignItems: "flex-end", marginBottom: 14 },
  userBubble: {
    maxWidth: "85%", backgroundColor: theme.colors.primary,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomRightRadius: 4,
  },
  userText: { color: theme.colors.textInverse, fontSize: 14, lineHeight: 20 },
  aiBubbleRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 14 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  aiBubble: {
    flex: 1, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 18, borderTopLeftRadius: 4,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  aiText: { flex: 1, fontSize: 14, lineHeight: 21, color: theme.colors.textPrimary },
  aiBold: { fontWeight: "700", color: theme.colors.textPrimary, fontSize: 14 },
  typingText: { fontSize: 12, color: theme.colors.textSecondary },
  linkChip: {
    color: theme.colors.primary, fontWeight: "700",
    backgroundColor: "#E4F0D1",
  },
  resetBtn: {
    alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 18,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    marginTop: 10,
  },
  resetText: { fontSize: 12, fontWeight: "700", color: theme.colors.primary },
  inputBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  chatInput: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, padding: 0 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: "center", justifyContent: "center",
  },
});
