import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import {
  MapPin, Star, Heart, Share2, ImagePlus, ArrowLeft, X, Users, BedDouble,
  Bath, Wind, Maximize2, ChevronDown, Phone, Mail, Globe, Check, Minus,
  Loader2, Quote, ShieldCheck, Sparkles, CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";

/* ---------------------------------------------------------------------
   TOKENS — kept identical to EntryPage.tsx so the two pages read as one
   product. canvas #F5F2EA · ink #1E2A23 · pine #2F6F62 · brass #C99A3D
   line #DBD3C4 · font-display / font-mono-num from src/index.css
--------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
   Types — mirror the JSON shape returned by getPropertyBySlug exactly
--------------------------------------------------------------------- */
interface Address {
  country: string | null; state: string | null; city: string | null;
  area: string | null; address: string | null; pincode: string | null;
  landmark: string | null;
}
interface Contact { name: string | null; number: string | null; email: string | null; website: string | null; }
interface VendorInfo { id: number; business_name: string | null; contact_person: string; phone: string | null; email: string | null; }
interface Amenity { id: number; name: string; icon: string; }
interface PropertyImage { id: number; image: string; is_cover: number; sort_order: number; }
interface Policies { cancellation_policy: string | null; house_rules: string | null; refund_policy: string | null; }
interface Rules {
  smoking_allowed: number; pets_allowed: number; parties_allowed: number;
  couples_allowed: number; children_allowed: number;
}
interface RoomBed { id: number; room_id: number; bed_type: string; quantity: number; }
interface DormBed { id: number; room_id: number; bed_label: string; bed_type: string; status: string; price: string; }
interface Availability {
  room_id: number; available_date: string; available_rooms: number;
  blocked_rooms: number; special_price: string | null;
}
interface RoomPricing { price: string; weekend_price: string | null; extra_guest_price: string | null; tax: string | null; }
interface Room {
  id: number; room_name: string; room_type: string | null; room_category: string;
  max_adults: number; max_children: number; total_rooms: number; available_rooms: number;
  room_size: number | null; room_size_unit: string | null; private_bathroom: boolean;
  balcony: boolean; air_conditioning: boolean; description: string | null;
  pricing: RoomPricing; images: PropertyImage[]; beds: RoomBed[]; dorm_beds: DormBed[];
  upcoming_availability: Availability[];
}
interface Review {
  id: number; rating: number; title: string | null; review: string;
  created_at: string; reviewer_name: string;
}
interface PropertyDetails {
  id: number; slug: string; property_name: string; property_type: string | null;
  description: string | null; star_rating: number; check_in: string; check_out: string;
  total_rooms: number; min_price: string; max_price: string; is_featured: boolean;
  average_rating: string; total_reviews: number; latitude: number | null; longitude: number | null;
  contact: Contact; vendor: VendorInfo; address: Address | null; amenities: Amenity[];
  images: PropertyImage[]; policies: Policies | null; rules: Rules | null;
  rooms: Room[]; reviews: Review[]; created_at: string; updated_at: string;
}

/* ---------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------- */

// Property photos are stored on disk under /uploads/properties/{propertyId}/{filename}
// and room photos follow the same pattern under /uploads/rooms/{roomId}/{filename}.
// The DB only ever gives us the bare filename ("001.jpg"), so the id has to be
// threaded through wherever we build a URL.
const IMAGE_BASE_URL = (import.meta as any).env?.VITE_IMAGE_BASE_URL || "/uploads";
const getPropertyImageUrl = (propertyId: number, filename?: string | null) =>
  filename ? `${IMAGE_BASE_URL}/${propertyId}/${filename}` : null;
const getRoomImageUrl = (roomId: number, filename?: string | null) =>
  filename ? `${IMAGE_BASE_URL}/rooms/${roomId}/${filename}` : null;

async function fetchPropertyDetails(slug: string): Promise<PropertyDetails> {
  const base = (import.meta as any).env?.VITE_BACKEND_URL ?? "";
  const res = await fetch(`${base}/api/user/properties/${slug}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "This stay could not be found.");
  return json.data as PropertyDetails;
}

const money = (n: string | number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

/** Resolves a Lucide icon by the string name stored in the amenities table,
 *  falling back gracefully if an icon name doesn't exist in the library. */
function DynamicIcon({ name, size = 17, className = "" }: { name: string; size?: number; className?: string }) {
  const Comp = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[name] || Sparkles;
  return <Comp size={size} className={className} strokeWidth={1.8} />;
}

/* ---------------------------------------------------------------------
   Small shared bits
--------------------------------------------------------------------- */
function ProstayzMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl border border-dashed border-[#C99A3D]/60 bg-[#C99A3D]/10 flex items-center justify-center flex-shrink-0" aria-label="Prostayz logo">
        <ImagePlus size={15} className="text-[#C99A3D]" />
      </div>
      <span className="font-display text-[20px] text-[#1E2A23] tracking-tight">Prostayz</span>
    </div>
  );
}

function StickyNav({ onBack, name, saved, onSave }: { onBack: () => void; name?: string; saved: boolean; onSave: () => void; }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-40 backdrop-blur border-b transition-colors ${scrolled ? "bg-white/90 border-[#E5DECF]" : "bg-transparent border-transparent"}`}>
      <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${scrolled ? "border-[#E5DECF] text-[#1E2A23] hover:border-[#C99A3D]" : "border-white/40 text-white bg-black/10 hover:bg-black/20"}`} aria-label="Go back">
          <ArrowLeft size={17} />
        </button>
        <div className={`transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"} font-display text-[16px] text-[#1E2A23] truncate max-w-[40%]`}>
          {name}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full border text-[13px] font-semibold transition ${scrolled ? "border-[#E5DECF] text-[#1E2A23] hover:bg-[#F5F2EA]" : "border-white/40 text-white bg-black/10 hover:bg-black/20"}`}
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={onSave}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full border text-[13px] font-semibold transition ${scrolled ? "border-[#E5DECF] text-[#1E2A23] hover:bg-[#F5F2EA]" : "border-white/40 text-white bg-black/10 hover:bg-black/20"}`}
          >
            <Heart size={14} className={saved ? "fill-[#C99A3D] text-[#C99A3D]" : ""} /> Save
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------
   Gallery
--------------------------------------------------------------------- */
function Gallery({ images, propertyId, propertyName }: { images: PropertyImage[]; propertyId: number; propertyName: string }) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => [...images].sort((a, b) => (b.is_cover - a.is_cover) || a.sort_order - b.sort_order), [images]);
  const shown = sorted.slice(0, 5);
  const remaining = sorted.length - shown.length;

  const Tile = ({ img, className }: { img?: PropertyImage; className: string }) => (
    <div className={`relative overflow-hidden bg-[#E5DECF] ${className}`}>
      {img ? (
        <img src={getPropertyImageUrl(propertyId, img.image) ?? undefined} alt={propertyName} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#9A917D]"><ImagePlus size={20} /></div>
      )}
    </div>
  );

  return (
    <>
      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden h-[420px]">
          <Tile img={shown[0]} className="col-span-2 row-span-2 rounded-l-3xl" />
          <Tile img={shown[1]} className="col-span-1 row-span-1" />
          <Tile img={shown[2]} className="col-span-1 row-span-1 rounded-tr-3xl" />
          <Tile img={shown[3]} className="col-span-1 row-span-1" />
          <Tile img={shown[4]} className="col-span-1 row-span-1 rounded-br-3xl" />
        </div>
        {sorted.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] border border-[#DBD3C4] px-3.5 py-2 rounded-full hover:bg-[#F5F2EA] transition"
          >
            <ImagePlus size={14} /> Show all {sorted.length} photos{remaining > 0 ? ` (+${remaining})` : ""}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[120] bg-[#1E2A23] overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-[#1E2A23] z-10">
            <span className="text-white/70 text-[13px]">{sorted.length} photos</span>
            <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <X size={16} />
            </button>
          </div>
          <div className="max-w-[900px] mx-auto px-6 pb-16 grid grid-cols-2 gap-3">
            {sorted.map((img) => (
              <img key={img.id} src={getPropertyImageUrl(propertyId, img.image) ?? undefined} alt={propertyName} className="w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------------
   Room card
--------------------------------------------------------------------- */
function RoomCard({ room, onSelect }: { room: Room; onSelect: (r: Room) => void }) {
  const cover = room.images?.find((i) => i.is_cover) ?? room.images?.[0];
  const nextDays = room.upcoming_availability.slice(0, 7);
  const bedSummary = room.beds.map((b) => `${b.quantity} ${b.bed_type}`).join(", ");

  return (
    <div className="border border-[#E5DECF] rounded-2xl overflow-hidden bg-white flex flex-col md:flex-row">
      <div className="md:w-[280px] h-[200px] md:h-auto bg-[#E5DECF] flex-shrink-0 relative">
        {cover ? (
          <img src={getRoomImageUrl(room.id, cover.image) ?? undefined} alt={room.room_name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#9A917D]"><ImagePlus size={20} /></div>
        )}
        {room.available_rooms <= 2 && room.available_rooms > 0 && (
          <span className="absolute top-3 left-3 bg-[#C99A3D] text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-full">
            Only {room.available_rooms} left
          </span>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[17px] text-[#1E2A23]">{room.room_name}</h3>
            <p className="text-[12.5px] text-[#9A917D] mt-0.5">
              {room.room_type ?? "Standard"} · {room.room_category.replace("_", " ")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono-num text-[18px] font-semibold text-[#1E2A23]">{money(room.pricing.price)}</p>
            <p className="text-[11px] text-[#9A917D]">/ night + {room.pricing.tax ?? 0}% tax</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-[#6B6354]">
          <span className="flex items-center gap-1.5"><Users size={13} className="text-[#2F6F62]" /> {room.max_adults} adults{room.max_children ? ` · ${room.max_children} children` : ""}</span>
          {room.room_size && <span className="flex items-center gap-1.5"><Maximize2 size={13} className="text-[#2F6F62]" /> {room.room_size} {room.room_size_unit}</span>}
          {bedSummary && <span className="flex items-center gap-1.5"><BedDouble size={13} className="text-[#2F6F62]" /> {bedSummary}</span>}
          {room.private_bathroom && <span className="flex items-center gap-1.5"><Bath size={13} className="text-[#2F6F62]" /> Private bathroom</span>}
          {room.air_conditioning && <span className="flex items-center gap-1.5"><Wind size={13} className="text-[#2F6F62]" /> AC</span>}
        </div>

        {room.dorm_beds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.dorm_beds.map((bed) => (
              <span
                key={bed.id}
                className={`text-[11px] font-medium px-2 py-1 rounded-full border ${bed.status === "available" ? "border-[#2F6F62]/30 text-[#2F6F62] bg-[#2F6F62]/5" : "border-[#DBD3C4] text-[#B3AB99] line-through"}`}
              >
                {bed.bed_label} · {money(bed.price)}
              </span>
            ))}
          </div>
        )}

        {nextDays.length > 0 && (
          <div className="border-t border-dashed border-[#E5DECF] pt-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9A917D] mb-1.5">Next few nights</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {nextDays.map((d) => {
                const soldOut = d.available_rooms === 0;
                return (
                  <div
                    key={d.available_date}
                    className={`flex-shrink-0 w-[64px] rounded-lg border px-1.5 py-1.5 text-center ${soldOut ? "border-[#E5DECF] bg-[#F5F2EA] opacity-50" : "border-[#DBD3C4]"}`}
                  >
                    <p className="text-[10px] text-[#9A917D]">{formatDate(d.available_date)}</p>
                    <p className="font-mono-num text-[11.5px] font-semibold text-[#1E2A23] mt-0.5">
                      {soldOut ? "Full" : money(d.special_price ?? room.pricing.price)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[12px] text-[#9A917D]">{room.available_rooms} of {room.total_rooms} rooms available</span>
          <button
            onClick={() => onSelect(room)}
            disabled={room.available_rooms === 0}
            className="bg-[#2F6F62] hover:bg-[#255A4F] disabled:bg-[#DBD3C4] disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2 rounded-full transition"
          >
            {room.available_rooms === 0 ? "Sold out" : "Select room"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Policies accordion
--------------------------------------------------------------------- */
function PolicyAccordion({ policies }: { policies: Policies }) {
  const [openKey, setOpenKey] = useState<string | null>("cancellation_policy");
  const rows: { key: keyof Policies; label: string }[] = [
    { key: "cancellation_policy", label: "Cancellation policy" },
    { key: "house_rules", label: "House rules" },
    { key: "refund_policy", label: "Refund policy" },
  ];
  return (
    <div className="border border-[#E5DECF] rounded-2xl divide-y divide-[#E5DECF] overflow-hidden">
      {rows.filter((r) => policies[r.key]).map((r) => (
        <div key={r.key}>
          <button
            onClick={() => setOpenKey(openKey === r.key ? null : r.key)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-[14px] font-semibold text-[#1E2A23]">{r.label}</span>
            <ChevronDown size={16} className={`text-[#9A917D] transition-transform ${openKey === r.key ? "rotate-180" : ""}`} />
          </button>
          {openKey === r.key && (
            <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-[#6B6354]">{policies[r.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Rules grid
--------------------------------------------------------------------- */
function RulesGrid({ rules }: { rules: Rules }) {
  const items: { label: string; allowed: boolean }[] = [
    { label: "Smoking", allowed: !!rules.smoking_allowed },
    { label: "Pets", allowed: !!rules.pets_allowed },
    { label: "Parties or events", allowed: !!rules.parties_allowed },
    { label: "Couples", allowed: !!rules.couples_allowed },
    { label: "Children", allowed: !!rules.children_allowed },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border ${it.allowed ? "border-[#2F6F62]/25 bg-[#2F6F62]/5" : "border-[#E5DECF] bg-[#F5F2EA]"}`}>
          {it.allowed ? <Check size={15} className="text-[#2F6F62] shrink-0" /> : <Minus size={15} className="text-[#B3AB99] shrink-0" />}
          <span className={`text-[13px] font-medium ${it.allowed ? "text-[#1E2A23]" : "text-[#9A917D]"}`}>{it.label} {it.allowed ? "allowed" : "not allowed"}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Reviews
--------------------------------------------------------------------- */
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-[#E5DECF] rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-[#2F6F62]/10 flex items-center justify-center text-[#2F6F62] font-display text-[14px]">
          {review.reviewer_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-[#1E2A23]">{review.reviewer_name}</p>
          <p className="text-[11px] text-[#9A917D]">{timeAgo(review.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < review.rating ? "fill-[#C99A3D] text-[#C99A3D]" : "text-[#E5DECF]"} />
        ))}
      </div>
      {review.title && <p className="text-[14px] font-semibold text-[#1E2A23] mb-1">{review.title}</p>}
      <p className="text-[13.5px] text-[#6B6354] leading-relaxed relative pl-5">
        <Quote size={13} className="absolute left-0 top-0.5 text-[#DBD3C4]" />
        {review.review}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Booking sidebar
--------------------------------------------------------------------- */
function BookingSidebar({ property, onScrollToRooms }: { property: PropertyDetails; onScrollToRooms: () => void }) {
  const sameMinMax = property.min_price === property.max_price;
  return (
    <aside className="hidden lg:block w-[340px] shrink-0">
      <div className="sticky top-[96px] border border-[#E5DECF] rounded-2xl p-5 bg-white shadow-[0_20px_40px_-24px_rgba(30,42,35,0.18)]">
        <div className="flex items-baseline justify-between mb-1">
          <p className="font-mono-num text-[22px] font-semibold text-[#1E2A23]">
            {sameMinMax ? money(property.min_price) : `${money(property.min_price)}–${money(property.max_price)}`}
          </p>
          <span className="text-[12px] text-[#9A917D]">/ night</span>
        </div>
        {Number(property.total_reviews) > 0 && (
          <div className="flex items-center gap-1 text-[12.5px] text-[#1E2A23] mb-4">
            <Star size={12} className="fill-[#C99A3D] text-[#C99A3D]" />
            <span className="font-semibold">{property.average_rating}</span>
            <span className="text-[#9A917D]">· {property.total_reviews} review{property.total_reviews === 1 ? "" : "s"}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border border-[#E5DECF] rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A917D]">Check-in</p>
            <p className="text-[13px] text-[#1E2A23] mt-0.5">{formatTime(property.check_in)}</p>
          </div>
          <div className="border border-[#E5DECF] rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A917D]">Check-out</p>
            <p className="text-[13px] text-[#1E2A23] mt-0.5">{formatTime(property.check_out)}</p>
          </div>
        </div>

        <button
          onClick={onScrollToRooms}
          className="w-full bg-[#2F6F62] hover:bg-[#255A4F] text-white text-[14px] font-semibold py-3 rounded-xl transition mb-3"
        >
          View available rooms
        </button>
        <p className="text-center text-[11.5px] text-[#9A917D] mb-4">You won't be charged yet</p>

        <div className="border-t border-[#E5DECF] pt-4 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D] mb-0.5">Hosted by {property.vendor.business_name}</p>
          {property.contact.number && (
            <a href={`tel:${property.contact.number}`} className="flex items-center gap-2 text-[13px] text-[#1E2A23] hover:text-[#2F6F62]">
              <Phone size={14} className="text-[#2F6F62]" /> {property.contact.number}
            </a>
          )}
          {property.contact.email && (
            <a href={`mailto:${property.contact.email}`} className="flex items-center gap-2 text-[13px] text-[#1E2A23] hover:text-[#2F6F62] truncate">
              <Mail size={14} className="text-[#2F6F62] shrink-0" /> <span className="truncate">{property.contact.email}</span>
            </a>
          )}
          {property.contact.website && (
            <a href={property.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] text-[#1E2A23] hover:text-[#2F6F62] truncate">
              <Globe size={14} className="text-[#2F6F62] shrink-0" /> <span className="truncate">{property.contact.website}</span>
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------
   Mobile sticky CTA bar
--------------------------------------------------------------------- */
function MobileBookBar({ property, onScrollToRooms }: { property: PropertyDetails; onScrollToRooms: () => void }) {
  const sameMinMax = property.min_price === property.max_price;
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5DECF] px-5 py-3.5 flex items-center justify-between gap-4">
      <div>
        <p className="font-mono-num text-[16px] font-semibold text-[#1E2A23]">
          {sameMinMax ? money(property.min_price) : `${money(property.min_price)}+`}
        </p>
        <p className="text-[11px] text-[#9A917D]">per night</p>
      </div>
      <button onClick={onScrollToRooms} className="bg-[#2F6F62] text-white text-[13.5px] font-semibold px-6 py-3 rounded-full">
        View rooms
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Loading / error states
--------------------------------------------------------------------- */
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F5F2EA] flex flex-col items-center justify-center gap-3">
      <Loader2 size={26} className="text-[#2F6F62] animate-spin" />
      <p className="text-[13.5px] text-[#9A917D]">Loading this stay…</p>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#F5F2EA] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#C99A3D]/10 flex items-center justify-center">
        <ImagePlus size={22} className="text-[#C99A3D]" />
      </div>
      <div>
        <p className="font-display text-[19px] text-[#1E2A23]">This stay isn't available</p>
        <p className="text-[13.5px] text-[#9A917D] mt-1">{message}</p>
      </div>
      <button onClick={onBack} className="text-[13.5px] font-semibold text-[#2F6F62] flex items-center gap-1.5">
        <ArrowLeft size={14} /> Back to all stays
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Page
--------------------------------------------------------------------- */
const PropertyDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchPropertyDetails(slug)
      .then(setProperty)
      .catch((e) => setError(e.message || "Something went wrong."))
      .finally(() => setLoading(false));
  }, [slug]);

  const scrollToRooms = () => {
    document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectRoom = (room: Room) => {
    if (!property) return;
    navigate(`/book/${property.slug}?room=${room.id}`);
  };

  if (loading) return <LoadingState />;
  if (error || !property) return <ErrorState message={error ?? "Unknown error."} onBack={() => navigate("/")} />;

  const address = property.address;
  const locationLine = address ? [address.area, address.city, address.state].filter(Boolean).join(", ") : null;

  return (
    <div className="min-h-screen w-full bg-[#F5F2EA] pb-24 lg:pb-16">
      <StickyNav onBack={() => navigate(-1)} name={property.property_name} saved={saved} onSave={() => setSaved((s) => !s)} />

      <Gallery images={property.images} propertyId={property.id} propertyName={property.property_name} />

      <main className="max-w-[1200px] mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="border-b border-[#E5DECF] pb-7">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {property.property_type && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6F62] bg-[#2F6F62]/10 px-2.5 py-1 rounded-full">
                  {property.property_type}
                </span>
              )}
              {property.is_featured && (
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#C99A3D] bg-[#C99A3D]/10 px-2.5 py-1 rounded-full">
                  <Sparkles size={10} /> Featured
                </span>
              )}
            </div>
            <h1 className="font-display text-[28px] md:text-[34px] text-[#1E2A23] leading-tight">{property.property_name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[13.5px] text-[#6B6354]">
              {property.star_rating > 0 && (
                <span className="flex items-center gap-1">
                  {Array.from({ length: property.star_rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-[#C99A3D] text-[#C99A3D]" />
                  ))}
                </span>
              )}
              {Number(property.total_reviews) > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="fill-[#1E2A23] text-[#1E2A23]" /> {property.average_rating} · {property.total_reviews} reviews
                </span>
              )}
              {locationLine && (
                <span className="flex items-center gap-1"><MapPin size={13} className="text-[#9A917D]" /> {locationLine}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="py-7 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-2.5">About this stay</h2>
              <p className="text-[14px] leading-relaxed text-[#6B6354]">{property.description}</p>
              {address?.landmark && (
                <p className="text-[13px] text-[#9A917D] mt-2.5 flex items-center gap-1.5"><MapPin size={13} /> {address.landmark}</p>
              )}
            </div>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="py-7 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">What this place offers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {property.amenities.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    <DynamicIcon name={a.icon} className="text-[#2F6F62]" />
                    <span className="text-[13.5px] text-[#1E2A23]">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div id="rooms" className="py-7 border-b border-[#E5DECF] scroll-mt-24">
            <h2 className="font-display text-[19px] text-[#1E2A23] mb-1">Rooms &amp; availability</h2>
            <p className="text-[13px] text-[#9A917D] mb-4">{property.total_rooms} rooms total across {property.rooms.length} room type{property.rooms.length === 1 ? "" : "s"}</p>
            <div className="flex flex-col gap-4">
              {property.rooms.map((room) => (
                <RoomCard key={room.id} room={room} onSelect={handleSelectRoom} />
              ))}
            </div>
          </div>

          {/* Rules */}
          {property.rules && (
            <div className="py-7 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4">House rules</h2>
              <RulesGrid rules={property.rules} />
            </div>
          )}

          {/* Policies */}
          {property.policies && (
            <div className="py-7 border-b border-[#E5DECF]">
              <h2 className="font-display text-[19px] text-[#1E2A23] mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#2F6F62]" /> Policies
              </h2>
              <PolicyAccordion policies={property.policies} />
            </div>
          )}

          {/* Reviews */}
          <div className="py-7">
            <h2 className="font-display text-[19px] text-[#1E2A23] mb-1 flex items-center gap-2">
              <Star size={16} className="fill-[#C99A3D] text-[#C99A3D]" /> {property.average_rating} · {property.total_reviews} review{property.total_reviews === 1 ? "" : "s"}
            </h2>
            {property.reviews.length === 0 ? (
              <p className="text-[13.5px] text-[#9A917D] mt-3">No reviews yet — be the first to stay and share your experience.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {property.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>
        </div>

        <BookingSidebar property={property} onScrollToRooms={scrollToRooms} />
      </main>

      <MobileBookBar property={property} onScrollToRooms={scrollToRooms} />
    </div>
  );
};

export default PropertyDetails;