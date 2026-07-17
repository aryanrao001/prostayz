// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Alert,
//   Animated,
//   Easing,
//   LayoutChangeEvent,
//   NativeSyntheticEvent,
//   NativeScrollEvent,
//   Modal,
//   TextInput,
//   Platform,
//   KeyboardAvoidingView,
//   Pressable,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// // npx expo install expo-linear-gradient  (ships with the Expo SDK by default)
// import { LinearGradient } from "expo-linear-gradient";
// // npx expo install @react-native-community/datetimepicker
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { theme } from "../../src/theme";
// import { api } from "@/src/api";

// const { width } = Dimensions.get("window");
// const HERO_HEIGHT = 420;
// const ROOM_CARD_WIDTH = width * 0.78;
// const ROOM_CARD_GAP = 14;

// /* ---------------------------------------------------------------------
//    Adjust these to match wherever your backend actually serves uploads.
//    property_images.image -> `${IMAGE_BASE_URL}/{property_id}/{image}`
//    room_images.image      -> `${ROOM_IMAGE_BASE_URL}/{room_id}/{image}`
// --------------------------------------------------------------------- */
// const IMAGE_BASE_URL = "http://192.168.1.59:51234/uploads/properties";
// const ROOM_IMAGE_BASE_URL = "http://192.168.1.59:51234/uploads/properties";
// const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80";

// // Adjust this if createBooking isn't mounted at the bare /bookings path.
// const BOOKING_ENDPOINT = "/bookings";

// type IoniconName = keyof typeof Ionicons.glyphMap;

// /* ------------------------------- API shape ---------------------------------
//    Mirrors getPropertyDetails exactly: flat `property` row (with joined
//    vendor / address / policy / rule columns), plus sibling arrays.
// ------------------------------------------------------------------------- */

// interface RawProperty {
//   id: number;
//   vendor_id: number;
//   property_type_id: number;
//   property_name: string;
//   slug: string;
//   description: string | null;
//   star_rating: number;
//   contact_name: string | null;
//   contact_number: string | null;
//   email: string | null;
//   website: string | null;
//   check_in: string | null;
//   check_out: string | null;
//   total_rooms: number;
//   min_price: number | null;
//   max_price: number | null;
//   status: string;
//   is_featured: number | boolean;
//   latitude: number | null;
//   longitude: number | null;
//   property_type: string | null;
//   vendor_name: string | null;
//   vendor_business_name: string | null;
//   vendor_email: string | null;
//   vendor_phone: string | null;
//   vendor_status: string | null;
//   country: string | null;
//   state: string | null;
//   city: string | null;
//   area: string | null;
//   address: string | null;
//   pincode: string | null;
//   landmark: string | null;
//   cancellation_policy: string | null;
//   house_rules: string | null;
//   refund_policy: string | null;
//   smoking_allowed: number | boolean | null;
//   pets_allowed: number | boolean | null;
//   parties_allowed: number | boolean | null;
//   couples_allowed: number | boolean | null;
//   children_allowed: number | boolean | null;
//   completed_percentage: number | null;
//   is_completed: number | boolean | null;
// }

// interface PropertyImage {
//   id: number;
//   image: string;
//   is_cover: number | boolean;
//   sort_order: number;
// }

// interface Amenity {
//   id: number;
//   name: string;
//   icon: string | null;
// }

// interface RoomBed {
//   bed_type: string;
//   quantity: number;
// }

// interface RoomDormBed {
//   id: number;
//   bed_label: string;
//   bed_type: string;
//   status: "available" | "blocked" | "maintenance";
//   price: number;
// }

// interface RoomImage {
//   id: number;
//   room_id: number;
//   image: string;
//   is_cover: number | boolean;
//   sort_order: number;
// }

// interface RoomPrice {
//   price: number;
//   weekend_price: number | null;
//   extra_guest_price: number | null;
//   tax: number | null;
// }

// interface Room {
//   id: number;
//   room_name: string;
//   room_type: string | null;
//   room_category: "private" | "dorm" | "whole_property";
//   max_adults: number | null;
//   max_children: number | null;
//   total_rooms: number | null;
//   available_rooms: number | null;
//   room_size: number | null;
//   room_size_unit: "sqft" | "sqm" | null;
//   private_bathroom: number | boolean | null;
//   balcony: number | boolean | null;
//   air_conditioning: number | boolean | null;
//   description: string | null;
//   beds: RoomBed[];
//   dorm_beds: RoomDormBed[];
//   images: RoomImage[];
//   price: RoomPrice | null;
// }

// interface ApiResponse {
//   success: boolean;
//   property: RawProperty;
//   images: PropertyImage[];
//   amenities: Amenity[];
//   rooms: Room[];
// }

// interface BookingResultData {
//   bookingId: number;
//   bookingNumber: string;
//   subtotal: number;
//   extraGuestAmount: number;
//   taxAmount: number;
//   discountAmount: number;
//   totalAmount: number;
// }

// /* --------------------------------- Helpers ---------------------------------- */

// const LUCIDE_TO_IONICON: Record<string, IoniconName> = {
//   Wifi: "wifi-outline",
//   Car: "car-outline",
//   Snowflake: "snow-outline",
//   Tv: "tv-outline",
//   Waves: "water-outline",
//   Dumbbell: "barbell-outline",
//   Utensils: "restaurant-outline",
//   Coffee: "cafe-outline",
//   Brush: "brush-outline",
//   ShieldCheck: "shield-checkmark-outline",
//   Wind: "cloud-outline",
//   Lock: "lock-closed-outline",
// };

// function amenityIcon(a: Amenity): IoniconName {
//   if (a.icon && LUCIDE_TO_IONICON[a.icon]) return LUCIDE_TO_IONICON[a.icon];
//   return "checkmark-circle-outline";
// }

// const TYPE_ICON_BY_NAME: Record<string, IoniconName> = {
//   villa: "home",
//   apartment: "business",
//   hostel: "people",
//   luxury: "diamond",
// };

// function formatTime(t: string | null): string | null {
//   if (!t) return null;
//   const [hStr, mStr] = t.split(":");
//   let h = parseInt(hStr, 10);
//   if (Number.isNaN(h)) return null;
//   const suffix = h >= 12 ? "PM" : "AM";
//   h = h % 12 || 12;
//   return `${h}:${mStr} ${suffix}`;
// }

// function money(n: number | null | undefined): string {
//   return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
// }

// const b = (v: number | boolean | null | undefined) => Boolean(v);

// /* ---------------------- Client-side pricing preview ----------------------
//    Mirrors utils/pricing.js so the UI can show a live total before hitting
//    the server. The server remains the source of truth at booking time.
// --------------------------------------------------------------------- */

// function toDateOnly(d: Date) {
//   return new Date(d.getFullYear(), d.getMonth(), d.getDate());
// }

// function dateToStr(d: Date): string {
//   return d.toISOString().slice(0, 10);
// }

// function addDays(d: Date, n: number): Date {
//   const copy = new Date(d);
//   copy.setDate(copy.getDate() + n);
//   return copy;
// }

// function getNightsListClient(checkIn: Date, checkOut: Date): string[] {
//   const nights: string[] = [];
//   let cur = toDateOnly(checkIn);
//   const end = toDateOnly(checkOut);
//   while (cur < end) {
//     nights.push(dateToStr(cur));
//     cur = addDays(cur, 1);
//   }
//   return nights;
// }

// function isWeekendStr(dateStr: string): boolean {
//   const day = new Date(dateStr).getDay();
//   return day === 0 || day === 6;
// }

// function formatDatePretty(d: Date): string {
//   return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
// }

// interface PricePreview {
//   subtotal: number;
//   extraGuestAmount: number;
//   taxAmount: number;
//   totalAmount: number;
//   nights: number;
// }

// function computeRoomPreview(room: Room, nightsList: string[], adults: number, quantity: number): PricePreview | null {
//   if (!room.price) return null;
//   const nights = nightsList.length;
//   if (nights <= 0) return null;

//   let subtotal = 0;
//   for (const date of nightsList) {
//     subtotal += isWeekendStr(date) ? Number(room.price.weekend_price ?? room.price.price) : Number(room.price.price);
//   }
//   const extraAdults = Math.max(0, adults - (room.max_adults ?? adults));
//   const extraGuestAmount = extraAdults * Number(room.price.extra_guest_price || 0) * nights;
//   const taxable = subtotal + extraGuestAmount;
//   const taxAmount = +(taxable * (Number(room.price.tax || 0) / 100)).toFixed(2);

//   return {
//     subtotal: +(subtotal * quantity).toFixed(2),
//     extraGuestAmount: +(extraGuestAmount * quantity).toFixed(2),
//     taxAmount: +(taxAmount * quantity).toFixed(2),
//     totalAmount: +((subtotal + extraGuestAmount + taxAmount) * quantity).toFixed(2),
//     nights,
//   };
// }

// function computeDormPreview(room: Room, bedId: number, nightsList: string[]): PricePreview | null {
//   const bed = room.dorm_beds.find((db) => db.id === bedId);
//   if (!bed || !room.price) return null;
//   const nights = nightsList.length;
//   if (nights <= 0) return null;
//   const subtotal = Number(bed.price) * nights;
//   const taxAmount = +(subtotal * (Number(room.price.tax || 0) / 100)).toFixed(2);
//   return {
//     subtotal: +subtotal.toFixed(2),
//     extraGuestAmount: 0,
//     taxAmount,
//     totalAmount: +(subtotal + taxAmount).toFixed(2),
//     nights,
//   };
// }

// /* ------------------------------ Skeleton loader ------------------------------ */

// function Shimmer({ style }: { style: any }) {
//   const pulse = useRef(new Animated.Value(0.35)).current;
//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.ease, useNativeDriver: true }),
//         Animated.timing(pulse, { toValue: 0.35, duration: 750, easing: Easing.ease, useNativeDriver: true }),
//       ])
//     );
//     loop.start();
//     return () => loop.stop();
//   }, [pulse]);
//   return <Animated.View style={[style, { opacity: pulse }]} />;
// }

// function DetailSkeleton({ insetTop }: { insetTop: number }) {
//   return (
//     <View style={styles.container}>
//       <Shimmer style={{ width, height: HERO_HEIGHT, backgroundColor: "#E7E0CC" }} />
//       <View style={{ padding: 20, gap: 12 }}>
//         <Shimmer style={{ width: "45%", height: 14, borderRadius: 7, backgroundColor: "#E7E0CC" }} />
//         <Shimmer style={{ width: "80%", height: 26, borderRadius: 8, backgroundColor: "#E7E0CC" }} />
//         <Shimmer style={{ width: "60%", height: 14, borderRadius: 7, backgroundColor: "#E7E0CC" }} />
//         <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
//           {[0, 1, 2].map((i) => (
//             <Shimmer key={i} style={{ flex: 1, height: 64, borderRadius: 14, backgroundColor: "#E7E0CC" }} />
//           ))}
//         </View>
//         <Shimmer style={{ width: "100%", height: 90, borderRadius: 14, backgroundColor: "#E7E0CC", marginTop: 14 }} />
//       </View>
//     </View>
//   );
// }

// /* -------------------------------- Stepper ------------------------------------ */

// function Stepper({
//   value,
//   onChange,
//   min = 0,
//   max = 20,
//   testIDPrefix,
// }: {
//   value: number;
//   onChange: (v: number) => void;
//   min?: number;
//   max?: number;
//   testIDPrefix?: string;
// }) {
//   return (
//     <View style={styles.stepper}>
//       <TouchableOpacity
//         testID={testIDPrefix ? `${testIDPrefix}-minus` : undefined}
//         style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
//         disabled={value <= min}
//         onPress={() => onChange(Math.max(min, value - 1))}
//       >
//         <Ionicons name="remove" size={15} color={value <= min ? "#B8AF95" : theme.colors.primary} />
//       </TouchableOpacity>
//       <Text style={styles.stepperValue}>{value}</Text>
//       <TouchableOpacity
//         testID={testIDPrefix ? `${testIDPrefix}-plus` : undefined}
//         style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
//         disabled={value >= max}
//         onPress={() => onChange(Math.min(max, value + 1))}
//       >
//         <Ionicons name="add" size={15} color={value >= max ? "#B8AF95" : theme.colors.primary} />
//       </TouchableOpacity>
//     </View>
//   );
// }

// /* --------------------------------- Room card -------------------------------- */

// function RoomCard({
//   room,
//   nightsList,
//   adults,
//   isSelected,
//   quantity,
//   onQuantityChange,
//   onSelect,
//   selectedDormBedId,
//   onSelectDormBed,
//   property,
// }: {
//   room: Room;
//   nightsList: string[];
//   adults: number;
//   isSelected: boolean;
//   quantity: number;
//   onQuantityChange: (q: number) => void;
//   onSelect: () => void;
//   selectedDormBedId: number | null;
//   onSelectDormBed: (bedId: number) => void;
//   property: {}
// }) {
//   const cover = room.images?.find((i) => b(i.is_cover)) ?? room.images?.[0];
//   const imageUri = cover ? `${ROOM_IMAGE_BASE_URL}/${property?.id}/${cover.image}` : FALLBACK_IMAGE;
//   const isDorm = room.room_category === "dorm";
//   const cheapestDorm = isDorm
//     ? room.dorm_beds.filter((d) => d.status === "available").sort((a, c) => a.price - c.price)[0]
//     : null;

//   const preview = isDorm
//     ? selectedDormBedId
//       ? computeDormPreview(room, selectedDormBedId, nightsList)
//       : null
//     : computeRoomPreview(room, nightsList, adults, quantity);

//   const maxQty = Math.max(1, room.available_rooms ?? 1);

//   return (
//     <View style={[styles.roomCard, isSelected && styles.roomCardSelected]}>
//       <View style={styles.roomImgWrap}>
//         <Image source={{ uri: imageUri }} style={styles.roomImg} />
//         <LinearGradient colors={["transparent", "rgba(20,26,22,0.65)"]} style={styles.roomImgGradient} />
//         <View style={styles.roomCategoryBadge}>
//           <Text style={styles.roomCategoryText}>
//             {room.room_category === "whole_property" ? "ENTIRE PLACE" : room.room_category === "dorm" ? "DORM" : "PRIVATE"}
//           </Text>
//         </View>
//         {(room.price || cheapestDorm) && (
//           <View style={styles.roomPriceTag}>
//             <Text style={styles.roomPriceTagText}>
//               {isDorm ? `from ${money(cheapestDorm?.price)}` : money(room.price?.price)}
//             </Text>
//           </View>
//         )}
//         {isSelected && (
//           <View style={styles.roomSelectedBadge}>
//             <Ionicons name="checkmark" size={13} color="#fff" />
//           </View>
//         )}
//       </View>

//       <View style={styles.roomBody}>
//         <Text style={styles.roomName} numberOfLines={1}>{room.room_name}</Text>
//         {!!room.room_type && <Text style={styles.roomType}>{room.room_type}</Text>}

//         <View style={styles.roomFactsRow}>
//           {room.max_adults != null && (
//             <View style={styles.roomFact}>
//               <Ionicons name="people-outline" size={12.5} color="#5B6B60" />
//               <Text style={styles.roomFactText}>
//                 {room.max_adults}{room.max_children ? `+${room.max_children}` : ""}
//               </Text>
//             </View>
//           )}
//           {room.room_size != null && (
//             <View style={styles.roomFact}>
//               <Ionicons name="resize-outline" size={12.5} color="#5B6B60" />
//               <Text style={styles.roomFactText}>{room.room_size} {room.room_size_unit ?? "sqft"}</Text>
//             </View>
//           )}
//           {room.available_rooms != null && (
//             <View style={styles.roomFact}>
//               <Ionicons name="checkmark-done-outline" size={12.5} color="#5B6B60" />
//               <Text style={styles.roomFactText}>{room.available_rooms} left</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.roomTagsRow}>
//           {b(room.private_bathroom) && (
//             <View style={styles.roomTag}><Ionicons name="water-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>Private bath</Text></View>
//           )}
//           {b(room.balcony) && (
//             <View style={styles.roomTag}><Ionicons name="sunny-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>Balcony</Text></View>
//           )}
//           {b(room.air_conditioning) && (
//             <View style={styles.roomTag}><Ionicons name="snow-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>AC</Text></View>
//           )}
//         </View>

//         {!isDorm && room.beds?.length > 0 && (
//           <Text style={styles.roomBeds}>{room.beds.map((bd) => `${bd.quantity} × ${bd.bed_type}`).join(" · ")}</Text>
//         )}

//         {isDorm && room.dorm_beds?.length > 0 && (
//           <View style={styles.dormList}>
//             {room.dorm_beds.map((bed) => {
//               const bedSelected = selectedDormBedId === bed.id;
//               const bedAvailable = bed.status === "available";
//               return (
//                 <TouchableOpacity
//                   key={bed.id}
//                   disabled={!bedAvailable}
//                   onPress={() => onSelectDormBed(bed.id)}
//                   style={[
//                     styles.dormRow,
//                     bedSelected && styles.dormRowSelected,
//                     !bedAvailable && styles.dormRowDisabled,
//                   ]}
//                 >
//                   <View style={styles.dormRowLeft}>
//                     <Ionicons
//                       name={bedSelected ? "radio-button-on" : "radio-button-off"}
//                       size={14}
//                       color={bedSelected ? theme.colors.primary : bedAvailable ? "#8A7F63" : "#C9C1AA"}
//                     />
//                     <Text style={styles.dormLabel} numberOfLines={1}>{bed.bed_label}</Text>
//                   </View>
//                   <Text style={[styles.dormStatus, !bedAvailable && styles.dormStatusOff]}>
//                     {bedAvailable ? money(bed.price) : bed.status}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         )}

//         {!isDorm && isSelected && (room.total_rooms ?? 1) > 1 && (
//           <View style={styles.qtyRow}>
//             <Text style={styles.qtyLabel}>Rooms</Text>
//             <Stepper value={quantity} onChange={onQuantityChange} min={1} max={maxQty} testIDPrefix={`qty-${room.id}`} />
//           </View>
//         )}

//         {preview && nightsList.length > 0 && (
//           <View style={styles.roomPreviewBox}>
//             <Text style={styles.roomPreviewText}>
//               {money(preview.totalAmount)} total · {preview.nights} night{preview.nights !== 1 ? "s" : ""}
//             </Text>
//           </View>
//         )}

//         <TouchableOpacity
//           style={[styles.selectRoomBtn, isSelected && styles.selectRoomBtnActive]}
//           onPress={onSelect}
//           testID={`select-room-${room.id}`}
//         >
//           <Text style={[styles.selectRoomBtnText, isSelected && styles.selectRoomBtnTextActive]}>
//             {isSelected ? "Selected" : "Select room"}
//           </Text>
//           <Ionicons
//             name={isSelected ? "checkmark-circle" : "arrow-forward"}
//             size={13}
//             color={isSelected ? "#fff" : theme.colors.primary}
//           />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// /* ------------------------------- Rule chip row ------------------------------- */

// function RuleChip({ label, allowed, icon }: { label: string; allowed: boolean; icon: IoniconName }) {
//   return (
//     <View style={[styles.ruleChip, allowed ? styles.ruleChipOn : styles.ruleChipOff]}>
//       <Ionicons name={icon} size={13} color={allowed ? "#2F4A3C" : "#A6472E"} />
//       <Text style={[styles.ruleChipText, { color: allowed ? "#2F4A3C" : "#A6472E" }]}>{label}</Text>
//       <Ionicons name={allowed ? "checkmark" : "close"} size={12} color={allowed ? "#2F4A3C" : "#A6472E"} />
//     </View>
//   );
// }

// /* ------------------------------- Accordion item ------------------------------ */

// function AccordionItem({ title, body }: { title: string; body: string }) {
//   const [open, setOpen] = useState(false);
//   const rotate = useRef(new Animated.Value(0)).current;

//   const toggle = () => {
//     Animated.timing(rotate, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: true }).start();
//     setOpen((o) => !o);
//   };

//   const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

//   return (
//     <View style={styles.accordionItem}>
//       <TouchableOpacity style={styles.accordionHead} onPress={toggle} activeOpacity={0.7}>
//         <Text style={styles.accordionTitle}>{title}</Text>
//         <Animated.View style={{ transform: [{ rotate: spin }] }}>
//           <Ionicons name="chevron-down" size={17} color="#5B6B60" />
//         </Animated.View>
//       </TouchableOpacity>
//       {open && <Text style={styles.accordionBody}>{body}</Text>}
//     </View>
//   );
// }

// /* --------------------------------- Screen ----------------------------------- */

// const SECTIONS = [
//   { key: "overview", label: "Overview" },
//   { key: "rooms", label: "Rooms" },
//   { key: "amenities", label: "Amenities" },
//   { key: "rules", label: "House rules" },
//   { key: "policies", label: "Policies" },
// ] as const;

// export default function StayDetail() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();

//   const [property, setProperty] = useState<RawProperty | null>(null);
//   const [images, setImages] = useState<PropertyImage[]>([]);
//   const [amenities, setAmenities] = useState<Amenity[]>([]);
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [imgIndex, setImgIndex] = useState(0);
//   const [roomIndex, setRoomIndex] = useState(0);
//   const [descExpanded, setDescExpanded] = useState(false);
//   const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
//   const [activeSection, setActiveSection] = useState<string>("overview");

//   const [wished, setWished] = useState(false);
//   const heartScale = useRef(new Animated.Value(1)).current;

//   const scrollY = useRef(new Animated.Value(0)).current;
//   const scrollRef = useRef<ScrollView>(null);
//   const navScrollRef = useRef<ScrollView>(null);
//   const sectionOffsets = useRef<Record<string, number>>({});

//   /* ------------------------------- Booking state ------------------------------- */
//   const [checkIn, setCheckIn] = useState<Date>(() => addDays(toDateOnly(new Date()), 1));
//   const [checkOut, setCheckOut] = useState<Date>(() => addDays(toDateOnly(new Date()), 2));
//   const [pickerTarget, setPickerTarget] = useState<"in" | "out" | null>(null);
//   const [adults, setAdults] = useState(2);
//   const [children, setChildren] = useState(0);
//   const [guestsModalVisible, setGuestsModalVisible] = useState(false);

//   const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
//   const [selectedQuantity, setSelectedQuantity] = useState(1);
//   const [selectedDormBedId, setSelectedDormBedId] = useState<number | null>(null);

//   const [confirmVisible, setConfirmVisible] = useState(false);
//   const [contactName, setContactName] = useState("");
//   const [contactPhone, setContactPhone] = useState("");
//   const [contactEmail, setContactEmail] = useState("");
//   const [specialRequests, setSpecialRequests] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [bookingResult, setBookingResult] = useState<BookingResultData | null>(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // Adjust this path if your route isn't mounted under /user.
//       const json: ApiResponse = await api(`/admin/properties/${id}`, { method: "GET" });
//       setProperty(json.property);
//       setImages(json.images ?? []);
//       setAmenities(json.amenities ?? []);
//       setRooms(json.rooms ?? []);
//     } catch (e: any) {
//       setError(e.message || "Couldn't load this stay.");
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   useEffect(() => {
//     if (property) {
//       setContactName((prev) => prev || property.contact_name || "");
//       setContactPhone((prev) => prev || property.contact_number || "");
//     }
//   }, [property]);

//   const handleSave = () => {
//     // TODO: wire to POST /user/wishlist/toggle once the wishlist API is ready.
//     setWished((w) => !w);
//     Animated.sequence([
//       Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 20 }),
//       Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 14 }),
//     ]).start();
//   };

//   const onSectionLayout = (key: string) => (e: LayoutChangeEvent) => {
//     sectionOffsets.current[key] = e.nativeEvent.layout.y;
//   };

//   const scrollToSection = (key: string) => {
//     setActiveSection(key);
//     const y = sectionOffsets.current[key] ?? 0;
//     scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
//   };

//   const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
//     const y = e.nativeEvent.contentOffset.y;
//     scrollY.setValue(y);
//     let closest = "overview";
//     let closestDist = Infinity;
//     Object.entries(sectionOffsets.current).forEach(([key, offset]) => {
//       const dist = Math.abs(offset - y - 60);
//       if (dist < closestDist) {
//         closestDist = dist;
//         closest = key;
//       }
//     });
//     if (closest !== activeSection) setActiveSection(closest);
//   };

//   const sortedImages = useMemo(
//     () => [...images].sort((a, c) => (b(a.is_cover) === b(c.is_cover) ? a.sort_order - c.sort_order : b(a.is_cover) ? -1 : 1)),
//     [images]
//   );
//   const galleryUris = sortedImages.length
//     ? sortedImages.map((img) => `${IMAGE_BASE_URL}/${property?.id}/${img.image}`)
//     : [FALLBACK_IMAGE];

//   const topBarOpacity = scrollY.interpolate({
//     inputRange: [HERO_HEIGHT - 140, HERO_HEIGHT - 60],
//     outputRange: [0, 1],
//     extrapolate: "clamp",
//   });

//   /* ----------------------------- Booking derived state ----------------------------- */

//   const nightsList = useMemo(() => getNightsListClient(checkIn, checkOut), [checkIn, checkOut]);
//   const nightsCount = nightsList.length;

//   const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);
//   const isDormSelected = selectedRoom?.room_category === "dorm";

//   const pricePreview = useMemo(() => {
//     if (!selectedRoom) return null;
//     if (isDormSelected) {
//       if (!selectedDormBedId) return null;
//       return computeDormPreview(selectedRoom, selectedDormBedId, nightsList);
//     }
//     return computeRoomPreview(selectedRoom, nightsList, adults, selectedQuantity);
//   }, [selectedRoom, isDormSelected, selectedDormBedId, nightsList, adults, selectedQuantity]);

//   const canReserve = Boolean(
//     selectedRoom &&
//     nightsCount > 0 &&
//     (!isDormSelected || selectedDormBedId) &&
//     pricePreview &&
//     pricePreview.totalAmount > 0
//   );

//   const handleSelectRoom = (room: Room) => {
//     setSelectedRoomId((prev) => (prev === room.id ? null : room.id));
//     setSelectedQuantity(1);
//     setSelectedDormBedId(null);
//   };

//   const handleSelectDormBed = (room: Room, bedId: number) => {
//     setSelectedRoomId(room.id);
//     setSelectedDormBedId((prev) => (prev === bedId ? null : bedId));
//   };

//   const onChangeDate = (event: any, picked?: Date) => {
//     const target = pickerTarget;
//     setPickerTarget(Platform.OS === "ios" ? pickerTarget : null);
//     if (event?.type === "dismissed" || !picked) return;

//     const chosen = toDateOnly(picked);
//     if (target === "in") {
//       setCheckIn(chosen);
//       if (toDateOnly(checkOut) <= chosen) setCheckOut(addDays(chosen, 1));
//     } else if (target === "out") {
//       if (chosen <= toDateOnly(checkIn)) {
//         Alert.alert("Invalid date", "Check-out must be after check-in.");
//         return;
//       }
//       setCheckOut(chosen);
//     }
//   };

//   const openReserveFlow = () => {
//     if (!selectedRoom) {
//       Alert.alert("Pick a room", "Select a room or dorm bed before reserving.");
//       scrollToSection("rooms");
//       return;
//     }
//     if (isDormSelected && !selectedDormBedId) {
//       Alert.alert("Pick a bed", "Select an available dorm bed to continue.");
//       return;
//     }
//     if (nightsCount <= 0) {
//       Alert.alert("Pick your dates", "Choose a check-in and check-out date.");
//       setGuestsModalVisible(true);
//       return;
//     }
//     setConfirmVisible(true);
//   };

//   const submitBooking = async () => {
//     if (!property || !selectedRoom) return;
//     if (!contactName.trim() || !contactPhone.trim()) {
//       Alert.alert("Missing details", "Please add a contact name and phone number.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const payload = {
//         propertyId: property.id,
//         roomId: selectedRoom.id,
//         dormBedId: isDormSelected ? selectedDormBedId : undefined,
//         quantity: isDormSelected ? 1 : selectedQuantity,
//         checkInDate: dateToStr(checkIn),
//         checkOutDate: dateToStr(checkOut),
//         adults,
//         children,
//         contactName: contactName.trim(),
//         contactPhone: contactPhone.trim(),
//         contactEmail: contactEmail.trim() || undefined,
//         specialRequests: specialRequests.trim() || undefined,
//       };

//       // If your api() helper expects a raw object instead of a pre-stringified
//       // body, drop the JSON.stringify below.
//       const res = await api(BOOKING_ENDPOINT, {
//         method: "POST",
//         body: JSON.stringify(payload),
//       });

//       const data: BookingResultData = res.data;
//       setBookingResult(data);
//     } catch (e: any) {
//       Alert.alert("Couldn't book this stay", e.message || "Something went wrong. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const closeConfirmFlow = () => {
//     setConfirmVisible(false);
//     setBookingResult(null);
//   };

//   const resetSelectionAfterSuccess = () => {
//     setConfirmVisible(false);
//     setBookingResult(null);
//     setSelectedRoomId(null);
//     setSelectedDormBedId(null);
//     setSelectedQuantity(1);
//     setSpecialRequests("");
//   };

//   if (loading) return <DetailSkeleton insetTop={insets.top} />;

//   if (error || !property) {
//     return (
//       <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
//         <Ionicons name="cloud-offline-outline" size={26} color="#A6472E" />
//         <Text style={styles.emptyTitle}>Something went wrong</Text>
//         <Text style={styles.emptyText}>{error ?? "Stay not found."}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={load}>
//           <Text style={styles.retryBtnText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const typeIcon = TYPE_ICON_BY_NAME[property.property_type?.toLowerCase() ?? ""] ?? "home";
//   const locationLine = [property.area, property.city, property.state].filter(Boolean).join(", ");
//   const checkInTime = formatTime(property.check_in);
//   const checkOutTime = formatTime(property.check_out);
//   const isVendorVerified = property.vendor_status === "active";

//   const previewAmenities = amenitiesExpanded ? amenities : amenities.slice(0, 6);

//   return (
//     <View style={styles.container}>
//       {/* Animated glass top bar (fades in once you scroll past the hero) */}
//       <Animated.View style={[styles.topBar, { opacity: topBarOpacity, paddingTop: insets.top + 6 }]} pointerEvents="box-none">
//         <View style={styles.topBarInner}>
//           <TouchableOpacity style={styles.topBarCircle} onPress={() => router.back()}>
//             <Ionicons name="chevron-back" size={19} color={theme.colors.textPrimary} />
//           </TouchableOpacity>
//           <Text style={styles.topBarTitle} numberOfLines={1}>{property.property_name}</Text>
//           <TouchableOpacity style={styles.topBarCircle} onPress={handleSave}>
//             <Ionicons name={wished ? "heart" : "heart-outline"} size={17} color={wished ? "#A6472E" : theme.colors.textPrimary} />
//           </TouchableOpacity>
//         </View>
//       </Animated.View>

//       {/* Floating buttons over the hero, always visible */}
//       <View style={[styles.floatBar, { top: insets.top + 10 }]}>
//         <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()} testID="back-btn">
//           <Ionicons name="chevron-back" size={20} color="#fff" />
//         </TouchableOpacity>
//         <View style={{ flexDirection: "row", gap: 10 }}>
//           <TouchableOpacity style={styles.circleBtn}>
//             <Ionicons name="share-outline" size={18} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.circleBtn} onPress={handleSave} testID="stay-save-btn">
//             <Animated.View style={{ transform: [{ scale: heartScale }] }}>
//               <Ionicons name={wished ? "heart" : "heart-outline"} size={18} color={wished ? "#FF6B57" : "#fff"} />
//             </Animated.View>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <Animated.ScrollView
//         ref={scrollRef}
//         showsVerticalScrollIndicator={false}
//         scrollEventThrottle={16}
//         onScroll={onMainScroll}
//         contentContainerStyle={{ paddingBottom: 170 }}
//       >
//         {/* Hero gallery with title overlaid */}
//         <View style={{ height: HERO_HEIGHT }}>
//           <ScrollView
//             horizontal
//             pagingEnabled
//             showsHorizontalScrollIndicator={false}
//             onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
//           >
//             {galleryUris.map((uri, i) => (
//               <Image key={i} source={{ uri }} style={styles.heroImg} />
//             ))}
//           </ScrollView>
//           <LinearGradient colors={["rgba(20,26,22,0.05)", "rgba(20,26,22,0.75)"]} style={styles.heroGradient} pointerEvents="none" />

//           {galleryUris.length > 1 && (
//             <View style={styles.dots}>
//               {galleryUris.map((_, i) => (
//                 <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
//               ))}
//             </View>
//           )}

//           <View style={styles.heroOverlayContent}>
//             <View style={styles.heroBadgeRow}>
//               <View style={styles.categoryBadge}>
//                 <Ionicons name={typeIcon} size={12} color="#fff" />
//                 <Text style={styles.categoryText}>{property.property_type?.toUpperCase()}</Text>
//               </View>
//               {b(property.is_featured) && (
//                 <View style={styles.featuredBadge}>
//                   <Ionicons name="sparkles" size={11} color="#1F2A24" />
//                   <Text style={styles.featuredText}>Featured</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={styles.heroTitle} numberOfLines={2}>{property.property_name}</Text>
//             <View style={styles.heroMetaRow}>
//               <Ionicons name="star" size={13} color="#FFD874" />
//               <Text style={styles.heroMetaText}>{property.star_rating?.toFixed(1) ?? "New"}</Text>
//               {!!locationLine && (
//                 <>
//                   <View style={styles.heroDot} />
//                   <Ionicons name="location-outline" size={12} color="#F3EEE2" />
//                   <Text style={styles.heroMetaText} numberOfLines={1}>{locationLine}</Text>
//                 </>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* Sticky-feeling section nav */}
//         <ScrollView
//           ref={navScrollRef}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.sectionNav}
//           contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
//         >
//           {SECTIONS.map((s) => (
//             <TouchableOpacity
//               key={s.key}
//               onPress={() => scrollToSection(s.key)}
//               style={[styles.navPill, activeSection === s.key && styles.navPillActive]}
//             >
//               <Text style={[styles.navPillText, activeSection === s.key && styles.navPillTextActive]}>{s.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <View style={styles.body} onLayout={onSectionLayout("overview")}>
//           {/* Quick stat bento */}
//           <View style={styles.statBento}>
//             <View style={styles.statCard}>
//               <Ionicons name="bed-outline" size={17} color={theme.colors.primary} />
//               <Text style={styles.statCardValue}>{property.total_rooms}</Text>
//               <Text style={styles.statCardLabel}>room{property.total_rooms !== 1 ? "s" : ""}</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="log-in-outline" size={17} color={theme.colors.primary} />
//               <Text style={styles.statCardValue}>{checkInTime ?? "—"}</Text>
//               <Text style={styles.statCardLabel}>check-in</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="log-out-outline" size={17} color={theme.colors.primary} />
//               <Text style={styles.statCardValue}>{checkOutTime ?? "—"}</Text>
//               <Text style={styles.statCardLabel}>check-out</Text>
//             </View>
//           </View>

//           {/* Trip planner card — dates + guests, tap to edit */}
//           <TouchableOpacity
//             style={styles.tripCard}
//             onPress={() => setGuestsModalVisible(true)}
//             testID="edit-trip-btn"
//           >
//             <View style={styles.tripCol}>
//               <Text style={styles.tripLabel}>CHECK-IN</Text>
//               <Text style={styles.tripValue}>{formatDatePretty(checkIn)}</Text>
//             </View>
//             <View style={styles.tripDivider} />
//             <View style={styles.tripCol}>
//               <Text style={styles.tripLabel}>CHECK-OUT</Text>
//               <Text style={styles.tripValue}>{formatDatePretty(checkOut)}</Text>
//             </View>
//             <View style={styles.tripDivider} />
//             <View style={styles.tripCol}>
//               <Text style={styles.tripLabel}>GUESTS</Text>
//               <Text style={styles.tripValue}>
//                 {adults} adult{adults !== 1 ? "s" : ""}{children ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
//               </Text>
//             </View>
//             <View style={styles.tripEditIcon}>
//               <Ionicons name="pencil" size={13} color={theme.colors.primary} />
//             </View>
//           </TouchableOpacity>

//           {property.address && (
//             <View style={styles.addressCard}>
//               <View style={styles.addressIconWrap}>
//                 <Ionicons name="map-outline" size={16} color="#2F4A3C" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.addressText}>{property.address}</Text>
//                 {!!property.landmark && <Text style={styles.addressSub}>{property.landmark}</Text>}
//                 {!!property.pincode && <Text style={styles.addressSub}>PIN {property.pincode} · {[property.city, property.state, property.country].filter(Boolean).join(", ")}</Text>}
//               </View>
//             </View>
//           )}

//           {/* Host / vendor trust block */}
//           {(property.vendor_business_name || property.vendor_name) && (
//             <View style={styles.hostRow}>
//               <View style={styles.hostAvatar}>
//                 <Text style={styles.hostAvatarText}>{(property.vendor_business_name ?? property.vendor_name ?? "H")[0]}</Text>
//               </View>
//               <View style={{ flex: 1 }}>
//                 <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
//                   <Text style={styles.hostName} numberOfLines={1}>{property.vendor_business_name ?? property.vendor_name}</Text>
//                   {isVendorVerified && <Ionicons name="checkmark-circle" size={14} color="#2F4A3C" />}
//                 </View>
//                 <Text style={styles.hostSub}>
//                   Hosted by {property.vendor_name}{property.contact_number ? ` · ${property.contact_number}` : ""}
//                 </Text>
//               </View>
//               {!!property.email && (
//                 <TouchableOpacity style={styles.hostIconBtn}>
//                   <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
//                 </TouchableOpacity>
//               )}
//             </View>
//           )}

//           {!!property.description && (
//             <>
//               <Text style={styles.description} numberOfLines={descExpanded ? undefined : 3}>
//                 {property.description}
//               </Text>
//               {property.description.length > 140 && (
//                 <TouchableOpacity onPress={() => setDescExpanded((v) => !v)}>
//                   <Text style={styles.readMore}>{descExpanded ? "Show less" : "Read more"}</Text>
//                 </TouchableOpacity>
//               )}
//             </>
//           )}
//         </View>

//         {/* Amenities */}
//         {amenities.length > 0 && (
//           <View style={styles.body} onLayout={onSectionLayout("amenities")}>
//             <Text style={styles.sectionTitle}>What this place offers</Text>
//             <View style={styles.amenityGrid}>
//               {previewAmenities.map((a) => (
//                 <View key={a.id} style={styles.amenityChip}>
//                   <Ionicons name={amenityIcon(a)} size={16} color={theme.colors.textPrimary} />
//                   <Text style={styles.amenityText}>{a.name}</Text>
//                 </View>
//               ))}
//             </View>
//             {amenities.length > 6 && (
//               <TouchableOpacity style={styles.showAllBtn} onPress={() => setAmenitiesExpanded((v) => !v)}>
//                 <Text style={styles.showAllBtnText}>
//                   {amenitiesExpanded ? "Show less" : `Show all ${amenities.length} amenities`}
//                 </Text>
//                 <Ionicons name={amenitiesExpanded ? "chevron-up" : "chevron-down"} size={13} color={theme.colors.primary} />
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         {/* Rooms — horizontal snap carousel */}
//         {rooms.length > 0 && (
//           <View onLayout={onSectionLayout("rooms")}>
//             <View style={styles.roomsHeaderRow}>
//               <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Rooms &amp; beds</Text>
//               <Text style={styles.roomsHeaderHint}>{nightsCount > 0 ? `${nightsCount} night${nightsCount !== 1 ? "s" : ""}` : "Pick dates"}</Text>
//             </View>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               snapToInterval={ROOM_CARD_WIDTH + ROOM_CARD_GAP}
//               decelerationRate="fast"
//               contentContainerStyle={{ paddingHorizontal: 20, gap: ROOM_CARD_GAP, paddingTop: 12 }}
//               onMomentumScrollEnd={(e) =>
//                 setRoomIndex(Math.round(e.nativeEvent.contentOffset.x / (ROOM_CARD_WIDTH + ROOM_CARD_GAP)))
//               }
//             >
//               {rooms.map((room) => (
//                 <View key={room.id} style={{ width: ROOM_CARD_WIDTH }}>
//                   <RoomCard
//                     room={room}
//                     nightsList={nightsList}
//                     adults={adults}
//                     isSelected={selectedRoomId === room.id}
//                     quantity={selectedRoomId === room.id ? selectedQuantity : 1}
//                     onQuantityChange={setSelectedQuantity}
//                     onSelect={() => handleSelectRoom(room)}
//                     selectedDormBedId={selectedRoomId === room.id ? selectedDormBedId : null}
//                     property={property}
//                     onSelectDormBed={(bedId) => handleSelectDormBed(room, bedId)}
//                   />
//                 </View>
//               ))}
//             </ScrollView>
//             {rooms.length > 1 && (
//               <View style={styles.dotsStatic}>
//                 {rooms.map((_, i) => (
//                   <View key={i} style={[styles.dot, styles.dotDark, i === roomIndex && styles.dotActiveDark]} />
//                 ))}
//               </View>
//             )}
//           </View>
//         )}

//         {/* House rules */}
//         {(property.smoking_allowed !== null && property.smoking_allowed !== undefined) && (
//           <View style={styles.body} onLayout={onSectionLayout("rules")}>
//             <Text style={styles.sectionTitle}>House rules</Text>
//             <View style={styles.ruleChipsWrap}>
//               <RuleChip label="Smoking" allowed={b(property.smoking_allowed)} icon="flame-outline" />
//               <RuleChip label="Pets" allowed={b(property.pets_allowed)} icon="paw-outline" />
//               <RuleChip label="Parties" allowed={b(property.parties_allowed)} icon="musical-notes-outline" />
//               <RuleChip label="Couples" allowed={b(property.couples_allowed)} icon="heart-outline" />
//               <RuleChip label="Children" allowed={b(property.children_allowed)} icon="happy-outline" />
//             </View>
//           </View>
//         )}

//         {/* Policies */}
//         {(property.cancellation_policy || property.house_rules || property.refund_policy) && (
//           <View style={styles.body} onLayout={onSectionLayout("policies")}>
//             <Text style={styles.sectionTitle}>Policies</Text>
//             <View style={styles.accordionCard}>
//               {!!property.cancellation_policy && <AccordionItem title="Cancellation" body={property.cancellation_policy} />}
//               {!!property.house_rules && <AccordionItem title="House rules (detailed)" body={property.house_rules} />}
//               {!!property.refund_policy && <AccordionItem title="Refunds" body={property.refund_policy} />}
//             </View>
//           </View>
//         )}
//       </Animated.ScrollView>

//       {/* Booking bar */}
//       <View style={[styles.bookBar, { paddingBottom: insets.bottom + 10 }]}>
//         <View style={{ flex: 1 }}>
//           {pricePreview ? (
//             <>
//               <Text style={styles.bookPrice}>
//                 {money(pricePreview.totalAmount)} <Text style={styles.bookPerNight}>total</Text>
//               </Text>
//               <Text style={styles.bookSub} numberOfLines={1}>
//                 {selectedRoom?.room_name} · {pricePreview.nights} night{pricePreview.nights !== 1 ? "s" : ""}
//               </Text>
//             </>
//           ) : (
//             <>
//               <Text style={styles.bookPrice}>
//                 {money(property.min_price)} <Text style={styles.bookPerNight}>/ night</Text>
//               </Text>
//               <Text style={styles.bookSub}>
//                 {!!property.max_price && property.max_price !== property.min_price
//                   ? `up to ${money(property.max_price)} for bigger rooms`
//                   : `${rooms.length} room type${rooms.length !== 1 ? "s" : ""} available`}
//               </Text>
//             </>
//           )}
//         </View>
//         <TouchableOpacity onPress={openReserveFlow} testID="reserve-btn">
//           <LinearGradient
//             colors={[theme.colors.primary, "#8C3A25"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.reserveBtn}
//           >
//             <Text style={styles.reserveText}>Reserve</Text>
//             <Ionicons name="arrow-forward" size={15} color="#fff" />
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>

//       {/* ---------------------------- Dates + guests modal ---------------------------- */}
//       <Modal visible={guestsModalVisible} animationType="slide" transparent onRequestClose={() => setGuestsModalVisible(false)}>
//         <View style={styles.sheetBackdrop}>
//           <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
//             <View style={styles.sheetHandle} />
//             <Text style={styles.sheetTitle}>Edit your stay</Text>

//             <View style={styles.dateRow}>
//               <TouchableOpacity style={styles.dateBox} onPress={() => setPickerTarget("in")}>
//                 <Text style={styles.dateBoxLabel}>CHECK-IN</Text>
//                 <Text style={styles.dateBoxValue}>{formatDatePretty(checkIn)}</Text>
//               </TouchableOpacity>
//               <Ionicons name="arrow-forward" size={16} color="#8A7F63" />
//               <TouchableOpacity style={styles.dateBox} onPress={() => setPickerTarget("out")}>
//                 <Text style={styles.dateBoxLabel}>CHECK-OUT</Text>
//                 <Text style={styles.dateBoxValue}>{formatDatePretty(checkOut)}</Text>
//               </TouchableOpacity>
//             </View>

//             {pickerTarget && (
//               <DateTimePicker
//                 value={pickerTarget === "in" ? checkIn : checkOut}
//                 mode="date"
//                 display={Platform.OS === "ios" ? "inline" : "default"}
//                 minimumDate={pickerTarget === "in" ? toDateOnly(new Date()) : addDays(checkIn, 1)}
//                 onChange={onChangeDate}
//               />
//             )}

//             <View style={styles.guestsBlock}>
//               <View style={styles.guestsRow}>
//                 <View>
//                   <Text style={styles.guestsRowLabel}>Adults</Text>
//                   <Text style={styles.guestsRowSub}>Ages 13+</Text>
//                 </View>
//                 <Stepper value={adults} onChange={setAdults} min={1} max={12} testIDPrefix="adults" />
//               </View>
//               <View style={styles.guestsRow}>
//                 <View>
//                   <Text style={styles.guestsRowLabel}>Children</Text>
//                   <Text style={styles.guestsRowSub}>Ages 0–12</Text>
//                 </View>
//                 <Stepper value={children} onChange={setChildren} min={0} max={8} testIDPrefix="children" />
//               </View>
//             </View>

//             <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={() => { setPickerTarget(null); setGuestsModalVisible(false); }}>
//               <Text style={styles.sheetPrimaryBtnText}>Done</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ------------------------------ Confirm / success modal ------------------------------ */}
//       <Modal visible={confirmVisible} animationType="slide" transparent onRequestClose={closeConfirmFlow}>
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={styles.sheetBackdrop}
//         >
//           <View style={[styles.sheet, { maxHeight: "88%", paddingBottom: insets.bottom + 20 }]}>
//             <View style={styles.sheetHandle} />

//             {bookingResult ? (
//               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingVertical: 8 }}>
//                 <View style={styles.successIconWrap}>
//                   <Ionicons name="checkmark" size={30} color="#fff" />
//                 </View>
//                 <Text style={styles.successTitle}>Booking requested!</Text>
//                 <Text style={styles.successSub}>
//                   {property.property_name} · {selectedRoom?.room_name}
//                 </Text>

//                 <View style={styles.successCard}>
//                   <View style={styles.successRow}>
//                     <Text style={styles.successRowLabel}>Booking number</Text>
//                     <Text style={styles.successRowValue}>{bookingResult.bookingNumber}</Text>
//                   </View>
//                   <View style={styles.successRow}>
//                     <Text style={styles.successRowLabel}>Dates</Text>
//                     <Text style={styles.successRowValue}>{formatDatePretty(checkIn)} – {formatDatePretty(checkOut)}</Text>
//                   </View>
//                   <View style={styles.successRow}>
//                     <Text style={styles.successRowLabel}>Total paid</Text>
//                     <Text style={styles.successRowValueBig}>{money(bookingResult.totalAmount)}</Text>
//                   </View>
//                   <Text style={styles.successNote}>Status: pending — payment comes next in your flow.</Text>
//                 </View>

//                 <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={resetSelectionAfterSuccess} testID="booking-done-btn">
//                   <Text style={styles.sheetPrimaryBtnText}>Done</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             ) : (
//               <ScrollView showsVerticalScrollIndicator={false}>
//                 <Text style={styles.sheetTitle}>Confirm your booking</Text>

//                 <View style={styles.summaryCard}>
//                   <Text style={styles.summaryPropertyName} numberOfLines={1}>{property.property_name}</Text>
//                   <Text style={styles.summaryRoomName}>{selectedRoom?.room_name}{isDormSelected ? " · Dorm bed" : ""}</Text>
//                   <View style={styles.summaryMetaRow}>
//                     <Ionicons name="calendar-outline" size={13} color="#5B6B60" />
//                     <Text style={styles.summaryMetaText}>
//                       {formatDatePretty(checkIn)} – {formatDatePretty(checkOut)} · {nightsCount} night{nightsCount !== 1 ? "s" : ""}
//                     </Text>
//                   </View>
//                   <View style={styles.summaryMetaRow}>
//                     <Ionicons name="people-outline" size={13} color="#5B6B60" />
//                     <Text style={styles.summaryMetaText}>
//                       {adults} adult{adults !== 1 ? "s" : ""}{children ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
//                       {!isDormSelected && selectedQuantity > 1 ? ` · ${selectedQuantity} rooms` : ""}
//                     </Text>
//                   </View>
//                 </View>

//                 {pricePreview && (
//                   <View style={styles.priceCard}>
//                     <View style={styles.priceRow}>
//                       <Text style={styles.priceRowLabel}>Subtotal</Text>
//                       <Text style={styles.priceRowValue}>{money(pricePreview.subtotal)}</Text>
//                     </View>
//                     {pricePreview.extraGuestAmount > 0 && (
//                       <View style={styles.priceRow}>
//                         <Text style={styles.priceRowLabel}>Extra guest fee</Text>
//                         <Text style={styles.priceRowValue}>{money(pricePreview.extraGuestAmount)}</Text>
//                       </View>
//                     )}
//                     <View style={styles.priceRow}>
//                       <Text style={styles.priceRowLabel}>Taxes</Text>
//                       <Text style={styles.priceRowValue}>{money(pricePreview.taxAmount)}</Text>
//                     </View>
//                     <View style={styles.priceDivider} />
//                     <View style={styles.priceRow}>
//                       <Text style={styles.priceRowLabelTotal}>Total</Text>
//                       <Text style={styles.priceRowValueTotal}>{money(pricePreview.totalAmount)}</Text>
//                     </View>
//                   </View>
//                 )}

//                 <Text style={styles.formLabel}>Contact details</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Full name"
//                   placeholderTextColor="#B8AF95"
//                   value={contactName}
//                   onChangeText={setContactName}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Phone number"
//                   placeholderTextColor="#B8AF95"
//                   keyboardType="phone-pad"
//                   value={contactPhone}
//                   onChangeText={setContactPhone}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Email (optional)"
//                   placeholderTextColor="#B8AF95"
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   value={contactEmail}
//                   onChangeText={setContactEmail}
//                 />
//                 <TextInput
//                   style={[styles.input, styles.inputMultiline]}
//                   placeholder="Special requests (optional)"
//                   placeholderTextColor="#B8AF95"
//                   multiline
//                   value={specialRequests}
//                   onChangeText={setSpecialRequests}
//                 />

//                 <TouchableOpacity
//                   style={[styles.sheetPrimaryBtn, submitting && { opacity: 0.7 }]}
//                   onPress={submitBooking}
//                   disabled={submitting}
//                   testID="confirm-booking-btn"
//                 >
//                   <Text style={styles.sheetPrimaryBtnText}>
//                     {submitting ? "Booking…" : `Confirm · ${money(pricePreview?.totalAmount)}`}
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.sheetSecondaryBtn} onPress={closeConfirmFlow} disabled={submitting}>
//                   <Text style={styles.sheetSecondaryBtnText}>Cancel</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             )}
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// }

// /* ---------------------------------- Styles --------------------------------- */

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: theme.colors.bg },
//   centered: { alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 30 },

//   topBar: {
//     position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
//     backgroundColor: "rgba(243,238,226,0.96)",
//     borderBottomWidth: 1, borderBottomColor: theme.colors.border,
//   },
//   topBarInner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
//   topBarCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
//   topBarTitle: { flex: 1, fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary, textAlign: "center" },

//   floatBar: { position: "absolute", left: 16, right: 16, zIndex: 10, flexDirection: "row", justifyContent: "space-between" },
//   circleBtn: {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: "rgba(20,26,22,0.38)",
//     alignItems: "center", justifyContent: "center",
//   },

//   heroImg: { width, height: HERO_HEIGHT },
//   heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: HERO_HEIGHT * 0.7 },
//   dots: { flexDirection: "row", justifyContent: "center", gap: 6, position: "absolute", top: HERO_HEIGHT - 108, left: 0, right: 0 },
//   dotsStatic: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
//   dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
//   dotActive: { backgroundColor: "#FFF", width: 16 },
//   dotDark: { backgroundColor: "#DCD4BC" },
//   dotActiveDark: { backgroundColor: theme.colors.primary, width: 16 },

//   heroOverlayContent: { position: "absolute", left: 20, right: 20, bottom: 22 },
//   heroBadgeRow: { flexDirection: "row", gap: 8 },
//   categoryBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
//   categoryText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1, color: "#fff" },
//   featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: "#FFD874" },
//   featuredText: { fontSize: 10.5, fontWeight: "800", color: "#1F2A24" },
//   heroTitle: { fontSize: 27, fontWeight: "800", color: "#fff", marginTop: 10, letterSpacing: -0.4, lineHeight: 32 },
//   heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, flexWrap: "wrap" },
//   heroMetaText: { fontSize: 12.5, color: "#F3EEE2", fontWeight: "700" },
//   heroDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#F3EEE2", marginHorizontal: 3 },

//   sectionNav: { marginTop: 14, maxHeight: 42 },
//   navPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
//   navPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
//   navPillText: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
//   navPillTextActive: { color: "#fff" },

//   body: { padding: 20 },

//   statBento: { flexDirection: "row", gap: 10, marginTop: 4 },
//   statCard: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
//   statCardValue: { fontSize: 13.5, fontWeight: "800", color: theme.colors.textPrimary },
//   statCardLabel: { fontSize: 10, color: "#8A7F63", fontWeight: "600" },

//   tripCard: {
//     flexDirection: "row", alignItems: "center", marginTop: 14, padding: 14, borderRadius: 16,
//     backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
//   },
//   tripCol: { flex: 1, gap: 3 },
//   tripLabel: { fontSize: 9, fontWeight: "800", color: "#8A7F63", letterSpacing: 0.5 },
//   tripValue: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
//   tripDivider: { width: 1, height: 28, backgroundColor: theme.colors.border, marginHorizontal: 8 },
//   tripEditIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg, marginLeft: 6 },

//   addressCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: "#EEF2EC" },
//   addressIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
//   addressText: { fontSize: 12.5, color: theme.colors.textPrimary, fontWeight: "600", lineHeight: 18 },
//   addressSub: { fontSize: 11, color: "#5B6B60", marginTop: 2 },

//   hostRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, paddingVertical: 6 },
//   hostAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#2F4A3C", alignItems: "center", justifyContent: "center" },
//   hostAvatarText: { color: "#F3EEE2", fontWeight: "800", fontSize: 17 },
//   hostName: { fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary },
//   hostSub: { fontSize: 11.5, color: "#8A7F63", marginTop: 2, fontWeight: "600" },
//   hostIconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },

//   description: { fontSize: 14, lineHeight: 21, color: "#5B6B60", marginTop: 16 },
//   readMore: { fontSize: 12.5, fontWeight: "800", color: theme.colors.primary, marginTop: 6 },

//   sectionTitle: { fontSize: 17.5, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
//   roomsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
//   roomsHeaderHint: { fontSize: 11.5, fontWeight: "700", color: "#8A7F63" },

//   amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   amenityChip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
//   amenityText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textPrimary },
//   showAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14, alignSelf: "flex-start" },
//   showAllBtnText: { fontSize: 12.5, fontWeight: "800", color: theme.colors.primary },

//   roomCard: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, overflow: "hidden" },
//   roomCardSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
//   roomImgWrap: { height: 140, position: "relative" },
//   roomImg: { width: "100%", height: "100%" },
//   roomImgGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60 },
//   roomCategoryBadge: { position: "absolute", top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: "rgba(20,26,22,0.55)" },
//   roomCategoryText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
//   roomPriceTag: { position: "absolute", bottom: 8, right: 10 },
//   roomPriceTagText: { fontSize: 13.5, fontWeight: "800", color: "#fff" },
//   roomSelectedBadge: { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },

//   roomBody: { padding: 13, gap: 4 },
//   roomName: { fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary },
//   roomType: { fontSize: 11, color: "#8A7F63", fontWeight: "600" },

//   roomFactsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
//   roomFact: { flexDirection: "row", alignItems: "center", gap: 4 },
//   roomFactText: { fontSize: 10.5, color: "#5B6B60", fontWeight: "600" },

//   roomTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
//   roomTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
//   roomTagText: { fontSize: 9.5, fontWeight: "700", color: "#4B5A4F" },

//   roomBeds: { fontSize: 11, color: "#5B6B60", marginTop: 8 },

//   dormList: { marginTop: 8, gap: 5 },
//   dormRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 7, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: "transparent" },
//   dormRowSelected: { borderColor: theme.colors.primary, backgroundColor: "#FBEFE9" },
//   dormRowDisabled: { opacity: 0.5 },
//   dormRowLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
//   dormLabel: { flex: 1, fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
//   dormStatus: { fontSize: 11, fontWeight: "800", color: "#2F4A3C" },
//   dormStatusOff: { color: "#A6472E", textTransform: "capitalize" },

//   qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
//   qtyLabel: { fontSize: 11.5, fontWeight: "700", color: theme.colors.textPrimary },

//   roomPreviewBox: { marginTop: 9, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "#EEF2EC" },
//   roomPreviewText: { fontSize: 11, fontWeight: "800", color: "#2F4A3C" },

//   selectRoomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
//   selectRoomBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
//   selectRoomBtnText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary },
//   selectRoomBtnTextActive: { color: "#fff" },

//   stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
//   stepperBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
//   stepperBtnDisabled: { opacity: 0.5 },
//   stepperValue: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, minWidth: 16, textAlign: "center" },

//   ruleChipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//   ruleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
//   ruleChipOn: { backgroundColor: "#EEF2EC" },
//   ruleChipOff: { backgroundColor: "#F7E9E5" },
//   ruleChipText: { fontSize: 12, fontWeight: "700" },

//   accordionCard: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14 },
//   accordionItem: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
//   accordionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
//   accordionTitle: { fontSize: 13.5, fontWeight: "700", color: theme.colors.textPrimary },
//   accordionBody: { fontSize: 12.5, lineHeight: 19, color: "#5B6B60", paddingBottom: 14 },

//   emptyTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 4 },
//   emptyText: { fontSize: 12, color: "#5B6B60", textAlign: "center", lineHeight: 17 },
//   retryBtn: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: theme.colors.primary },
//   retryBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

//   bookBar: {
//     position: "absolute", bottom: 0, left: 0, right: 0,
//     backgroundColor: theme.colors.surface,
//     borderTopWidth: 1, borderColor: theme.colors.border,
//     paddingHorizontal: 20, paddingTop: 14,
//     flexDirection: "row", justifyContent: "space-between", alignItems: "center",
//   },
//   bookPrice: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
//   bookPerNight: { fontSize: 13, fontWeight: "500", color: "#5B6B60" },
//   bookSub: { fontSize: 11, color: "#5B6B60", marginTop: 2 },
//   reserveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
//   reserveText: { color: "#fff", fontWeight: "800", fontSize: 14 },

//   /* ------------------------------- Modals / sheets ------------------------------- */
//   sheetBackdrop: { flex: 1, backgroundColor: "rgba(20,26,22,0.45)", justifyContent: "flex-end" },
//   sheet: { backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
//   sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: "center", marginBottom: 14 },
//   sheetTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 14 },

//   dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
//   dateBox: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
//   dateBoxLabel: { fontSize: 9, fontWeight: "800", color: "#8A7F63", letterSpacing: 0.5 },
//   dateBoxValue: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 4 },

//   guestsBlock: { marginTop: 18, gap: 4 },
//   guestsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
//   guestsRowLabel: { fontSize: 13.5, fontWeight: "700", color: theme.colors.textPrimary },
//   guestsRowSub: { fontSize: 10.5, color: "#8A7F63", marginTop: 2 },

//   sheetPrimaryBtn: { marginTop: 18, paddingVertical: 15, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: "center" },
//   sheetPrimaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
//   sheetSecondaryBtn: { marginTop: 10, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
//   sheetSecondaryBtnText: { color: "#8A7F63", fontWeight: "700", fontSize: 13 },

//   summaryCard: { padding: 14, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, gap: 6 },
//   summaryPropertyName: { fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
//   summaryRoomName: { fontSize: 12, fontWeight: "700", color: "#8A7F63" },
//   summaryMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
//   summaryMetaText: { fontSize: 11.5, color: "#5B6B60", fontWeight: "600" },

//   priceCard: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: "#EEF2EC", gap: 8 },
//   priceRow: { flexDirection: "row", justifyContent: "space-between" },
//   priceRowLabel: { fontSize: 12, color: "#4B5A4F", fontWeight: "600" },
//   priceRowValue: { fontSize: 12, color: "#2F4A3C", fontWeight: "700" },
//   priceDivider: { height: 1, backgroundColor: "rgba(47,74,60,0.15)", marginVertical: 2 },
//   priceRowLabelTotal: { fontSize: 13.5, color: "#1F2A24", fontWeight: "800" },
//   priceRowValueTotal: { fontSize: 15, color: "#1F2A24", fontWeight: "800" },

//   formLabel: { fontSize: 12.5, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 18, marginBottom: 8 },
//   input: {
//     borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
//     borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: theme.colors.textPrimary,
//     marginBottom: 10,
//   },
//   inputMultiline: { minHeight: 70, textAlignVertical: "top" },

//   successIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#2F4A3C", alignItems: "center", justifyContent: "center", marginTop: 10 },
//   successTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 14 },
//   successSub: { fontSize: 12.5, color: "#8A7F63", fontWeight: "600", marginTop: 4 },
//   successCard: { width: "100%", marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, gap: 10 },
//   successRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   successRowLabel: { fontSize: 12, color: "#8A7F63", fontWeight: "600" },
//   successRowValue: { fontSize: 12.5, color: theme.colors.textPrimary, fontWeight: "800" },
//   successRowValueBig: { fontSize: 17, color: theme.colors.primary, fontWeight: "800" },
//   successNote: { fontSize: 10.5, color: "#8A7F63", marginTop: 4 },
// });



import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Animated,
  Easing,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// npx expo install expo-linear-gradient  (ships with the Expo SDK by default)
import { LinearGradient } from "expo-linear-gradient";
// npx expo install @react-native-community/datetimepicker
import DateTimePicker from "@react-native-community/datetimepicker";
import { theme } from "../../src/theme";
import { api } from "@/src/api";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 420;
const ROOM_CARD_WIDTH = width * 0.78;
const ROOM_CARD_GAP = 14;

/* ---------------------------------------------------------------------
   Adjust these to match wherever your backend actually serves uploads.
   property_images.image -> `${IMAGE_BASE_URL}/{property_id}/{image}`
   room_images.image      -> `${ROOM_IMAGE_BASE_URL}/{room_id}/{image}`
--------------------------------------------------------------------- */
const IMAGE_BASE_URL = "https://server.prostayz.com/uploads/properties";
const ROOM_IMAGE_BASE_URL = "http://192.168.1.59:51234/uploads/rooms";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80";

// Adjust this if createBooking isn't mounted at the bare /bookings path.
const BOOKING_ENDPOINT = "/bookings";

type IoniconName = keyof typeof Ionicons.glyphMap;

/* ------------------------------- API shape ---------------------------------
   Mirrors getPropertyDetails exactly: flat `property` row (with joined
   vendor / address / policy / rule columns), plus sibling arrays.
------------------------------------------------------------------------- */

interface RawProperty {
  id: number;
  vendor_id: number;
  property_type_id: number;
  property_name: string;
  slug: string;
  description: string | null;
  star_rating: number;
  contact_name: string | null;
  contact_number: string | null;
  email: string | null;
  website: string | null;
  check_in: string | null;
  check_out: string | null;
  total_rooms: number;
  min_price: number | null;
  max_price: number | null;
  status: string;
  is_featured: number | boolean;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null;
  vendor_name: string | null;
  vendor_business_name: string | null;
  vendor_email: string | null;
  vendor_phone: string | null;
  vendor_status: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  pincode: string | null;
  landmark: string | null;
  cancellation_policy: string | null;
  house_rules: string | null;
  refund_policy: string | null;
  smoking_allowed: number | boolean | null;
  pets_allowed: number | boolean | null;
  parties_allowed: number | boolean | null;
  couples_allowed: number | boolean | null;
  children_allowed: number | boolean | null;
  completed_percentage: number | null;
  is_completed: number | boolean | null;
}

interface PropertyImage {
  id: number;
  image: string;
  is_cover: number | boolean;
  sort_order: number;
}

interface Amenity {
  id: number;
  name: string;
  icon: string | null;
}

interface RoomBed {
  bed_type: string;
  quantity: number;
}

interface RoomDormBed {
  id: number;
  bed_label: string;
  bed_type: string;
  status: "available" | "blocked" | "maintenance";
  price: number;
}

interface RoomImage {
  id: number;
  room_id: number;
  image: string;
  is_cover: number | boolean;
  sort_order: number;
}

interface RoomPrice {
  price: number;
  weekend_price: number | null;
  extra_guest_price: number | null;
  tax: number | null;
}

interface Room {
  id: number;
  room_name: string;
  room_type: string | null;
  room_category: "private" | "dorm" | "whole_property";
  max_adults: number | null;
  max_children: number | null;
  total_rooms: number | null;
  available_rooms: number | null;
  room_size: number | null;
  room_size_unit: "sqft" | "sqm" | null;
  private_bathroom: number | boolean | null;
  balcony: number | boolean | null;
  air_conditioning: number | boolean | null;
  description: string | null;
  beds: RoomBed[];
  dorm_beds: RoomDormBed[];
  images: RoomImage[];
  price: RoomPrice | null;
}

interface ApiResponse {
  success: boolean;
  property: RawProperty;
  images: PropertyImage[];
  amenities: Amenity[];
  rooms: Room[];
}

interface BookingResultData {
  bookingId: number;
  bookingNumber: string;
  subtotal: number;
  extraGuestAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

/* --------------------------------- Helpers ---------------------------------- */

const LUCIDE_TO_IONICON: Record<string, IoniconName> = {
  Wifi: "wifi-outline",
  Car: "car-outline",
  Snowflake: "snow-outline",
  Tv: "tv-outline",
  Waves: "water-outline",
  Dumbbell: "barbell-outline",
  Utensils: "restaurant-outline",
  Coffee: "cafe-outline",
  Brush: "brush-outline",
  ShieldCheck: "shield-checkmark-outline",
  Wind: "cloud-outline",
  Lock: "lock-closed-outline",
};

function amenityIcon(a: Amenity): IoniconName {
  if (a.icon && LUCIDE_TO_IONICON[a.icon]) return LUCIDE_TO_IONICON[a.icon];
  return "checkmark-circle-outline";
}

const TYPE_ICON_BY_NAME: Record<string, IoniconName> = {
  villa: "home",
  apartment: "business",
  hostel: "people",
  luxury: "diamond",
};

function formatTime(t: string | null): string | null {
  if (!t) return null;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return null;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

function money(n: number | null | undefined): string {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

const b = (v: number | boolean | null | undefined) => Boolean(v);

/* ---------------------- Client-side pricing preview ----------------------
   Mirrors utils/pricing.js so the UI can show a live total before hitting
   the server. The server remains the source of truth at booking time.
--------------------------------------------------------------------- */

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateToStr(d: Date): string {
  // Build the string from local calendar fields — never go through
  // toISOString() here, since that converts to UTC and can silently
  // shift the date backward or forward by a day depending on the
  // device's timezone offset (e.g. IST is UTC+5:30).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function getNightsListClient(checkIn: Date, checkOut: Date): string[] {
  const nights: string[] = [];
  let cur = toDateOnly(checkIn);
  const end = toDateOnly(checkOut);
  while (cur < end) {
    nights.push(dateToStr(cur));
    cur = addDays(cur, 1);
  }
  return nights;
}

function isWeekendStr(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

function formatDatePretty(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

interface PricePreview {
  subtotal: number;
  extraGuestAmount: number;
  taxAmount: number;
  totalAmount: number;
  nights: number;
}

function computeRoomPreview(room: Room, nightsList: string[], adults: number, quantity: number): PricePreview | null {
  if (!room.price) return null;
  const nights = nightsList.length;
  if (nights <= 0) return null;

  let subtotal = 0;
  for (const date of nightsList) {
    subtotal += isWeekendStr(date) ? Number(room.price.weekend_price ?? room.price.price) : Number(room.price.price);
  }
  const extraAdults = Math.max(0, adults - (room.max_adults ?? adults));
  const extraGuestAmount = extraAdults * Number(room.price.extra_guest_price || 0) * nights;
  const taxable = subtotal + extraGuestAmount;
  const taxAmount = +(taxable * (Number(room.price.tax || 0) / 100)).toFixed(2);

  return {
    subtotal: +(subtotal * quantity).toFixed(2),
    extraGuestAmount: +(extraGuestAmount * quantity).toFixed(2),
    taxAmount: +(taxAmount * quantity).toFixed(2),
    totalAmount: +((subtotal + extraGuestAmount + taxAmount) * quantity).toFixed(2),
    nights,
  };
}

function computeDormPreview(room: Room, bedId: number, nightsList: string[]): PricePreview | null {
  const bed = room.dorm_beds.find((db) => db.id === bedId);
  if (!bed || !room.price) return null;
  const nights = nightsList.length;
  if (nights <= 0) return null;
  const subtotal = Number(bed.price) * nights;
  const taxAmount = +(subtotal * (Number(room.price.tax || 0) / 100)).toFixed(2);
  return {
    subtotal: +subtotal.toFixed(2),
    extraGuestAmount: 0,
    taxAmount,
    totalAmount: +(subtotal + taxAmount).toFixed(2),
    nights,
  };
}

/* ------------------------------ Skeleton loader ------------------------------ */

function Shimmer({ style }: { style: any }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[style, { opacity: pulse }]} />;
}

function DetailSkeleton({ insetTop }: { insetTop: number }) {
  return (
    <View style={styles.container}>
      <Shimmer style={{ width, height: HERO_HEIGHT, backgroundColor: "#E7E0CC" }} />
      <View style={{ padding: 20, gap: 12 }}>
        <Shimmer style={{ width: "45%", height: 14, borderRadius: 7, backgroundColor: "#E7E0CC" }} />
        <Shimmer style={{ width: "80%", height: 26, borderRadius: 8, backgroundColor: "#E7E0CC" }} />
        <Shimmer style={{ width: "60%", height: 14, borderRadius: 7, backgroundColor: "#E7E0CC" }} />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} style={{ flex: 1, height: 64, borderRadius: 14, backgroundColor: "#E7E0CC" }} />
          ))}
        </View>
        <Shimmer style={{ width: "100%", height: 90, borderRadius: 14, backgroundColor: "#E7E0CC", marginTop: 14 }} />
      </View>
    </View>
  );
}

/* -------------------------------- Stepper ------------------------------------ */

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  testIDPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        testID={testIDPrefix ? `${testIDPrefix}-minus` : undefined}
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Ionicons name="remove" size={15} color={value <= min ? "#B8AF95" : theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity
        testID={testIDPrefix ? `${testIDPrefix}-plus` : undefined}
        style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Ionicons name="add" size={15} color={value >= max ? "#B8AF95" : theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

/* --------------------------------- Room card -------------------------------- */

function RoomCard({
  room,
  nightsList,
  adults,
  isSelected,
  quantity,
  onQuantityChange,
  onSelect,
  selectedDormBedId,
  onSelectDormBed,
}: {
  room: Room;
  nightsList: string[];
  adults: number;
  isSelected: boolean;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onSelect: () => void;
  selectedDormBedId: number | null;
  onSelectDormBed: (bedId: number) => void;
}) {
  const cover = room.images?.find((i) => b(i.is_cover)) ?? room.images?.[0];
  const imageUri = cover ? `${ROOM_IMAGE_BASE_URL}/${room.id}/${cover.image}` : FALLBACK_IMAGE;
  const isDorm = room.room_category === "dorm";
  const cheapestDorm = isDorm
    ? room.dorm_beds.filter((d) => d.status === "available").sort((a, c) => a.price - c.price)[0]
    : null;

  const preview = isDorm
    ? selectedDormBedId
      ? computeDormPreview(room, selectedDormBedId, nightsList)
      : null
    : computeRoomPreview(room, nightsList, adults, quantity);

  const maxQty = Math.max(1, room.available_rooms ?? 1);

  return (
    <View style={[styles.roomCard, isSelected && styles.roomCardSelected]}>
      <View style={styles.roomImgWrap}>
        <Image source={{ uri: imageUri }} style={styles.roomImg} />
        <LinearGradient colors={["transparent", "rgba(20,26,22,0.65)"]} style={styles.roomImgGradient} />
        <View style={styles.roomCategoryBadge}>
          <Text style={styles.roomCategoryText}>
            {room.room_category === "whole_property" ? "ENTIRE PLACE" : room.room_category === "dorm" ? "DORM" : "PRIVATE"}
          </Text>
        </View>
        {(room.price || cheapestDorm) && (
          <View style={styles.roomPriceTag}>
            <Text style={styles.roomPriceTagText}>
              {isDorm ? `from ${money(cheapestDorm?.price)}` : money(room.price?.price)}
            </Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.roomSelectedBadge}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.roomBody}>
        <Text style={styles.roomName} numberOfLines={1}>{room.room_name}</Text>
        {!!room.room_type && <Text style={styles.roomType}>{room.room_type}</Text>}

        <View style={styles.roomFactsRow}>
          {room.max_adults != null && (
            <View style={styles.roomFact}>
              <Ionicons name="people-outline" size={12.5} color="#5B6B60" />
              <Text style={styles.roomFactText}>
                {room.max_adults}{room.max_children ? `+${room.max_children}` : ""}
              </Text>
            </View>
          )}
          {room.room_size != null && (
            <View style={styles.roomFact}>
              <Ionicons name="resize-outline" size={12.5} color="#5B6B60" />
              <Text style={styles.roomFactText}>{room.room_size} {room.room_size_unit ?? "sqft"}</Text>
            </View>
          )}
          {room.available_rooms != null && (
            <View style={styles.roomFact}>
              <Ionicons name="checkmark-done-outline" size={12.5} color="#5B6B60" />
              <Text style={styles.roomFactText}>{room.available_rooms} left</Text>
            </View>
          )}
        </View>

        <View style={styles.roomTagsRow}>
          {b(room.private_bathroom) && (
            <View style={styles.roomTag}><Ionicons name="water-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>Private bath</Text></View>
          )}
          {b(room.balcony) && (
            <View style={styles.roomTag}><Ionicons name="sunny-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>Balcony</Text></View>
          )}
          {b(room.air_conditioning) && (
            <View style={styles.roomTag}><Ionicons name="snow-outline" size={10.5} color="#4B5A4F" /><Text style={styles.roomTagText}>AC</Text></View>
          )}
        </View>

        {!isDorm && room.beds?.length > 0 && (
          <Text style={styles.roomBeds}>{room.beds.map((bd) => `${bd.quantity} × ${bd.bed_type}`).join(" · ")}</Text>
        )}

        {isDorm && room.dorm_beds?.length > 0 && (
          <View style={styles.dormList}>
            {room.dorm_beds.map((bed) => {
              const bedSelected = selectedDormBedId === bed.id;
              const bedAvailable = bed.status === "available";
              return (
                <TouchableOpacity
                  key={bed.id}
                  disabled={!bedAvailable}
                  onPress={() => onSelectDormBed(bed.id)}
                  style={[
                    styles.dormRow,
                    bedSelected && styles.dormRowSelected,
                    !bedAvailable && styles.dormRowDisabled,
                  ]}
                >
                  <View style={styles.dormRowLeft}>
                    <Ionicons
                      name={bedSelected ? "radio-button-on" : "radio-button-off"}
                      size={14}
                      color={bedSelected ? theme.colors.primary : bedAvailable ? "#8A7F63" : "#C9C1AA"}
                    />
                    <Text style={styles.dormLabel} numberOfLines={1}>{bed.bed_label}</Text>
                  </View>
                  <Text style={[styles.dormStatus, !bedAvailable && styles.dormStatusOff]}>
                    {bedAvailable ? money(bed.price) : bed.status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!isDorm && isSelected && (room.total_rooms ?? 1) > 1 && (
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Rooms</Text>
            <Stepper value={quantity} onChange={onQuantityChange} min={1} max={maxQty} testIDPrefix={`qty-${room.id}`} />
          </View>
        )}

        {preview && nightsList.length > 0 && (
          <View style={styles.roomPreviewBox}>
            <Text style={styles.roomPreviewText}>
              {money(preview.totalAmount)} total · {preview.nights} night{preview.nights !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.selectRoomBtn, isSelected && styles.selectRoomBtnActive]}
          onPress={onSelect}
          testID={`select-room-${room.id}`}
        >
          <Text style={[styles.selectRoomBtnText, isSelected && styles.selectRoomBtnTextActive]}>
            {isSelected ? "Selected" : "Select room"}
          </Text>
          <Ionicons
            name={isSelected ? "checkmark-circle" : "arrow-forward"}
            size={13}
            color={isSelected ? "#fff" : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ------------------------------- Rule chip row ------------------------------- */

function RuleChip({ label, allowed, icon }: { label: string; allowed: boolean; icon: IoniconName }) {
  return (
    <View style={[styles.ruleChip, allowed ? styles.ruleChipOn : styles.ruleChipOff]}>
      <Ionicons name={icon} size={13} color={allowed ? "#2F4A3C" : "#A6472E"} />
      <Text style={[styles.ruleChipText, { color: allowed ? "#2F4A3C" : "#A6472E" }]}>{label}</Text>
      <Ionicons name={allowed ? "checkmark" : "close"} size={12} color={allowed ? "#2F4A3C" : "#A6472E"} />
    </View>
  );
}

/* ------------------------------- Accordion item ------------------------------ */

function AccordionItem({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(rotate, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: true }).start();
    setOpen((o) => !o);
  };

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity style={styles.accordionHead} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="chevron-down" size={17} color="#5B6B60" />
        </Animated.View>
      </TouchableOpacity>
      {open && <Text style={styles.accordionBody}>{body}</Text>}
    </View>
  );
}

/* --------------------------------- Screen ----------------------------------- */

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "rooms", label: "Rooms" },
  { key: "amenities", label: "Amenities" },
  { key: "rules", label: "House rules" },
  { key: "policies", label: "Policies" },
] as const;

export default function StayDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [property, setProperty] = useState<RawProperty | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imgIndex, setImgIndex] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const [wished, setWished] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const navScrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  /* ------------------------------- Booking state ------------------------------- */
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(toDateOnly(new Date()), 1));
  const [checkOut, setCheckOut] = useState<Date>(() => addDays(toDateOnly(new Date()), 2));
  const [pickerTarget, setPickerTarget] = useState<"in" | "out" | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsModalVisible, setGuestsModalVisible] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDormBedId, setSelectedDormBedId] = useState<number | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResultData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust this path if your route isn't mounted under /user.
      const json: ApiResponse = await api(`/admin/properties/${id}`, { method: "GET" });
      setProperty(json.property);
      setImages(json.images ?? []);
      setAmenities(json.amenities ?? []);
      setRooms(json.rooms ?? []);
    } catch (e: any) {
      setError(e.message || "Couldn't load this stay.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (property) {
      setContactName((prev) => prev || property.contact_name || "");
      setContactPhone((prev) => prev || property.contact_number || "");
    }
  }, [property]);

  const handleSave = () => {
    // TODO: wire to POST /user/wishlist/toggle once the wishlist API is ready.
    setWished((w) => !w);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 20 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 14 }),
    ]).start();
  };

  const onSectionLayout = (key: string) => (e: LayoutChangeEvent) => {
    sectionOffsets.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToSection = (key: string) => {
    setActiveSection(key);
    const y = sectionOffsets.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    let closest = "overview";
    let closestDist = Infinity;
    Object.entries(sectionOffsets.current).forEach(([key, offset]) => {
      const dist = Math.abs(offset - y - 60);
      if (dist < closestDist) {
        closestDist = dist;
        closest = key;
      }
    });
    if (closest !== activeSection) setActiveSection(closest);
  };

  const sortedImages = useMemo(
    () => [...images].sort((a, c) => (b(a.is_cover) === b(c.is_cover) ? a.sort_order - c.sort_order : b(a.is_cover) ? -1 : 1)),
    [images]
  );
  const galleryUris = sortedImages.length
    ? sortedImages.map((img) => `${IMAGE_BASE_URL}/${property?.id}/${img.image}`)
    : [FALLBACK_IMAGE];

  const topBarOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 140, HERO_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  /* ----------------------------- Booking derived state ----------------------------- */

  const nightsList = useMemo(() => getNightsListClient(checkIn, checkOut), [checkIn, checkOut]);
  const nightsCount = nightsList.length;

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);
  const isDormSelected = selectedRoom?.room_category === "dorm";

  const pricePreview = useMemo(() => {
    if (!selectedRoom) return null;
    if (isDormSelected) {
      if (!selectedDormBedId) return null;
      return computeDormPreview(selectedRoom, selectedDormBedId, nightsList);
    }
    return computeRoomPreview(selectedRoom, nightsList, adults, selectedQuantity);
  }, [selectedRoom, isDormSelected, selectedDormBedId, nightsList, adults, selectedQuantity]);

  const canReserve = Boolean(
    selectedRoom &&
    nightsCount > 0 &&
    (!isDormSelected || selectedDormBedId) &&
    pricePreview &&
    pricePreview.totalAmount > 0
  );

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId((prev) => (prev === room.id ? null : room.id));
    setSelectedQuantity(1);
    setSelectedDormBedId(null);
  };

  const handleSelectDormBed = (room: Room, bedId: number) => {
    setSelectedRoomId(room.id);
    setSelectedDormBedId((prev) => (prev === bedId ? null : bedId));
  };

  const onChangeDate = (event: any, picked?: Date) => {
    const target = pickerTarget;
    setPickerTarget(Platform.OS === "ios" ? pickerTarget : null);
    if (event?.type === "dismissed" || !picked) return;

    const chosen = toDateOnly(picked);
    if (target === "in") {
      setCheckIn(chosen);
      if (toDateOnly(checkOut) <= chosen) setCheckOut(addDays(chosen, 1));
    } else if (target === "out") {
      if (chosen <= toDateOnly(checkIn)) {
        Alert.alert("Invalid date", "Check-out must be after check-in.");
        return;
      }
      setCheckOut(chosen);
    }
  };

  const openReserveFlow = () => {
    if (!selectedRoom) {
      Alert.alert("Pick a room", "Select a room or dorm bed before reserving.");
      scrollToSection("rooms");
      return;
    }
    if (isDormSelected && !selectedDormBedId) {
      Alert.alert("Pick a bed", "Select an available dorm bed to continue.");
      return;
    }
    if (nightsCount <= 0) {
      Alert.alert("Pick your dates", "Choose a check-in and check-out date.");
      setGuestsModalVisible(true);
      return;
    }
    setConfirmVisible(true);
  };

  const submitBooking = async () => {
    if (!property || !selectedRoom) return;
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Missing details", "Please add a contact name and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        propertyId: property.id,
        roomId: selectedRoom.id,
        dormBedId: isDormSelected ? selectedDormBedId : undefined,
        quantity: isDormSelected ? 1 : selectedQuantity,
        checkInDate: dateToStr(checkIn),
        checkOutDate: dateToStr(checkOut),
        adults,
        children,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
      };

      // If your api() helper expects a raw object instead of a pre-stringified
      // body, drop the JSON.stringify below.
      const res = await api(BOOKING_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data: BookingResultData = res.data;
      setBookingResult(data);
    } catch (e: any) {
      Alert.alert("Couldn't book this stay", e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeConfirmFlow = () => {
    setConfirmVisible(false);
    setBookingResult(null);
  };

  const resetSelectionAfterSuccess = () => {
    setConfirmVisible(false);
    setBookingResult(null);
    setSelectedRoomId(null);
    setSelectedDormBedId(null);
    setSelectedQuantity(1);
    setSpecialRequests("");
  };

  if (loading) return <DetailSkeleton insetTop={insets.top} />;

  if (error || !property) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={26} color="#A6472E" />
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptyText}>{error ?? "Stay not found."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeIcon = TYPE_ICON_BY_NAME[property.property_type?.toLowerCase() ?? ""] ?? "home";
  const locationLine = [property.area, property.city, property.state].filter(Boolean).join(", ");
  const checkInTime = formatTime(property.check_in);
  const checkOutTime = formatTime(property.check_out);
  const isVendorVerified = property.vendor_status === "active";

  const previewAmenities = amenitiesExpanded ? amenities : amenities.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Animated glass top bar (fades in once you scroll past the hero) */}
      <Animated.View style={[styles.topBar, { opacity: topBarOpacity, paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.topBarInner}>
          <TouchableOpacity style={styles.topBarCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={19} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{property.property_name}</Text>
          <TouchableOpacity style={styles.topBarCircle} onPress={handleSave}>
            <Ionicons name={wished ? "heart" : "heart-outline"} size={17} color={wished ? "#A6472E" : theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Floating buttons over the hero, always visible */}
      <View style={[styles.floatBar, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()} testID="back-btn">
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={styles.circleBtn}>
            <Ionicons name="share-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={handleSave} testID="stay-save-btn">
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={wished ? "heart" : "heart-outline"} size={18} color={wished ? "#FF6B57" : "#fff"} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onMainScroll}
        contentContainerStyle={{ paddingBottom: 170 }}
      >
        {/* Hero gallery with title overlaid */}
        <View style={{ height: HERO_HEIGHT }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {galleryUris.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.heroImg} />
            ))}
          </ScrollView>
          <LinearGradient colors={["rgba(20,26,22,0.05)", "rgba(20,26,22,0.75)"]} style={styles.heroGradient} pointerEvents="none" />

          {galleryUris.length > 1 && (
            <View style={styles.dots}>
              {galleryUris.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.heroOverlayContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name={typeIcon} size={12} color="#fff" />
                <Text style={styles.categoryText}>{property.property_type?.toUpperCase()}</Text>
              </View>
              {b(property.is_featured) && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="sparkles" size={11} color="#1F2A24" />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{property.property_name}</Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="star" size={13} color="#FFD874" />
              <Text style={styles.heroMetaText}>{property.star_rating?.toFixed(1) ?? "New"}</Text>
              {!!locationLine && (
                <>
                  <View style={styles.heroDot} />
                  <Ionicons name="location-outline" size={12} color="#F3EEE2" />
                  <Text style={styles.heroMetaText} numberOfLines={1}>{locationLine}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Sticky-feeling section nav */}
        <ScrollView
          ref={navScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionNav}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => scrollToSection(s.key)}
              style={[styles.navPill, activeSection === s.key && styles.navPillActive]}
            >
              <Text style={[styles.navPillText, activeSection === s.key && styles.navPillTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.body} onLayout={onSectionLayout("overview")}>
          {/* Quick stat bento */}
          <View style={styles.statBento}>
            <View style={styles.statCard}>
              <Ionicons name="bed-outline" size={17} color={theme.colors.primary} />
              <Text style={styles.statCardValue}>{property.total_rooms}</Text>
              <Text style={styles.statCardLabel}>room{property.total_rooms !== 1 ? "s" : ""}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="log-in-outline" size={17} color={theme.colors.primary} />
              <Text style={styles.statCardValue}>{checkInTime ?? "—"}</Text>
              <Text style={styles.statCardLabel}>check-in</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="log-out-outline" size={17} color={theme.colors.primary} />
              <Text style={styles.statCardValue}>{checkOutTime ?? "—"}</Text>
              <Text style={styles.statCardLabel}>check-out</Text>
            </View>
          </View>

          {/* Trip planner card — dates + guests, tap to edit */}
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => setGuestsModalVisible(true)}
            testID="edit-trip-btn"
          >
            <View style={styles.tripCol}>
              <Text style={styles.tripLabel}>CHECK-IN</Text>
              <Text style={styles.tripValue}>{formatDatePretty(checkIn)}</Text>
            </View>
            <View style={styles.tripDivider} />
            <View style={styles.tripCol}>
              <Text style={styles.tripLabel}>CHECK-OUT</Text>
              <Text style={styles.tripValue}>{formatDatePretty(checkOut)}</Text>
            </View>
            <View style={styles.tripDivider} />
            <View style={styles.tripCol}>
              <Text style={styles.tripLabel}>GUESTS</Text>
              <Text style={styles.tripValue}>
                {adults} adult{adults !== 1 ? "s" : ""}{children ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
              </Text>
            </View>
            <View style={styles.tripEditIcon}>
              <Ionicons name="pencil" size={13} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>

          {property.address && (
            <View style={styles.addressCard}>
              <View style={styles.addressIconWrap}>
                <Ionicons name="map-outline" size={16} color="#2F4A3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressText}>{property.address}</Text>
                {!!property.landmark && <Text style={styles.addressSub}>{property.landmark}</Text>}
                {!!property.pincode && <Text style={styles.addressSub}>PIN {property.pincode} · {[property.city, property.state, property.country].filter(Boolean).join(", ")}</Text>}
              </View>
            </View>
          )}

          {/* Host / vendor trust block */}
          {(property.vendor_business_name || property.vendor_name) && (
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>{(property.vendor_business_name ?? property.vendor_name ?? "H")[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.hostName} numberOfLines={1}>{property.vendor_business_name ?? property.vendor_name}</Text>
                  {isVendorVerified && <Ionicons name="checkmark-circle" size={14} color="#2F4A3C" />}
                </View>
                <Text style={styles.hostSub}>
                  Hosted by {property.vendor_name}{property.contact_number ? ` · ${property.contact_number}` : ""}
                </Text>
              </View>
              {!!property.email && (
                <TouchableOpacity style={styles.hostIconBtn}>
                  <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!!property.description && (
            <>
              <Text style={styles.description} numberOfLines={descExpanded ? undefined : 3}>
                {property.description}
              </Text>
              {property.description.length > 140 && (
                <TouchableOpacity onPress={() => setDescExpanded((v) => !v)}>
                  <Text style={styles.readMore}>{descExpanded ? "Show less" : "Read more"}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.body} onLayout={onSectionLayout("amenities")}>
            <Text style={styles.sectionTitle}>What this place offers</Text>
            <View style={styles.amenityGrid}>
              {previewAmenities.map((a) => (
                <View key={a.id} style={styles.amenityChip}>
                  <Ionicons name={amenityIcon(a)} size={16} color={theme.colors.textPrimary} />
                  <Text style={styles.amenityText}>{a.name}</Text>
                </View>
              ))}
            </View>
            {amenities.length > 6 && (
              <TouchableOpacity style={styles.showAllBtn} onPress={() => setAmenitiesExpanded((v) => !v)}>
                <Text style={styles.showAllBtnText}>
                  {amenitiesExpanded ? "Show less" : `Show all ${amenities.length} amenities`}
                </Text>
                <Ionicons name={amenitiesExpanded ? "chevron-up" : "chevron-down"} size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Rooms — horizontal snap carousel */}
        {rooms.length > 0 && (
          <View onLayout={onSectionLayout("rooms")}>
            <View style={styles.roomsHeaderRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Rooms &amp; beds</Text>
              <Text style={styles.roomsHeaderHint}>{nightsCount > 0 ? `${nightsCount} night${nightsCount !== 1 ? "s" : ""}` : "Pick dates"}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ROOM_CARD_WIDTH + ROOM_CARD_GAP}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: ROOM_CARD_GAP, paddingTop: 12 }}
              onMomentumScrollEnd={(e) =>
                setRoomIndex(Math.round(e.nativeEvent.contentOffset.x / (ROOM_CARD_WIDTH + ROOM_CARD_GAP)))
              }
            >
              {rooms.map((room) => (
                <View key={room.id} style={{ width: ROOM_CARD_WIDTH }}>
                  <RoomCard
                    room={room}
                    nightsList={nightsList}
                    adults={adults}
                    isSelected={selectedRoomId === room.id}
                    quantity={selectedRoomId === room.id ? selectedQuantity : 1}
                    onQuantityChange={setSelectedQuantity}
                    onSelect={() => handleSelectRoom(room)}
                    selectedDormBedId={selectedRoomId === room.id ? selectedDormBedId : null}
                    onSelectDormBed={(bedId) => handleSelectDormBed(room, bedId)}
                  />
                </View>
              ))}
            </ScrollView>
            {rooms.length > 1 && (
              <View style={styles.dotsStatic}>
                {rooms.map((_, i) => (
                  <View key={i} style={[styles.dot, styles.dotDark, i === roomIndex && styles.dotActiveDark]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* House rules */}
        {(property.smoking_allowed !== null && property.smoking_allowed !== undefined) && (
          <View style={styles.body} onLayout={onSectionLayout("rules")}>
            <Text style={styles.sectionTitle}>House rules</Text>
            <View style={styles.ruleChipsWrap}>
              <RuleChip label="Smoking" allowed={b(property.smoking_allowed)} icon="flame-outline" />
              <RuleChip label="Pets" allowed={b(property.pets_allowed)} icon="paw-outline" />
              <RuleChip label="Parties" allowed={b(property.parties_allowed)} icon="musical-notes-outline" />
              <RuleChip label="Couples" allowed={b(property.couples_allowed)} icon="heart-outline" />
              <RuleChip label="Children" allowed={b(property.children_allowed)} icon="happy-outline" />
            </View>
          </View>
        )}

        {/* Policies */}
        {(property.cancellation_policy || property.house_rules || property.refund_policy) && (
          <View style={styles.body} onLayout={onSectionLayout("policies")}>
            <Text style={styles.sectionTitle}>Policies</Text>
            <View style={styles.accordionCard}>
              {!!property.cancellation_policy && <AccordionItem title="Cancellation" body={property.cancellation_policy} />}
              {!!property.house_rules && <AccordionItem title="House rules (detailed)" body={property.house_rules} />}
              {!!property.refund_policy && <AccordionItem title="Refunds" body={property.refund_policy} />}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Booking bar */}
      <View style={[styles.bookBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={{ flex: 1 }}>
          {pricePreview ? (
            <>
              <Text style={styles.bookPrice}>
                {money(pricePreview.totalAmount)} <Text style={styles.bookPerNight}>total</Text>
              </Text>
              <Text style={styles.bookSub} numberOfLines={1}>
                {selectedRoom?.room_name} · {pricePreview.nights} night{pricePreview.nights !== 1 ? "s" : ""}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.bookPrice}>
                {money(property.min_price)} <Text style={styles.bookPerNight}>/ night</Text>
              </Text>
              <Text style={styles.bookSub}>
                {!!property.max_price && property.max_price !== property.min_price
                  ? `up to ${money(property.max_price)} for bigger rooms`
                  : `${rooms.length} room type${rooms.length !== 1 ? "s" : ""} available`}
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity onPress={openReserveFlow} testID="reserve-btn">
          <LinearGradient
            colors={[theme.colors.primary, "#8C3A25"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.reserveBtn}
          >
            <Text style={styles.reserveText}>Reserve</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ---------------------------- Dates + guests modal ---------------------------- */}
      <Modal visible={guestsModalVisible} animationType="slide" transparent onRequestClose={() => setGuestsModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit your stay</Text>

            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setPickerTarget("in")}>
                <Text style={styles.dateBoxLabel}>CHECK-IN</Text>
                <Text style={styles.dateBoxValue}>{formatDatePretty(checkIn)}</Text>
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={16} color="#8A7F63" />
              <TouchableOpacity style={styles.dateBox} onPress={() => setPickerTarget("out")}>
                <Text style={styles.dateBoxLabel}>CHECK-OUT</Text>
                <Text style={styles.dateBoxValue}>{formatDatePretty(checkOut)}</Text>
              </TouchableOpacity>
            </View>

            {pickerTarget && (
              <DateTimePicker
                value={pickerTarget === "in" ? checkIn : checkOut}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={pickerTarget === "in" ? toDateOnly(new Date()) : addDays(checkIn, 1)}
                onChange={onChangeDate}
              />
            )}

            <View style={styles.guestsBlock}>
              <View style={styles.guestsRow}>
                <View>
                  <Text style={styles.guestsRowLabel}>Adults</Text>
                  <Text style={styles.guestsRowSub}>Ages 13+</Text>
                </View>
                <Stepper value={adults} onChange={setAdults} min={1} max={12} testIDPrefix="adults" />
              </View>
              <View style={styles.guestsRow}>
                <View>
                  <Text style={styles.guestsRowLabel}>Children</Text>
                  <Text style={styles.guestsRowSub}>Ages 0–12</Text>
                </View>
                <Stepper value={children} onChange={setChildren} min={0} max={8} testIDPrefix="children" />
              </View>
            </View>

            <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={() => { setPickerTarget(null); setGuestsModalVisible(false); }}>
              <Text style={styles.sheetPrimaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ------------------------------ Confirm / success modal ------------------------------ */}
      <Modal visible={confirmVisible} animationType="slide" transparent onRequestClose={closeConfirmFlow}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetBackdrop}
        >
          <View style={[styles.sheet, { maxHeight: "88%", paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />

            {bookingResult ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingVertical: 8 }}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark" size={30} color="#fff" />
                </View>
                <Text style={styles.successTitle}>Booking requested!</Text>
                <Text style={styles.successSub}>
                  {property.property_name} · {selectedRoom?.room_name}
                </Text>

                <View style={styles.successCard}>
                  <View style={styles.successRow}>
                    <Text style={styles.successRowLabel}>Booking number</Text>
                    <Text style={styles.successRowValue}>{bookingResult.bookingNumber}</Text>
                  </View>
                  <View style={styles.successRow}>
                    <Text style={styles.successRowLabel}>Dates</Text>
                    <Text style={styles.successRowValue}>{formatDatePretty(checkIn)} – {formatDatePretty(checkOut)}</Text>
                  </View>
                  <View style={styles.successRow}>
                    <Text style={styles.successRowLabel}>Total paid</Text>
                    <Text style={styles.successRowValueBig}>{money(bookingResult.totalAmount)}</Text>
                  </View>
                  <Text style={styles.successNote}>Status: pending — payment comes next in your flow.</Text>
                </View>

                <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={resetSelectionAfterSuccess} testID="booking-done-btn">
                  <Text style={styles.sheetPrimaryBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetTitle}>Confirm your booking</Text>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryPropertyName} numberOfLines={1}>{property.property_name}</Text>
                  <Text style={styles.summaryRoomName}>{selectedRoom?.room_name}{isDormSelected ? " · Dorm bed" : ""}</Text>
                  <View style={styles.summaryMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#5B6B60" />
                    <Text style={styles.summaryMetaText}>
                      {formatDatePretty(checkIn)} – {formatDatePretty(checkOut)} · {nightsCount} night{nightsCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.summaryMetaRow}>
                    <Ionicons name="people-outline" size={13} color="#5B6B60" />
                    <Text style={styles.summaryMetaText}>
                      {adults} adult{adults !== 1 ? "s" : ""}{children ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
                      {!isDormSelected && selectedQuantity > 1 ? ` · ${selectedQuantity} rooms` : ""}
                    </Text>
                  </View>
                </View>

                {pricePreview && (
                  <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>Subtotal</Text>
                      <Text style={styles.priceRowValue}>{money(pricePreview.subtotal)}</Text>
                    </View>
                    {pricePreview.extraGuestAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceRowLabel}>Extra guest fee</Text>
                        <Text style={styles.priceRowValue}>{money(pricePreview.extraGuestAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>Taxes</Text>
                      <Text style={styles.priceRowValue}>{money(pricePreview.taxAmount)}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                      <Text style={styles.priceRowLabelTotal}>Total</Text>
                      <Text style={styles.priceRowValueTotal}>{money(pricePreview.totalAmount)}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.formLabel}>Contact details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#B8AF95"
                  value={contactName}
                  onChangeText={setContactName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor="#B8AF95"
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  placeholderTextColor="#B8AF95"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                />
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Special requests (optional)"
                  placeholderTextColor="#B8AF95"
                  multiline
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                />

                <TouchableOpacity
                  style={[styles.sheetPrimaryBtn, submitting && { opacity: 0.7 }]}
                  onPress={submitBooking}
                  disabled={submitting}
                  testID="confirm-booking-btn"
                >
                  <Text style={styles.sheetPrimaryBtnText}>
                    {submitting ? "Booking…" : `Confirm · ${money(pricePreview?.totalAmount)}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetSecondaryBtn} onPress={closeConfirmFlow} disabled={submitting}>
                  <Text style={styles.sheetSecondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ---------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 30 },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: "rgba(243,238,226,0.96)",
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  topBarInner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  topBarCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  topBarTitle: { flex: 1, fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary, textAlign: "center" },

  floatBar: { position: "absolute", left: 16, right: 16, zIndex: 10, flexDirection: "row", justifyContent: "space-between" },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(20,26,22,0.38)",
    alignItems: "center", justifyContent: "center",
  },

  heroImg: { width, height: HERO_HEIGHT },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: HERO_HEIGHT * 0.7 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, position: "absolute", top: HERO_HEIGHT - 108, left: 0, right: 0 },
  dotsStatic: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#FFF", width: 16 },
  dotDark: { backgroundColor: "#DCD4BC" },
  dotActiveDark: { backgroundColor: theme.colors.primary, width: 16 },

  heroOverlayContent: { position: "absolute", left: 20, right: 20, bottom: 22 },
  heroBadgeRow: { flexDirection: "row", gap: 8 },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  categoryText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1, color: "#fff" },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: "#FFD874" },
  featuredText: { fontSize: 10.5, fontWeight: "800", color: "#1F2A24" },
  heroTitle: { fontSize: 27, fontWeight: "800", color: "#fff", marginTop: 10, letterSpacing: -0.4, lineHeight: 32 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, flexWrap: "wrap" },
  heroMetaText: { fontSize: 12.5, color: "#F3EEE2", fontWeight: "700" },
  heroDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#F3EEE2", marginHorizontal: 3 },

  sectionNav: { marginTop: 14, maxHeight: 42 },
  navPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  navPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  navPillText: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  navPillTextActive: { color: "#fff" },

  body: { padding: 20 },

  statBento: { flexDirection: "row", gap: 10, marginTop: 4 },
  statCard: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  statCardValue: { fontSize: 13.5, fontWeight: "800", color: theme.colors.textPrimary },
  statCardLabel: { fontSize: 10, color: "#8A7F63", fontWeight: "600" },

  tripCard: {
    flexDirection: "row", alignItems: "center", marginTop: 14, padding: 14, borderRadius: 16,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  tripCol: { flex: 1, gap: 3 },
  tripLabel: { fontSize: 9, fontWeight: "800", color: "#8A7F63", letterSpacing: 0.5 },
  tripValue: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  tripDivider: { width: 1, height: 28, backgroundColor: theme.colors.border, marginHorizontal: 8 },
  tripEditIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg, marginLeft: 6 },

  addressCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: "#EEF2EC" },
  addressIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  addressText: { fontSize: 12.5, color: theme.colors.textPrimary, fontWeight: "600", lineHeight: 18 },
  addressSub: { fontSize: 11, color: "#5B6B60", marginTop: 2 },

  hostRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, paddingVertical: 6 },
  hostAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#2F4A3C", alignItems: "center", justifyContent: "center" },
  hostAvatarText: { color: "#F3EEE2", fontWeight: "800", fontSize: 17 },
  hostName: { fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary },
  hostSub: { fontSize: 11.5, color: "#8A7F63", marginTop: 2, fontWeight: "600" },
  hostIconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },

  description: { fontSize: 14, lineHeight: 21, color: "#5B6B60", marginTop: 16 },
  readMore: { fontSize: 12.5, fontWeight: "800", color: theme.colors.primary, marginTop: 6 },

  sectionTitle: { fontSize: 17.5, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  roomsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  roomsHeaderHint: { fontSize: 11.5, fontWeight: "700", color: "#8A7F63" },

  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  amenityText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textPrimary },
  showAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14, alignSelf: "flex-start" },
  showAllBtnText: { fontSize: 12.5, fontWeight: "800", color: theme.colors.primary },

  roomCard: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, overflow: "hidden" },
  roomCardSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  roomImgWrap: { height: 140, position: "relative" },
  roomImg: { width: "100%", height: "100%" },
  roomImgGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60 },
  roomCategoryBadge: { position: "absolute", top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: "rgba(20,26,22,0.55)" },
  roomCategoryText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  roomPriceTag: { position: "absolute", bottom: 8, right: 10 },
  roomPriceTagText: { fontSize: 13.5, fontWeight: "800", color: "#fff" },
  roomSelectedBadge: { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },

  roomBody: { padding: 13, gap: 4 },
  roomName: { fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary },
  roomType: { fontSize: 11, color: "#8A7F63", fontWeight: "600" },

  roomFactsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  roomFact: { flexDirection: "row", alignItems: "center", gap: 4 },
  roomFactText: { fontSize: 10.5, color: "#5B6B60", fontWeight: "600" },

  roomTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  roomTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
  roomTagText: { fontSize: 9.5, fontWeight: "700", color: "#4B5A4F" },

  roomBeds: { fontSize: 11, color: "#5B6B60", marginTop: 8 },

  dormList: { marginTop: 8, gap: 5 },
  dormRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 7, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: "transparent" },
  dormRowSelected: { borderColor: theme.colors.primary, backgroundColor: "#FBEFE9" },
  dormRowDisabled: { opacity: 0.5 },
  dormRowLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  dormLabel: { flex: 1, fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  dormStatus: { fontSize: 11, fontWeight: "800", color: "#2F4A3C" },
  dormStatusOff: { color: "#A6472E", textTransform: "capitalize" },

  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  qtyLabel: { fontSize: 11.5, fontWeight: "700", color: theme.colors.textPrimary },

  roomPreviewBox: { marginTop: 9, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "#EEF2EC" },
  roomPreviewText: { fontSize: 11, fontWeight: "800", color: "#2F4A3C" },

  selectRoomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
  selectRoomBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  selectRoomBtnText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary },
  selectRoomBtnTextActive: { color: "#fff" },

  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
  stepperBtnDisabled: { opacity: 0.5 },
  stepperValue: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, minWidth: 16, textAlign: "center" },

  ruleChipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ruleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  ruleChipOn: { backgroundColor: "#EEF2EC" },
  ruleChipOff: { backgroundColor: "#F7E9E5" },
  ruleChipText: { fontSize: 12, fontWeight: "700" },

  accordionCard: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14 },
  accordionItem: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  accordionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  accordionTitle: { fontSize: 13.5, fontWeight: "700", color: theme.colors.textPrimary },
  accordionBody: { fontSize: 12.5, lineHeight: 19, color: "#5B6B60", paddingBottom: 14 },

  emptyTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 4 },
  emptyText: { fontSize: 12, color: "#5B6B60", textAlign: "center", lineHeight: 17 },
  retryBtn: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: theme.colors.primary },
  retryBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  bookBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 20, paddingTop: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  bookPrice: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  bookPerNight: { fontSize: 13, fontWeight: "500", color: "#5B6B60" },
  bookSub: { fontSize: 11, color: "#5B6B60", marginTop: 2 },
  reserveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  reserveText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  /* ------------------------------- Modals / sheets ------------------------------- */
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(20,26,22,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: "center", marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 14 },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateBox: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  dateBoxLabel: { fontSize: 9, fontWeight: "800", color: "#8A7F63", letterSpacing: 0.5 },
  dateBoxValue: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 4 },

  guestsBlock: { marginTop: 18, gap: 4 },
  guestsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  guestsRowLabel: { fontSize: 13.5, fontWeight: "700", color: theme.colors.textPrimary },
  guestsRowSub: { fontSize: 10.5, color: "#8A7F63", marginTop: 2 },

  sheetPrimaryBtn: { marginTop: 18, paddingVertical: 15, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: "center" },
  sheetPrimaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  sheetSecondaryBtn: { marginTop: 10, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  sheetSecondaryBtnText: { color: "#8A7F63", fontWeight: "700", fontSize: 13 },

  summaryCard: { padding: 14, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, gap: 6 },
  summaryPropertyName: { fontSize: 14, fontWeight: "800", color: theme.colors.textPrimary },
  summaryRoomName: { fontSize: 12, fontWeight: "700", color: "#8A7F63" },
  summaryMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  summaryMetaText: { fontSize: 11.5, color: "#5B6B60", fontWeight: "600" },

  priceCard: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: "#EEF2EC", gap: 8 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceRowLabel: { fontSize: 12, color: "#4B5A4F", fontWeight: "600" },
  priceRowValue: { fontSize: 12, color: "#2F4A3C", fontWeight: "700" },
  priceDivider: { height: 1, backgroundColor: "rgba(47,74,60,0.15)", marginVertical: 2 },
  priceRowLabelTotal: { fontSize: 13.5, color: "#1F2A24", fontWeight: "800" },
  priceRowValueTotal: { fontSize: 15, color: "#1F2A24", fontWeight: "800" },

  formLabel: { fontSize: 12.5, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 18, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },

  successIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#2F4A3C", alignItems: "center", justifyContent: "center", marginTop: 10 },
  successTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 14 },
  successSub: { fontSize: 12.5, color: "#8A7F63", fontWeight: "600", marginTop: 4 },
  successCard: { width: "100%", marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, gap: 10 },
  successRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  successRowLabel: { fontSize: 12, color: "#8A7F63", fontWeight: "600" },
  successRowValue: { fontSize: 12.5, color: theme.colors.textPrimary, fontWeight: "800" },
  successRowValueBig: { fontSize: 17, color: theme.colors.primary, fontWeight: "800" },
  successNote: { fontSize: 10.5, color: "#8A7F63", marginTop: 4 },
});


