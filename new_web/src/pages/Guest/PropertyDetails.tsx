import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Star, Heart, Share2, ChevronLeft, ChevronRight, X,
  Wifi, Car, Utensils, Snowflake, Tv, Coffee, ShieldCheck, Clock,
  BedDouble, Users, Cigarette, PawPrint, PartyPopper, Baby, ArrowRight,
  MessageSquareQuote,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getPropertyBySlug, getPropertyReviews, createBooking, addToWishlist,

} from "../../lib/api";
import type { PropertySummary, Destination } from "../../lib/api";

import { useGuestAuth } from "../../context/GuestAuthContext";
import GoogleMapEmbed from "../../components/Guest/GoogleMapEmbed";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  "Free Wi-Fi": Wifi, Wifi, Parking: Car, Restaurant: Utensils,
  "Air Conditioning": Snowflake, Television: Tv, "Breakfast Included": Coffee,
};

function RatingBadge({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <span className="flex items-center gap-1 text-[13px] font-medium text-[#1E2A23]">
      <Star size={12} className="fill-[#C99A3D] text-[#C99A3D]" />
      {rating ? rating.toFixed(2) : "New"}
      {reviews !== undefined && reviews > 0 && (
        <span className="text-[#9A917D]">· {reviews} review{reviews === 1 ? "" : "s"}</span>
      )}
    </span>
  );
}

/* ─── Image gallery: one large hero + thumbnail strip, Airbnb-style ────── */
function Gallery({ images, name }: { images: { image: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const photos = images.length ? images : [{ image: "" }];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[280px] md:h-[440px]">
        <button
          onClick={() => { setActive(0); setLightbox(true); }}
          className="md:col-span-2 md:row-span-2 relative bg-[#E5DECF] overflow-hidden group"
        >
          {photos[0].image ? (
            <img src={photos[0].image} alt={name} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9A917D] text-sm">No photos yet</div>
          )}
        </button>
        {photos.slice(1, 5).map((p, i) => (
          <button
            key={i}
            onClick={() => { setActive(i + 1); setLightbox(true); }}
            className="hidden md:block relative bg-[#E5DECF] overflow-hidden group"
          >
            <img src={p.image} alt={`${name} photo ${i + 2}`} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[120] bg-[#1E2A23]/90 flex items-center justify-center p-4">
          <button onClick={() => setLightbox(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X size={18} className="text-white" />
          </button>
          <button
            onClick={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-4 md:left-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <img src={photos[active].image} alt={name} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" />
          <button
            onClick={() => setActive((i) => (i + 1) % photos.length)}
            className="absolute right-4 md:right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
          <span className="absolute bottom-6 text-white/70 text-[12px] font-mono-num">{active + 1} / {photos.length}</span>
        </div>
      )}
    </>
  );
}

const RATING_ROWS = (s: PropertyDetailsType["reviews_summary"]) => [
  { label: "Cleanliness", value: s.cleanliness_avg },
  { label: "Accuracy", value: s.accuracy_avg },
  { label: "Value", value: s.value_avg },
];

export default function PropertyDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useGuestAuth();

  const [property, setProperty] = useState<PropertyDetailsType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Booking widget state
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPropertyBySlug(slug)
      .then((data) => {
        setProperty(data);
        setSelectedRoomId(data.rooms[0]?.id ?? null);
        return getPropertyReviews(data.id);
      })
      .then((r) => setReviews(r.data || []))
      .catch(() => toast.error("Couldn't load this property. Try again in a moment."))
      .finally(() => setLoading(false));
  }, [slug]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000;
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const selectedRoom = property?.rooms.find((r) => r.id === selectedRoomId) ?? null;
  const estimatedTotal = selectedRoom && nights > 0 ? nights * Number(selectedRoom.price) : 0;

  const handleSave = async () => {
    if (!property) return;
    if (!isAuthenticated) {
      toast("Log in to save this stay to your wishlist.");
      return;
    }
    try {
      await addToWishlist(property.id);
      setSaved(true);
      toast.success("Saved to your wishlist");
    } catch {
      toast.error("Couldn't save this right now");
    }
  };

  const handleReserve = async () => {
    if (!property || !selectedRoom) return;
    if (!isAuthenticated) {
      toast("Log in to reserve this stay.");
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!checkIn || !checkOut || nights <= 0) {
      toast.error("Pick valid check-in and check-out dates first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBooking({
        propertyId: property.id,
        roomId: selectedRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults,
        children,
      });
      if (res.success) {
        toast.success("Booking request sent — check My Trips for status.");
        navigate("/trips");
      } else {
        toast.error(res.message || "Couldn't complete this booking");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't complete this booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EA]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2F6F62] border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2EA] gap-3 text-center px-6">
        <p className="font-display text-2xl text-[#1E2A23]">This stay isn't available</p>
        <p className="text-[13px] text-[#9A917D]">It may have been removed or the link is out of date.</p>
        <button onClick={() => navigate("/")} className="mt-2 text-[13px] font-semibold text-[#2F6F62] underline">Back to search</button>
      </div>
    );
  }

  const summary = property.reviews_summary;
  const maxGuests = Math.max(0, ...property.rooms.map((r) => r.max_adults + r.max_children));

  return (
    <div className="min-h-screen w-full bg-[#F5F2EA]">
      <div className="max-w-[1120px] mx-auto px-6 pt-6 pb-24">
        {/* ── Header row ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="font-display text-[28px] md:text-[32px] text-[#1E2A23] leading-tight">{property.property_name}</h1>
            <p className="text-[13px] text-[#6B6354] mt-1.5 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {[property.address?.area, property.address?.city, property.address?.state, property.address?.country].filter(Boolean).join(", ")}
              </span>
              <RatingBadge rating={property.average_rating} reviews={property.total_reviews} />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] hover:bg-white px-3 py-2 rounded-full transition">
              <Share2 size={14} /> Share
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] hover:bg-white px-3 py-2 rounded-full transition">
              <Heart size={14} className={saved ? "fill-[#C99A3D] text-[#C99A3D]" : ""} /> Save
            </button>
          </div>
        </div>

        {/* ── 1. Images ──────────────────────────────────────────── */}
        <Gallery images={property.images} name={property.property_name} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 mt-8">
          <div className="min-w-0">
            {/* ── 2. Description ─────────────────────────────────── */}
            <section className="pb-8 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-3">About this stay</h2>
              <p className="text-[14.5px] text-[#4A4438] leading-relaxed whitespace-pre-line">{property.description}</p>
            </section>

            {/* ── 3. Property data ───────────────────────────────── */}
            <section className="py-8 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">Property details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Check-in", value: property.check_in?.slice(0, 5) || "—", icon: Clock },
                  { label: "Check-out", value: property.check_out?.slice(0, 5) || "—", icon: Clock },
                  { label: "Room types", value: String(property.rooms.length), icon: BedDouble },
                  { label: "Max guests", value: String(maxGuests || "—"), icon: Users },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl border border-[#E5DECF] bg-white px-3.5 py-3">
                    <f.icon size={14} className="text-[#9A917D]" />
                    <p className="text-[10.5px] uppercase tracking-wide text-[#9A917D] mt-1.5">{f.label}</p>
                    <p className="text-[13.5px] font-semibold text-[#1E2A23] font-mono-num">{f.value}</p>
                  </div>
                ))}
              </div>

              {property.property_type_name && (
                <p className="text-[13px] text-[#6B6354] mt-4">
                  Property type: <span className="font-semibold text-[#1E2A23]">{property.property_type_name}</span>
                </p>
              )}
            </section>

            {/* ── 4. Host info ────────────────────────────────────── */}
            {property.host && (
              <section className="py-8 border-b border-[#E5DECF] flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#2F6F62]/10 flex items-center justify-center overflow-hidden shrink-0">
                  {property.host.profile_image ? (
                    <img src={property.host.profile_image} alt={property.host.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-lg text-[#2F6F62]">{property.host.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-display text-[17px] text-[#1E2A23]">Hosted by {property.host.name}</p>
                  {property.host.hosting_since && (
                    <p className="text-[12.5px] text-[#9A917D] mt-0.5">
                      Hosting on Prostayz since {new Date(property.host.hosting_since).getFullYear()}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* ── 5. Amenities ────────────────────────────────────── */}
            <section className="py-8 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">What this place offers</h2>
              {property.amenities.length === 0 ? (
                <p className="text-[13px] text-[#9A917D]">No amenities listed yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a.name] ?? ShieldCheck;
                    return (
                      <span key={a.id} className="flex items-center gap-2 text-[13px] text-[#1E2A23] bg-white border border-[#E5DECF] rounded-xl px-3 py-2.5">
                        <Icon size={15} className="text-[#2F6F62]" /> {a.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Rooms & pricing ─────────────────────────────────── */}
            <section className="py-8 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">Rooms & pricing</h2>
              <div className="space-y-2.5">
                {property.rooms.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 flex-wrap text-left transition ${
                      selectedRoomId === r.id ? "border-[#2F6F62] bg-[#2F6F62]/5" : "border-[#E5DECF] bg-white hover:border-[#2F6F62]/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1E2A23]">{r.room_name}</p>
                      <p className="text-[12px] text-[#9A917D] mt-0.5">
                        {r.room_size} {r.room_size_unit} · sleeps {r.max_adults + r.max_children} · {r.available_rooms} left
                      </p>
                    </div>
                    <p className="text-[14.5px] font-semibold text-[#1E2A23] font-mono-num whitespace-nowrap">
                      ₹{Number(r.price).toLocaleString("en-IN")}
                      <span className="text-[11.5px] text-[#9A917D] font-sans font-normal"> /night</span>
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* House rules */}
            {property.rules && (
              <section className="py-8 border-b border-[#E5DECF]">
                <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">House rules</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Smoking", allowed: !!property.rules.smoking_allowed, icon: Cigarette },
                    { label: "Pets", allowed: !!property.rules.pets_allowed, icon: PawPrint },
                    { label: "Parties", allowed: !!property.rules.parties_allowed, icon: PartyPopper },
                    { label: "Children", allowed: !!property.rules.children_allowed, icon: Baby },
                  ].map((rule) => (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full border ${
                        rule.allowed ? "border-[#2F6F62]/25 text-[#2F6F62] bg-[#2F6F62]/6" : "border-[#DBD3C4] text-[#9A917D]"
                      }`}
                    >
                      <rule.icon size={12} /> {rule.label} {rule.allowed ? "allowed" : "not allowed"}
                    </span>
                  ))}
                </div>
                {property.policies?.cancellation_policy && (
                  <p className="text-[13px] text-[#6B6354] mt-4 leading-relaxed">{property.policies.cancellation_policy}</p>
                )}
              </section>
            )}

            {/* Map */}
            <section className="py-8 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">Where you'll be</h2>
              <GoogleMapEmbed
                latitude={property.latitude}
                longitude={property.longitude}
                label={[property.address?.city, property.address?.state, property.address?.country].filter(Boolean).join(", ")}
              />
            </section>

            {/* ── 6. Reviews ──────────────────────────────────────── */}
            <section className="py-8">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4 flex items-center gap-2">
                <Star size={16} className="fill-[#C99A3D] text-[#C99A3D]" />
                {summary.average_rating ? summary.average_rating.toFixed(2) : "New"} · {summary.total_reviews} review{summary.total_reviews === 1 ? "" : "s"}
              </h2>

              {summary.total_reviews > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
                  {RATING_ROWS(summary).map((row) => (
                    <div key={row.label} className="rounded-xl border border-[#E5DECF] bg-white px-3 py-2.5">
                      <p className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">{row.label}</p>
                      <p className="text-[14px] font-semibold text-[#1E2A23] font-mono-num mt-0.5">{row.value ? row.value.toFixed(1) : "—"}</p>
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="flex items-center gap-3 text-[#9A917D] text-[13.5px] border border-dashed border-[#DBD3C4] rounded-2xl px-5 py-8">
                  <MessageSquareQuote size={18} />
                  No reviews yet — this stay is waiting for its first guest.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {reviews.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-8 h-8 rounded-full bg-[#2F6F62]/10 flex items-center justify-center text-[12px] font-semibold text-[#2F6F62]">
                          {r.is_anonymous ? "?" : (r.reviewer_name?.charAt(0) ?? "G")}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#1E2A23]">{r.is_anonymous ? "Anonymous guest" : (r.reviewer_name ?? "Guest")}</p>
                          <p className="text-[11px] text-[#9A917D]">{new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? "fill-[#C99A3D] text-[#C99A3D]" : "text-[#DBD3C4]"} />
                        ))}
                      </div>
                      {r.title && <p className="text-[13.5px] font-semibold text-[#1E2A23] mb-1">{r.title}</p>}
                      <p className="text-[13.5px] text-[#4A4438] leading-relaxed">{r.review}</p>
                      {r.vendor_reply && (
                        <div className="mt-2 pl-3 border-l-2 border-[#DBD3C4]">
                          <p className="text-[11.5px] font-semibold text-[#2F6F62]">Response from the host</p>
                          <p className="text-[13px] text-[#6B6354] mt-0.5">{r.vendor_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Sticky booking widget ──────────────────────────────── */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-[#E5DECF] bg-white p-5 shadow-sm">
              <p className="font-display text-[22px] text-[#1E2A23]">
                ₹{selectedRoom ? Number(selectedRoom.price).toLocaleString("en-IN") : property.min_price?.toLocaleString("en-IN")}
                <span className="text-[12px] text-[#9A917D] font-sans font-normal"> / night</span>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <label className="rounded-xl border border-[#E5DECF] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wide text-[#9A917D]">Check-in</span>
                  <input type="date" value={checkIn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setCheckIn(e.target.value)} className="w-full text-[13px] outline-none mt-0.5" />
                </label>
                <label className="rounded-xl border border-[#E5DECF] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wide text-[#9A917D]">Check-out</span>
                  <input type="date" value={checkOut} min={checkIn || new Date().toISOString().slice(0, 10)} onChange={(e) => setCheckOut(e.target.value)} className="w-full text-[13px] outline-none mt-0.5" />
                </label>
              </div>

              <label className="block rounded-xl border border-[#E5DECF] px-3 py-2 mt-2">
                <span className="text-[10px] uppercase tracking-wide text-[#9A917D]">Guests</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <input
                    type="number" min={1} max={maxGuests || 10} value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    className="w-14 text-[13px] outline-none"
                  />
                  <span className="text-[12px] text-[#9A917D]">adults</span>
                  <input
                    type="number" min={0} value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                    className="w-14 text-[13px] outline-none"
                  />
                  <span className="text-[12px] text-[#9A917D]">children</span>
                </div>
              </label>

              {property.rooms.length > 1 && (
                <select
                  value={selectedRoomId ?? ""}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  className="w-full mt-2 rounded-xl border border-[#E5DECF] px-3 py-2.5 text-[13px] outline-none"
                >
                  {property.rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.room_name} — ₹{Number(r.price).toLocaleString("en-IN")}/night</option>
                  ))}
                </select>
              )}

              <button
                onClick={handleReserve}
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1E2A23] hover:bg-[#16201A] disabled:opacity-60 text-white font-semibold text-[13.5px] px-6 py-3 rounded-xl transition"
              >
                {submitting ? "Sending request…" : "Reserve"} {!submitting && <ArrowRight size={15} />}
              </button>

              {nights > 0 && selectedRoom && (
                <div className="mt-4 pt-4 border-t border-[#E5DECF] space-y-1.5 text-[13px] text-[#4A4438]">
                  <div className="flex justify-between">
                    <span>₹{Number(selectedRoom.price).toLocaleString("en-IN")} × {nights} night{nights === 1 ? "" : "s"}</span>
                    <span className="font-mono-num">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#1E2A23] pt-1.5 border-t border-[#E5DECF]">
                    <span>Estimated total</span>
                    <span className="font-mono-num">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[11px] text-[#9A917D]">Taxes calculated at checkout.</p>
                </div>
              )}

              <p className="text-[11.5px] text-[#9A917D] text-center mt-3">You won't be charged yet</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
