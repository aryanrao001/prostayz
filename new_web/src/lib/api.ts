import axios from "axios";

/**
 * Single axios instance for every guest-facing call (search, property
 * details, reviews, bookings, wishlist, auth). Vendor/Admin panels keep
 * their own session-cookie based calls in their existing contexts —
 * this one carries the guest's JWT instead, since userRoutes.js issues
 * a bearer token (see authenticateUser in the backend), not a session.
 */
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prostayz_guest_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ============================================================
   Types
============================================================ */
export interface PropertySummary {
  id: number;
  property_name: string;
  slug: string;
  star_rating: number;
  min_price: number | null;
  max_price: number | null;
  total_rooms: number;
  check_in: string;
  check_out: string;
  area: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  property_type_id: number;
  property_type_name: string | null;
  cover_image: string | null;
  amenities: string[];
  average_rating?: number;
  total_reviews?: number;
}

export interface SearchParams {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  type?: string | number;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "price_low" | "price_high" | "rating";
  page?: number;
  limit?: number;
}

export interface Destination {
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PropertyDetails {
  id: number;
  vendor_id: number;
  property_name: string;
  slug: string;
  description: string;
  star_rating: number;
  check_in: string;
  check_out: string;
  total_rooms: number;
  min_price: number;
  max_price: number;
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
  total_reviews: number;
  property_type_name: string | null;
  address: {
    country: string; state: string; city: string; area: string;
    address: string; pincode: string; landmark: string;
  } | null;
  images: { id: number; image: string; is_cover: number; sort_order: number }[];
  amenities: { id: number; name: string; icon: string | null }[];
  rooms: {
    id: number; room_name: string; room_type: string; room_category: string;
    max_adults: number; max_children: number; available_rooms: number;
    room_size: number; room_size_unit: string; private_bathroom: number;
    balcony: number; air_conditioning: number; description: string | null;
    price: number; weekend_price: number; extra_guest_price: number; tax: number;
  }[];
  host: { id: number; name: string; profile_image: string | null; hosting_since: string } | null;
  policies: { cancellation_policy: string; house_rules: string; refund_policy: string } | null;
  rules: {
    smoking_allowed: number; pets_allowed: number; parties_allowed: number;
    couples_allowed: number; children_allowed: number;
  } | null;
  reviews_summary: {
    total_reviews: number; average_rating: number | null;
    cleanliness_avg: number | null; accuracy_avg: number | null; value_avg: number | null;
  };
}

export interface Review {
  id: number;
  rating: number;
  cleanliness_rating: number | null;
  accuracy_rating: number | null;
  value_rating: number | null;
  title: string | null;
  review: string;
  is_anonymous: number;
  vendor_reply: string | null;
  vendor_reply_at: string | null;
  created_at: string;
  reviewer_name?: string;
  photos?: string[];
}

/* ============================================================
   Destinations / search
============================================================ */
export const searchDestinations = async (q: string): Promise<Destination[]> => {
  if (q.trim().length < 2) return [];
  const { data } = await api.get("/location/search", { params: { q } });
  return data.success ? data.data : [];
};

export const searchProperties = async (params: SearchParams) => {
  const { data } = await api.get("/user/properties", { params });
  return data as {
    success: boolean;
    data: PropertySummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

export const getPropertyBySlug = async (slug: string): Promise<PropertyDetails> => {
  const { data } = await api.get(`/user/properties/${slug}`);
  if (!data.success) throw new Error(data.message || "Property not found");
  return data.data;
};

/* ============================================================
   Reviews
============================================================ */
export const getPropertyReviews = async (propertyId: number, page = 1) => {
  const { data } = await api.get(`/review/property/${propertyId}`, { params: { page } });
  return data as { success: boolean; data: Review[]; pagination?: { page: number; totalPages: number } };
};

export const getReviewableBookings = async () => {
  const { data } = await api.get("/review/reviewable");
  return data.success ? data.data : [];
};

export const submitReview = async (payload: {
  booking_id: number;
  rating: number;
  cleanliness_rating?: number;
  accuracy_rating?: number;
  value_rating?: number;
  title?: string;
  review: string;
  is_anonymous?: boolean;
  photos?: File[];
}) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "photos") return;
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  (payload.photos || []).forEach((file) => form.append("photos", file));

  const { data } = await api.post("/review/create", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/* ============================================================
   Bookings
============================================================ */
export const createBooking = async (payload: {
  propertyId: number;
  roomId: number;
  dormBedId?: number;
  quantity?: number;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialRequests?: string;
}) => {
  const { data } = await api.post("/booking/bookings", payload);
  return data;
};

export const getMyBookings = async () => {
  const { data } = await api.get("/booking/bookings/me");
  return data.success ? data.data : [];
};

export const initiatePayment = async (bookingId: number) => {
  const { data } = await api.post(`/booking/bookings/${bookingId}/payments/initiate`);
  return data;
};

export const cancelBooking = async (bookingId: number) => {
  const { data } = await api.post(`/booking/bookings/${bookingId}/cancel`);
  return data;
};

/* ============================================================
   Wishlist
============================================================ */
export const addToWishlist = async (propertyId: number) => {
  const { data } = await api.post("/user/wishlist", { property_id: propertyId });
  return data;
};

export const getWishlist = async () => {
  const { data } = await api.get("/user/getwishlist");
  return data.success ? data.data : [];
};


export interface Destination {
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}