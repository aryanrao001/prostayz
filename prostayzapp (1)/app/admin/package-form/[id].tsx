import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../src/theme";
import { api } from "../../../src/api";
import { useAuth } from "../../../src/AuthContext";
import ImageUploader from "../../../src/components/ImageUploader";
import RatingPicker from "../../../src/components/RatingPicker";

const CATEGORIES = ["Beach", "Mountain", "Heritage", "Adventure", "Spiritual", "Wildlife"];

type Day = { title: string; description: string };
type Form = {
  title: string; destination: string;
  duration_nights: string; duration_days: string;
  price: string; original_price: string;
  category: string;
  short_description: string; highlights: string;
  inclusions: string; exclusions: string;
  days: Day[];
};

const empty: Form = {
  title: "", destination: "",
  duration_nights: "3", duration_days: "4",
  price: "15000", original_price: "",
  category: CATEGORIES[0],
  short_description: "", highlights: "",
  inclusions: "All meals, Hotel stay, Airport transfers",
  exclusions: "Flights, Personal expenses",
  days: [{ title: "Arrival", description: "Check-in and welcome dinner." }],
};

export default function PackageForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(empty);
  const [thumbnail, setThumbnail] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(4.8);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const p = await api<any>(`/packages/${id}`);
      setForm({
        title: p.title, destination: p.destination,
        duration_nights: String(p.duration_nights), duration_days: String(p.duration_days),
        price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
        category: p.category,
        short_description: p.short_description, highlights: (p.highlights || []).join(", "),
        inclusions: (p.inclusions || []).join(", "), exclusions: (p.exclusions || []).join(", "),
        days: (p.itinerary || []).map((d: any) => ({ title: d.title, description: d.description })),
      });
      // backward compat: if cover_images empty but cover_image present, use it
      const covers = (p.cover_images && p.cover_images.length > 0) ? p.cover_images : (p.cover_image ? [p.cover_image] : []);
      setCoverImages(covers);
      setThumbnail(p.thumbnail ? [p.thumbnail] : []);
      setGallery(p.gallery || []);
      setRating(Number(p.rating) || 4.8);
    } catch (e: any) { Alert.alert("Error", e.message); }
  }, [id, isNew]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const upd = (k: keyof Form) => (v: string) => setForm({ ...form, [k]: v });

  const addDay = () => setForm({ ...form, days: [...form.days, { title: "", description: "" }] });
  const removeDay = (i: number) => setForm({ ...form, days: form.days.filter((_, idx) => idx !== i) });
  const updateDay = (i: number, key: keyof Day, v: string) => {
    const next = [...form.days]; next[i] = { ...next[i], [key]: v }; setForm({ ...form, days: next });
  };

  const save = async () => {
    if (!form.title || !form.destination || coverImages.length === 0) {
      Alert.alert("Missing fields", "Title, destination and at least 1 cover image are required.");
      return;
    }
    const body = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      duration_nights: parseInt(form.duration_nights) || 1,
      duration_days: parseInt(form.duration_days) || 2,
      price: parseInt(form.price) || 0,
      original_price: form.original_price ? parseInt(form.original_price) : null,
      rating: rating || 4.8,
      reviews_count: 0,
      category: form.category,
      cover_image: coverImages[0],
      cover_images: coverImages,
      thumbnail: thumbnail[0] || coverImages[0] || null,
      gallery: gallery,
      short_description: form.short_description.trim(),
      highlights: form.highlights.split(",").map(s => s.trim()).filter(Boolean),
      inclusions: form.inclusions.split(",").map(s => s.trim()).filter(Boolean),
      exclusions: form.exclusions.split(",").map(s => s.trim()).filter(Boolean),
      itinerary: form.days.map((d, i) => ({ day: i + 1, title: d.title || `Day ${i + 1}`, description: d.description })),
    };
    try {
      setSaving(true);
      const base = user?.role === "admin" ? "/admin/packages" : "/vendor/packages";
      if (isNew) await api(base, { method: "POST", auth: true, body });
      else await api(`${base}/${id}`, { method: "PUT", auth: true, body });
      router.back();
    } catch (e: any) { Alert.alert("Save failed", e.message); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity testID="back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isNew ? "New Package" : "Edit Package"}</Text>
        <TouchableOpacity testID="save-btn" onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
          {saving ? <ActivityIndicator color={theme.colors.textInverse} size="small" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Section title="BASICS">
          <Field label="Title" value={form.title} onChange={upd("title")} placeholder="Kerala Backwaters Escape" />
          <Field label="Destination" value={form.destination} onChange={upd("destination")} placeholder="Kochi • Alleppey • Varkala" />
          <Field label="Short description" value={form.short_description} onChange={upd("short_description")} multiline />
          <Text style={styles.lbl}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} testID={`cat-${c}`} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipActive]}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="DURATION & PRICE">
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Nights" value={form.duration_nights} onChange={upd("duration_nights")} keyboard="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Days" value={form.duration_days} onChange={upd("duration_days")} keyboard="numeric" /></View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Price (₹)" value={form.price} onChange={upd("price")} keyboard="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Original price (optional)" value={form.original_price} onChange={upd("original_price")} keyboard="numeric" /></View>
          </View>
          <View style={{ marginTop: 8 }}>
            <RatingPicker value={rating} onChange={setRating} label="Rating" />
          </View>
        </Section>

        <Section title="THUMBNAIL">
          <ImageUploader value={thumbnail} onChange={setThumbnail} max={1} label="Thumbnail (card image)" />
        </Section>

        <Section title="COVER IMAGES">
          <ImageUploader value={coverImages} onChange={setCoverImages} max={5} label="Cover carousel" />
        </Section>

        <Section title="GALLERY">
          <ImageUploader value={gallery} onChange={setGallery} max={12} label="Gallery photos" />
        </Section>

        <Section title="ITINERARY">
          {form.days.map((d, i) => (
            <View key={i} style={styles.dayCard}>
              <View style={styles.dayHead}>
                <View style={styles.dayBadge}><Text style={styles.dayBadgeText}>D{i + 1}</Text></View>
                <Text style={styles.dayLbl}>Day {i + 1}</Text>
                {form.days.length > 1 && (
                  <TouchableOpacity testID={`remove-day-${i}`} onPress={() => removeDay(i)} style={styles.removeBtn}>
                    <Ionicons name="close" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput style={styles.dayTitleIn} value={d.title} onChangeText={(v) => updateDay(i, "title", v)} placeholder="Day title (e.g. Arrive Kochi)" placeholderTextColor={theme.colors.textTertiary} />
              <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: "top", marginTop: 6 }]} value={d.description} onChangeText={(v) => updateDay(i, "description", v)} placeholder="What happens on this day..." placeholderTextColor={theme.colors.textTertiary} multiline />
            </View>
          ))}
          <TouchableOpacity testID="add-day" onPress={addDay} style={styles.addDayBtn}>
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.addDayText}>Add another day</Text>
          </TouchableOpacity>
        </Section>

        <Section title="HIGHLIGHTS & INCLUSIONS">
          <Field label="Highlights (comma separated)" value={form.highlights} onChange={upd("highlights")} placeholder="Sunset cruise, Heritage walk..." />
          <Field label="Inclusions (comma separated)" value={form.inclusions} onChange={upd("inclusions")} />
          <Field label="Exclusions (comma separated)" value={form.exclusions} onChange={upd("exclusions")} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 22 }}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Field({ label, value, onChange, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 70, textAlignVertical: "top" }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType={keyboard || "default"} multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  saveBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: theme.radius.full },
  saveText: { color: theme.colors.textInverse, fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.4, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 12 },
  lbl: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  chipTextActive: { color: theme.colors.textInverse },
  dayCard: { padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  dayBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.secondary, alignItems: "center", justifyContent: "center" },
  dayBadgeText: { color: theme.colors.textInverse, fontSize: 11, fontWeight: "800" },
  dayLbl: { flex: 1, fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FBE8CE", alignItems: "center", justifyContent: "center" },
  dayTitleIn: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  addDayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.primary, borderRadius: theme.radius.md },
  addDayText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
});
