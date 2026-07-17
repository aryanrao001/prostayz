import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { theme } from "../../src/theme";
import { api } from "@/src/api";

/* ---------------------------------------------------------------------
   Config — replace with your real values.

   npx expo install expo-location react-native-maps

   app.json also needs a Google Maps key for the map tiles to render:
     "android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } },
     "ios": { "config": { "googleMapsApiKey": "YOUR_KEY" } }
--------------------------------------------------------------------- */

const IMAGE_BASE_URL = "https://server.prostayz.com/uploads/properties"; // matches property_images.image
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // used for reverse geocoding (Geocoding API)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80";

// Drop your logo's URL here (PNG/SVG-as-PNG, square works best, ~120x120+).
// Leave null to show the placeholder monogram badge instead.
const LOGO_URL: string | null = null;

// ---------------------------------------------------------------------
// Brand palette — sampled directly from the Prostayz logo's sage green
// (#B5D985). primary is a deepened version for text/icon contrast (AA
// compliant on white); primaryLight is the exact logo hue for soft fills.
// ---------------------------------------------------------------------
const BRAND = {
  primary: "#637749", // deep sage — CTAs, active states, icons, links
  primaryLight: "#B5D985", // exact logo green — badges, underlines, glows
  primarySoft: "#EEF3E3", // pale tint — icon-circle / chip backgrounds
  primaryDeep: "#3A4A2C", // near-black green — logo placeholder, strong fills
};

type IoniconName = keyof typeof Ionicons.glyphMap;

// property_types are fixed reference data on your schema, safe to keep client-side.
const PROPERTY_TYPES: { id: number; name: string; icon: IoniconName }[] = [
  { id: 2, name: "Villa", icon: "home-outline" },
  { id: 3, name: "Apartment", icon: "business-outline" },
  { id: 4, name: "Hostel", icon: "people-outline" },
  { id: 7, name: "Luxury", icon: "diamond-outline" },
];
const TYPE_ICON_BY_NAME: Record<string, IoniconName> = PROPERTY_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.name.toLowerCase()]: t.icon }),
  {}
);

// amenities.name -> icon, mirrors your `amenities` table's own `icon` column.
const AMENITY_ICON_BY_NAME: Record<string, IoniconName> = {
  "Free WiFi": "wifi",
  Parking: "car",
  "Air Conditioning": "snow",
  Television: "tv",
  "Swimming Pool": "water",
  Gym: "fitness",
  Restaurant: "restaurant",
  "Breakfast Included": "cafe",
  "Daily Housekeeping": "brush",
  "24x7 Security": "shield-checkmark",
};

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Any price" },
  { label: "Under 1,000", max: 1000 },
  { label: "1,000 – 3,000", min: 1000, max: 3000 },
  { label: "3,000 – 5,000", min: 3000, max: 5000 },
  { label: "5,000+", min: 5000 },
];

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price_low", label: "Price: Low to High" },
  { key: "price_high", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
];

/* --------------------------------- Types ---------------------------------- */

interface ApiProperty {
  id: number;
  property_name: string;
  slug: string;
  star_rating: number;
  min_price: number;
  max_price: number;
  total_rooms: number;
  check_in: string;
  check_out: string;
  area: string;
  city: string;
  state: string;
  country: string;
  property_type_id: number;
  property_type_name: string;
  cover_image: string | null;
  amenities: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------- Small helpers ----------------------------- */

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name="star" size={11} color={i < rating ? "#B08D3E" : "#E4DCC8"} />
      ))}
    </View>
  );
}

// Returns a time-of-day greeting + matching icon. Purely cosmetic — swap the
// copy for whatever tone fits your brand.
function getGreeting(): { text: string; icon: IoniconName } {
  const h = new Date().getHours();
  if (h < 5) return { text: "Still up?", icon: "moon" };
  if (h < 12) return { text: "Good morning", icon: "sunny" };
  if (h < 17) return { text: "Good afternoon", icon: "partly-sunny" };
  if (h < 21) return { text: "Good evening", icon: "cloudy-night" };
  return { text: "Good night", icon: "moon" };
}

/* --------------------------------- Motion bits ------------------------------ */

// Gentle infinite pulse — used for the greeting icon and the Luxury sparkle.
function Pulse({
  name,
  size = 12,
  color = BRAND.primary,
}: {
  name: IoniconName;
  size?: number;
  color?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.16] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

// Fades + slides each card up into place, staggered by its list index.
function AnimatedEntrance({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// Little radiating hearts that fire once when triggerKey increments.
const BURST_ANGLES_DEG = [-70, -35, 0, 35, 70, 105];

function HeartBurst({ triggerKey }: { triggerKey: number }) {
  const particles = useRef(BURST_ANGLES_DEG.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (triggerKey === 0) return;
    particles.forEach((p) => p.setValue(0));
    Animated.stagger(
      22,
      particles.map((p) =>
        Animated.timing(p, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  return (
    <>
      {particles.map((p, i) => {
        const angle = (BURST_ANGLES_DEG[i] * Math.PI) / 180;
        const distance = 24;
        const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] });
        const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance - 8] });
        const opacity = p.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
        const scale = p.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[styles.burstParticle, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
          >
            <Ionicons name="heart" size={10} color={BRAND.primary} />
          </Animated.View>
        );
      })}
    </>
  );
}

// Shimmering placeholder shown while the first page of results is loading.
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-240, 240] });

  return (
    <View style={[styles.card, { overflow: "hidden" }]}>
      <View style={[styles.cardMedia, { backgroundColor: theme.colors.border }]} />
      <View style={styles.cardBody}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineNarrow} />
        <View style={styles.skeletonLineMed} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.skeletonShimmer, { transform: [{ translateX }] }]} />
    </View>
  );
}

/* ----------------------------------- Logo ----------------------------------- */

function BrandLogo() {
  if (LOGO_URL) {
    return (
      <View style={styles.logoWrap}>
        <Image source={{ uri: LOGO_URL }} style={styles.logoImg} resizeMode="contain" />
      </View>
    );
  }
  // Placeholder monogram — swap LOGO_URL above once you have real artwork.
  return (
    <View style={[styles.logoWrap, styles.logoPlaceholder]}>
      <Text style={styles.logoPlaceholderText}>PZ</Text>
    </View>
  );
}

/* ------------------------------ Category tabs ------------------------------- */
// Airbnb-style: icon + label, no boxes/borders — just a slim animated
// underline that fades/slides in under whichever tab is active.

function CategoryTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IoniconName;
  active: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, anim]);

  return (
    <TouchableOpacity style={styles.categoryTab} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={active ? BRAND.primary : "#9A9186"} />
      <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text>
      <Animated.View style={[styles.categoryUnderline, { opacity: anim, transform: [{ scaleX: anim }] }]} />
    </TouchableOpacity>
  );
}

/* --------------------------------- Card ------------------------------------ */

function PropertyCard({
  item,
  isWished,
  onToggleWish,
  onPress,
}: {
  item: ApiProperty;
  isWished: boolean;
  onToggleWish: (id: number) => void;
  onPress: () => void;
}) {
  const typeIcon = TYPE_ICON_BY_NAME[item.property_type_name?.toLowerCase()] ?? "home-outline";
  const isLuxury = item.property_type_name?.toLowerCase() === "luxury";
  const imageUri = item.cover_image ? `${IMAGE_BASE_URL}/${item.id}/${item.cover_image}` : FALLBACK_IMAGE;
  const shownAmenities = item.amenities.slice(0, 4);
  const extraAmenities = item.amenities.length - shownAmenities.length;

  // Fires the heart-burst + a spring "pop" whenever the card flips to wished.
  const [burstKey, setBurstKey] = useState(0);
  const wasWished = useRef(isWished);
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isWished && !wasWished.current) {
      setBurstKey((k) => k + 1);
      heartScale.setValue(0.7);
      Animated.spring(heartScale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }).start();
    }
    wasWished.current = isWished;
  }, [isWished, heartScale]);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.cardMedia}>
        <Image source={{ uri: imageUri }} style={styles.cardImg} />
        <View style={styles.cardGradient} />
        <View style={styles.stampBadge}>
          <Ionicons name={typeIcon} size={14} color={BRAND.primary} />
        </View>
        {isLuxury && (
          <View style={styles.luxuryBadge}>
            <Pulse name="sparkles" size={12} color="#B08D3E" />
          </View>
        )}

        <View style={styles.heartBtnWrap}>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleWish(item.id);
            }}
            testID={`wishlist-${item.id}`}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={isWished ? "heart" : "heart-outline"} size={16} color={BRAND.primary} />
            </Animated.View>
          </TouchableOpacity>
          <HeartBurst triggerKey={burstKey} />
        </View>

        <View style={styles.roomsBadge}>
          <Ionicons name="bed-outline" size={11} color="#F3EEE2" />
          <Text style={styles.roomsBadgeText}>{item.total_rooms} rooms</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.property_name}</Text>
          <Stars rating={item.star_rating} />
        </View>

        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary ?? "#5B6B60"} />
          <Text style={styles.locText} numberOfLines={1}>
            {[item.area, item.city, item.state, item.country].filter(Boolean).join(", ")}
          </Text>
        </View>

        {item.amenities.length > 0 && (
          <View style={styles.amenityRow}>
            {shownAmenities.map((name) => (
              <View style={styles.amenityChip} key={name}>
                <Ionicons name={AMENITY_ICON_BY_NAME[name] ?? "ellipse-outline"} size={13} color="#4B5A4F" />
              </View>
            ))}
            {extraAmenities > 0 && (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityMore}>+{extraAmenities}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardBottomRow}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <Text style={styles.priceLabel}>from</Text>
            <Text style={styles.priceValue}>₹{Number(item.min_price ?? 0).toLocaleString()}</Text>
            <Text style={styles.priceLabel}>/ night</Text>
          </View>
          <View style={styles.detailsCta}>
            <Text style={styles.detailsCtaText}>Details</Text>
            <Ionicons name="chevron-forward" size={13} color={BRAND.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* --------------------------------- Screen ----------------------------------- */

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const greeting = getGreeting();

  // ---- Location bar state ----
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ---- Filter state ----
  const [activeType, setActiveType] = useState<number | "all">("all");
  const [activeLocation, setActiveLocation] = useState<string | "all">("all");
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const [priceIndex, setPriceIndex] = useState(0); // index into PRICE_PRESETS
  const [sortBy, setSortBy] = useState("newest");
  const [filtersVisible, setFiltersVisible] = useState(false);

  // ---- Results state ----
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Wishlist + UI state ----
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [wishlistVisible, setWishlistVisible] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  /* ------------------------------ Location fetch ----------------------------- */

  const fetchLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied");
        setLocationLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      // Reverse geocode via Google Maps Geocoding API.
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const json = await res.json();
        const components = json?.results?.[0]?.address_components ?? [];
        const city =
          components.find((c: any) => c.types.includes("locality"))?.long_name ??
          components.find((c: any) => c.types.includes("administrative_area_level_2"))?.long_name;
        const region = components.find((c: any) => c.types.includes("administrative_area_level_1"))?.long_name;
        setLocationLabel([city, region].filter(Boolean).join(", ") || "Current location");
      } catch {
        // Fall back to the device's built-in geocoder if the Google API call fails
        // (e.g. missing/invalid key) so the bar still shows something useful.
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationLabel([place?.city, place?.region].filter(Boolean).join(", ") || "Current location");
      }
    } catch (err) {
      setLocationError("Couldn't get your location");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  /* ------------------------------ Properties fetch ---------------------------- */

  const fetchProperties = useCallback(
    async (targetPage: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const preset = PRICE_PRESETS[priceIndex];
      const params = new URLSearchParams();
      if (activeType !== "all") params.append("type", String(activeType));
      if (activeLocation !== "all") params.append("location", activeLocation);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (preset.min !== undefined) params.append("min_price", String(preset.min));
      if (preset.max !== undefined) params.append("max_price", String(preset.max));
      params.append("sort", sortBy);
      params.append("page", String(targetPage));
      params.append("limit", "10");

      try {
        const json = await api(`/user/properties?${params.toString()}`, {
          method: "GET",
        });

        setProperties((prev) => (append ? [...prev, ...json.data] : json.data));
        setPagination(json.pagination);
        setPage(targetPage);

        setLocationOptions((prev) => {
          const next = new Set(prev);
          (json.data as ApiProperty[]).forEach((p) => p.city && next.add(p.city));
          return Array.from(next);
        });
      } catch (err: any) {
        setError(err.message || "Couldn't load stays. Pull down to try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [activeType, activeLocation, debouncedSearch, priceIndex, sortBy]
  );

  // Re-fetch page 1 whenever a filter changes.
  useEffect(() => {
    fetchProperties(1, false);
    return () => abortRef.current?.abort();
  }, [activeType, activeLocation, debouncedSearch, priceIndex, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (!pagination || loadingMore) return;
    if (pagination.page >= pagination.totalPages) return;
    fetchProperties(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocation();
    fetchProperties(1, false);
  };

  const clearFilters = () => {
    setActiveType("all");
    setActiveLocation("all");
    setSearchQuery("");
    setPriceIndex(0);
    setSortBy("newest");
  };

  const hasActiveFilters =
    activeType !== "all" || activeLocation !== "all" || !!searchQuery || priceIndex !== 0 || sortBy !== "newest";

  // Counts only what lives inside the Filters sheet (location/price/sort) —
  // property type has its own tabs now, so it isn't counted here.
  const sheetFilterCount =
    (activeLocation !== "all" ? 1 : 0) + (priceIndex !== 0 ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  const toggleWish = (id: number) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const wishedProperties = properties.filter((p) => wishlist.has(p.id));
  const resultsCount = pagination?.total ?? properties.length;

  /* ---------------------------------- Render ---------------------------------- */

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
      >
        {/* Brand bar — logo + wordmark + time-aware greeting */}
        <View style={styles.brandBar}>
          <View style={styles.brandBarLeft}>
            <BrandLogo />
            <View style={{ marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Pulse name={greeting.icon} size={11} />
                <Text style={styles.overline}>{greeting.text.toUpperCase()}</Text>
              </View>
              <Text style={styles.brand}>Find your next stay</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.wishHeaderBtn} onPress={() => setWishlistVisible(true)} testID="home-wishlist">
            <Ionicons name={wishlist.size ? "heart" : "heart-outline"} size={19} color={BRAND.primary} />
            {wishlist.size > 0 && (
              <View style={styles.wishBadge}>
                <Text style={styles.wishBadgeText}>{wishlist.size}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Live location bar */}
        <View style={styles.locationBar}>
          <TouchableOpacity style={styles.locationContent} onPress={fetchLocation} activeOpacity={0.8}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-sharp" size={18} color={BRAND.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.locationTitle}>Home</Text>
                <Ionicons name="chevron-down" size={14} color="#8A7F63" style={{ marginLeft: 4 }} />
              </View>

              {locationLoading ? (
                <Text style={styles.locationAddress}>Detecting your location…</Text>
              ) : (
                <Text numberOfLines={1} style={styles.locationAddress}>
                  {locationLabel}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Search + Filters trigger */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="#8A7F63" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stays, areas, cities…"
              placeholderTextColor="#8A7F63"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#8A7F63" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.filterBtn} onPress={() => setFiltersVisible(true)} testID="open-filters">
            <Ionicons name="options-outline" size={18} color={theme.colors.textPrimary} />
            {sheetFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{sheetFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Airbnb-style category tabs — property type only, no boxes, centered */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryTab label="All" icon="apps-outline" active={activeType === "all"} onPress={() => setActiveType("all")} />
          {PROPERTY_TYPES.map((t) => (
            <CategoryTab
              key={t.id}
              label={t.name}
              icon={t.icon}
              active={activeType === t.id}
              onPress={() => setActiveType(t.id)}
            />
          ))}
        </ScrollView>

        {/* Results row */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {loading ? "Searching…" : (
              <>
                <Text style={styles.resultsCount}>{resultsCount}</Text> stay{resultsCount !== 1 ? "s" : ""} found
              </>
            )}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Listings */}
        {loading ? (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={22} color={BRAND.primary} />
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProperties(1, false)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : properties.length > 0 ? (
          <View style={styles.list}>
            {properties.map((item, idx) => (
              <AnimatedEntrance key={item.id} index={idx}>
                <PropertyCard
                  item={item}
                  isWished={wishlist.has(item.id)}
                  onToggleWish={toggleWish}
                  onPress={() => router.push(`/stay/${item.id}` as any)}
                />
              </AnimatedEntrance>
            ))}
            {pagination && pagination.page < pagination.totalPages && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={BRAND.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more stays</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={22} color={BRAND.primary} />
            <Text style={styles.emptyTitle}>No stays match yet</Text>
            <Text style={styles.emptyText}>Try a different type, city, or price range — or clear filters to see everything.</Text>
          </View>
        )}
      </ScrollView>

      {/* Filters bottom sheet — location, price, sort */}
      <Modal visible={filtersVisible} animationType="slide" transparent onRequestClose={() => setFiltersVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setFiltersVisible(false)} />
        <View style={[styles.filtersSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.filtersSheetHead}>
            <Text style={styles.filtersSheetTitle}>Filters</Text>
            <TouchableOpacity style={styles.drawerClose} onPress={() => setFiltersVisible(false)}>
              <Ionicons name="close" size={16} color="#3A423B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionLabel}>LOCATION</Text>
            <View style={styles.filterWrapRow}>
              <TouchableOpacity
                style={[styles.filterPill, activeLocation === "all" && styles.filterPillActive]}
                onPress={() => setActiveLocation("all")}
              >
                <Text style={[styles.filterPillText, activeLocation === "all" && styles.filterPillTextActive]}>All cities</Text>
              </TouchableOpacity>
              {locationOptions.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterPill, activeLocation === loc && styles.filterPillActive]}
                  onPress={() => setActiveLocation(loc)}
                >
                  <Text style={[styles.filterPillText, activeLocation === loc && styles.filterPillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionLabel}>PRICE PER NIGHT</Text>
            <View style={styles.filterWrapRow}>
              {PRICE_PRESETS.map((preset, i) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.filterPill, priceIndex === i && styles.filterPillActive]}
                  onPress={() => setPriceIndex(i)}
                >
                  <Text style={[styles.filterPillText, priceIndex === i && styles.filterPillTextActive]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionLabel}>SORT BY</Text>
            <View style={styles.filterWrapRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterPill, sortBy === opt.key && styles.filterPillActive]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Text style={[styles.filterPillText, sortBy === opt.key && styles.filterPillTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filtersSheetFooter}>
            <TouchableOpacity
              onPress={() => {
                setActiveLocation("all");
                setPriceIndex(0);
                setSortBy("newest");
              }}
            >
              <Text style={styles.clearAllLink}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.showResultsBtn} onPress={() => setFiltersVisible(false)}>
              <Text style={styles.showResultsBtnText}>
                {loading ? "Show stays" : `Show ${resultsCount} stay${resultsCount !== 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wishlist bottom sheet */}
      <Modal visible={wishlistVisible} animationType="slide" transparent onRequestClose={() => setWishlistVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setWishlistVisible(false)} />
        <View style={[styles.drawer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.drawerHead}>
            <Text style={styles.drawerTitle}>Your wishlist</Text>
            <TouchableOpacity style={styles.drawerClose} onPress={() => setWishlistVisible(false)}>
              <Ionicons name="close" size={16} color="#3A423B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12, gap: 10 }}>
            {wishedProperties.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={22} color={BRAND.primary} />
                <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                <Text style={styles.emptyText}>Tap the heart on any stay to save it here.</Text>
              </View>
            ) : (
              wishedProperties.map((p) => (
                <View style={styles.drawerItem} key={p.id}>
                  <Image source={{ uri: p.cover_image ? `${IMAGE_BASE_URL}/${p.cover_image}` : FALLBACK_IMAGE }} style={styles.drawerItemImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerItemName} numberOfLines={1}>{p.property_name}</Text>
                    <Text style={styles.drawerItemLoc} numberOfLines={1}>{p.city}, {p.country}</Text>
                    <Text style={styles.drawerItemPrice}>from ₹{Number(p.min_price ?? 0).toLocaleString()} / night</Text>
                  </View>
                  <TouchableOpacity style={styles.drawerRemove} onPress={() => toggleWish(p.id)}>
                    <Ionicons name="close" size={13} color={BRAND.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------------------------- Styles --------------------------------- */

// Shared shadow presets so cards/bars all read as the same "sleek, lifted" language.
const shadowSm = Platform.select({
  ios: { shadowColor: "#1F2A24", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 2 },
  default: {},
});
const shadowMd = Platform.select({
  ios: { shadowColor: "#1F2A24", shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 5 },
  default: {},
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  /* ---- Brand bar (logo + wordmark) ---- */
  brandBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  brandBarLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadowSm,
  },
  logoImg: { width: "100%", height: "100%" },
  logoPlaceholder: { backgroundColor: BRAND.primaryDeep, borderColor: BRAND.primaryDeep },
  logoPlaceholderText: { fontSize: 15, fontWeight: "800", color: "#F3EEE2", letterSpacing: 0.5 },

  overline: { fontSize: 10.5, fontWeight: "800", color: BRAND.primary, letterSpacing: 1.6 },
  brand: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.3, marginTop: 2 },

  wishHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadowSm,
  },
  wishBadge: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: BRAND.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  wishBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  /* ---- Location bar ---- */
  locationBar: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadowSm,
  },
  locationContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationTitle: { fontSize: 14.5, fontWeight: "800", color: theme.colors.textPrimary },
  locationAddress: { marginTop: 2, fontSize: 12.5, color: theme.colors.textSecondary ?? "#5B6B60" },

  /* ---- Search + Filters trigger ---- */
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 14 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadowSm,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: theme.colors.textPrimary },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadowSm,
  },
  filterCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterCountText: { color: "#fff", fontSize: 9.5, fontWeight: "800" },

  /* ---- Category tabs (Airbnb style, no boxes, centered) ---- */
  categoryScroll: { width: "100%" },
  categoryRow: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, gap: 26, alignItems: "flex-start", justifyContent: "center" },
  categoryTab: { alignItems: "center", gap: 7, paddingBottom: 10 },
  categoryLabel: { fontSize: 11.5, fontWeight: "600", color: "#9A9186" },
  categoryLabelActive: { color: BRAND.primary, fontWeight: "800" },
  categoryUnderline: { position: "absolute", bottom: 0, width: "100%", height: 2, borderRadius: 1, backgroundColor: BRAND.primary },

  /* ---- Results row ---- */
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 12 },
  resultsText: { fontSize: 12.5, color: theme.colors.textSecondary ?? "#5B6B60", fontWeight: "500" },
  resultsCount: { color: theme.colors.textPrimary, fontWeight: "800" },
  clearFiltersText: { fontSize: 12, fontWeight: "700", color: BRAND.primary },

  list: { paddingHorizontal: 20, marginTop: 12, gap: 18 },

  /* ---- Cards ---- */
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    ...shadowMd,
  },
  cardMedia: { height: 168, position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  cardGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.16)" },
  stampBadge: { position: "absolute", top: 12, left: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(243,238,226,0.95)", alignItems: "center", justifyContent: "center" },
  luxuryBadge: { position: "absolute", top: 12, left: 48, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(243,238,226,0.95)", alignItems: "center", justifyContent: "center" },
  heartBtnWrap: { position: "absolute", top: 12, right: 12, alignItems: "center", justifyContent: "center" },
  heartBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(243,238,226,0.95)", alignItems: "center", justifyContent: "center" },
  burstParticle: { position: "absolute", top: 11, left: 11 },
  roomsBadge: { position: "absolute", bottom: 10, left: 12, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(31,42,36,0.8)" },
  roomsBadgeText: { fontSize: 9.5, fontWeight: "800", color: "#F3EEE2" },

  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardName: { flex: 1, fontSize: 16.5, fontWeight: "800", color: theme.colors.textPrimary, letterSpacing: -0.2 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  locText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary ?? "#5B6B60" },

  amenityRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  amenityChip: { width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border },
  amenityMore: { fontSize: 9.5, fontWeight: "800", color: "#8A7F63" },

  cardBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, borderStyle: "dashed" },
  priceLabel: { fontSize: 10.5, color: "#8A7F63", fontWeight: "600" },
  priceValue: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  detailsCta: { flexDirection: "row", alignItems: "center", gap: 2 },
  detailsCtaText: { fontSize: 12, fontWeight: "700", color: BRAND.primary },

  loadMoreBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, ...shadowSm },
  loadMoreText: { fontSize: 13, fontWeight: "800", color: BRAND.primary },

  emptyState: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 24, gap: 6 },
  emptyTitle: { fontSize: 15.5, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 6 },
  emptyText: { fontSize: 12.5, color: theme.colors.textSecondary ?? "#5B6B60", textAlign: "center", lineHeight: 18 },
  retryBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND.primary },
  retryBtnText: { color: "#fff", fontSize: 12.5, fontWeight: "800" },

  /* ---- Skeleton loading ---- */
  skeletonLineWide: { height: 14, borderRadius: 6, backgroundColor: theme.colors.border, width: "70%", marginBottom: 8 },
  skeletonLineNarrow: { height: 10, borderRadius: 6, backgroundColor: theme.colors.border, width: "45%", marginBottom: 12 },
  skeletonLineMed: { height: 10, borderRadius: 6, backgroundColor: theme.colors.border, width: "60%" },
  skeletonShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: "rgba(255,255,255,0.35)",
    transform: [{ skewX: "-15deg" }],
  },

  /* ---- Filters bottom sheet ---- */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(20,26,22,0.45)" },
  filtersSheet: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "82%",
    ...shadowMd,
  },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginTop: 10 },
  filtersSheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  filtersSheetTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary },
  filterSectionLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1.4, color: "#8A7F63", marginTop: 18, marginBottom: 10 },
  filterWrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  filterPill: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  filterPillActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  filterPillText: { fontSize: 12.5, fontWeight: "700", color: theme.colors.textPrimary },
  filterPillTextActive: { color: "#fff" },
  filtersSheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  clearAllLink: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary, textDecorationLine: "underline" },
  showResultsBtn: { paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, backgroundColor: BRAND.primary, ...shadowSm },
  showResultsBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },

  /* ---- Wishlist drawer ---- */
  drawer: { backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "78%", ...shadowMd },
  drawerHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  drawerTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary },
  drawerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  drawerItem: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 10, ...shadowSm },
  drawerItemImg: { width: 54, height: 54, borderRadius: 10 },
  drawerItemName: { fontSize: 13, fontWeight: "800", color: theme.colors.textPrimary },
  drawerItemLoc: { fontSize: 11, color: "#8A7F63", marginTop: 2 },
  drawerItemPrice: { fontSize: 12, fontWeight: "700", color: BRAND.primary, marginTop: 4 },
  drawerRemove: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center" },
});