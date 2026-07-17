import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../src/theme";
import { api } from "../../../src/api";
import { useAuth } from "../../../src/AuthContext";
import ImageUploader from "../../../src/components/ImageUploader";
import RatingPicker from "../../../src/components/RatingPicker";

const CATEGORIES = ["Beachfront", "Cabin", "Heritage", "Houseboat", "Treehouse", "Mountain", "Unique"];

type Form = {
  title: string; location: string; city: string; category: string;
  price_per_night: string; max_guests: string; bedrooms: string; beds: string; baths: string;
  description: string; host_name: string; host_avatar: string;
  amenities: string;
};

const empty: Form = {
  title: "", location: "", city: "", category: CATEGORIES[0],
  price_per_night: "5000", max_guests: "2", bedrooms: "1", beds: "1", baths: "1",
  description: "", host_name: "Admin", host_avatar: "https://i.pravatar.cc/150?img=12",
  amenities: "Wi-Fi, AC, Breakfast",
};

export default function StayForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<Form>(empty);
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(4.8);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const s = await api<any>(`/stays/${id}`);
      setForm({
        title: s.title, location: s.location, city: s.city, category: s.category,
        price_per_night: String(s.price_per_night), max_guests: String(s.max_guests),
        bedrooms: String(s.bedrooms), beds: String(s.beds), baths: String(s.baths),
        description: s.description, host_name: s.host_name, host_avatar: s.host_avatar,
        amenities: (s.amenities || []).join(", "),
      });
      setImages(s.images || []);
      setThumbnail(s.thumbnail ? [s.thumbnail] : []);
      setRating(Number(s.rating) || 4.8);
    } catch (e: any) { Alert.alert("Error", e.message); }
  }, [id, isNew]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const upd = (k: keyof Form) => (v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    if (!form.title || !form.location || images.length === 0) {
      Alert.alert("Missing fields", "Title, location and at least 1 image are required.");
      return;
    }
    const body = {
      title: form.title.trim(),
      location: form.location.trim(),
      city: form.city.trim() || form.location.split(",")[0].trim(),
      category: form.category,
      price_per_night: parseInt(form.price_per_night) || 0,
      rating: rating || 4.8,
      reviews_count: 0,
      images: images,
      thumbnail: thumbnail[0] || images[0] || null,
      amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean),
      description: form.description.trim(),
      host_name: form.host_name.trim() || "Host",
      host_avatar: form.host_avatar.trim() || "https://i.pravatar.cc/150?img=12",
      max_guests: parseInt(form.max_guests) || 2,
      bedrooms: parseInt(form.bedrooms) || 1,
      beds: parseInt(form.beds) || 1,
      baths: parseInt(form.baths) || 1,
    };
    try {
      setSaving(true);
      const base = user?.role === "admin" ? "/admin/stays" : "/vendor/stays";
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
        <Text style={styles.topTitle}>{isNew ? "New Stay" : "Edit Stay"}</Text>
        <TouchableOpacity testID="save-btn" onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
          {saving ? <ActivityIndicator color={theme.colors.textInverse} size="small" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Section title="BASICS">
          <Field label="Title" value={form.title} onChange={upd("title")} placeholder="Serene Kerala Houseboat" />
          <Field label="Location" value={form.location} onChange={upd("location")} placeholder="Alleppey, Kerala" />
          <Field label="City" value={form.city} onChange={upd("city")} placeholder="Alleppey" />
          <Text style={styles.lbl}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} testID={`cat-${c}`} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipActive]}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="PRICE & CAPACITY">
          <Field label="Price per night (₹)" value={form.price_per_night} onChange={upd("price_per_night")} keyboard="numeric" />
          <View style={{ marginBottom: 14 }}>
            <RatingPicker value={rating} onChange={setRating} label="Rating" />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Guests" value={form.max_guests} onChange={upd("max_guests")} keyboard="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Bedrooms" value={form.bedrooms} onChange={upd("bedrooms")} keyboard="numeric" /></View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Beds" value={form.beds} onChange={upd("beds")} keyboard="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Baths" value={form.baths} onChange={upd("baths")} keyboard="numeric" /></View>
          </View>
        </Section>

        <Section title="PHOTOS">
          <View style={{ marginBottom: 16 }}>
            <ImageUploader value={thumbnail} onChange={setThumbnail} max={1} label="Thumbnail (card image)" />
          </View>
          <ImageUploader value={images} onChange={setImages} max={15} label="Property gallery (carousel)" />
        </Section>

        <Section title="DETAILS">
          <Field label="Description" value={form.description} onChange={upd("description")} multiline placeholder="A poetic description..." />
          <Field label="Amenities (comma separated)" value={form.amenities} onChange={upd("amenities")} placeholder="Wi-Fi, AC, Pool" />
        </Section>

        <Section title="HOST">
          <Field label="Host name" value={form.host_name} onChange={upd("host_name")} />
          <Field label="Host avatar URL" value={form.host_avatar} onChange={upd("host_avatar")} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType={keyboard || "default"}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.bg },
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
});
