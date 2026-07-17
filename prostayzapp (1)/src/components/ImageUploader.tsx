import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
};

export default function ImageUploader({ value, onChange, max = 10, label = "Images" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addImage = (uri: string) => {
    if (value.length >= max) {
      Alert.alert("Limit reached", `Maximum ${max} images allowed`);
      return;
    }
    onChange([...value, uri]);
  };

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  // Web: trigger file input
  const handleWebPick = () => {
    if (!inputRef.current) return;
    inputRef.current.click();
  };

  const onWebFile = (e: any) => {
    const files: FileList = e?.target?.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert("Too large", `${file.name}: image must be under 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (dataUrl) addImage(dataUrl);
      };
      reader.readAsDataURL(file);
    });
    // reset so same file can be picked again
    if (inputRef.current) inputRef.current.value = "";
  };

  // Native: use expo-image-picker
  const handleNativePick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo library access to upload images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
        selectionLimit: max - value.length,
      });
      if (result.canceled) return;
      result.assets.forEach((a) => {
        if (a.base64) {
          const ext = (a.uri.split(".").pop() || "jpeg").toLowerCase();
          addImage(`data:image/${ext === "jpg" ? "jpeg" : ext};base64,${a.base64}`);
        } else if (a.uri) {
          addImage(a.uri);
        }
      });
    } catch (e: any) {
      Alert.alert("Picker error", e.message || "Failed to pick image");
    }
  };

  const onAdd = Platform.OS === "web" ? handleWebPick : handleNativePick;

  return (
    <View>
      <Text style={styles.label}>{label.toUpperCase()} ({value.length}/{max})</Text>

      {/* Hidden HTML file input for web */}
      {Platform.OS === "web" && (
        // @ts-ignore - native input
        <input
          ref={inputRef as any}
          type="file"
          accept="image/*"
          multiple
          onChange={onWebFile}
          style={{ display: "none" }}
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
        {value.map((uri, i) => (
          <View key={i} style={styles.thumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeAt(i)} testID={`remove-img-${i}`}>
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
            {i === 0 && (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>COVER</Text>
              </View>
            )}
          </View>
        ))}

        {value.length < max && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.7} testID="add-image-btn">
            <Ionicons name="cloud-upload-outline" size={26} color={theme.colors.primary} />
            <Text style={styles.addText}>Upload</Text>
            <Text style={styles.addHint}>JPG/PNG · up to 5MB</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {value.length === 0 && (
        <Text style={styles.helper}>First image becomes the cover photo</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: "700", letterSpacing: 0.8 },
  thumbRow: { gap: 10, paddingVertical: 4 },
  thumb: { width: 120, height: 120, borderRadius: 12, overflow: "hidden", backgroundColor: theme.colors.muted, position: "relative" },
  thumbImg: { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" },
  coverBadge: { position: "absolute", bottom: 6, left: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  addBtn: {
    width: 120, height: 120, borderRadius: 12,
    borderWidth: 2, borderColor: theme.colors.borderMedium, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  addText: { fontSize: 12, fontWeight: "700", color: theme.colors.primary, marginTop: 2 },
  addHint: { fontSize: 9, color: theme.colors.textTertiary, textAlign: "center" },
  helper: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 8, fontStyle: "italic" },
});
