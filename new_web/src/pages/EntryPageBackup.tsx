import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search, MapPin, Star, Heart, X, ChevronLeft, ChevronRight,
  Home, Building2, BedDouble, Palmtree, Waves, Mountain, Users,
  Wifi, Car, Utensils, Snowflake, Tv, Coffee, ShieldCheck, Clock,
  IndianRupee, Check, ImagePlus, UserCircle2, Cigarette, PawPrint,
  PartyPopper, Baby, ArrowRight, CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------------------------------------------------------
   TOKENS — shared across the Prostayz product
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

// ─── Types ────────────────────────────────────────────────────────────────────

type PropertyType = "Heritage Stay" | "Villa" | "Hostel" | "Boutique Hotel" | "Houseboat" | "Mountain Cabin";

interface DemoRoom {
  id: string;
  name: string;
  category: "private" | "dorm" | "whole_property";
  price: number;
  maxAdults: number;
  sizeSqft: number;
  beds: string;
}

interface DemoProperty {
  id: string;
  name: string;
  type: PropertyType;
  typeIcon: LucideIcon;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  guestFavorite?: boolean;
  images: string[];
  description: string;
  amenities: string[];
  rooms: DemoRoom[];
  checkIn: string;
  checkOut: string;
  rules: { label: string; icon: LucideIcon; allowed: boolean }[];
}

// ─── Demo data — same universe as the vendor listing flow ────────────────────
// (Saffron Bagh Heritage Stay, Udaipur — carried over as the reference listing)

const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Free Wi-Fi": Wifi,
  Parking: Car,
  Restaurant: Utensils,
  "Air Conditioning": Snowflake,
  Television: Tv,
  "Breakfast Included": Coffee,
  "Rooftop Lounge": Building2,
  "Backwater View": Waves,
  "Mountain View": Mountain,
  "Bonfire Deck": Home,
  "Guided Treks": Mountain,
  "Common Kitchen": Utensils,
  "Yoga Deck": Users,
};

const PROPERTIES: DemoProperty[] = [
  {
    id: "saffron-bagh",
    name: "Saffron Bagh Heritage Stay",
    type: "Heritage Stay",
    typeIcon: Building2,
    city: "Udaipur",
    state: "Rajasthan",
    rating: 4.9,
    reviews: 214,
    pricePerNight: 4200,
    guestFavorite: true,
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000&q=80",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1000&q=80",
    ],
    description:
      "A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light over Lake Pichola.",
    amenities: ["Free Wi-Fi", "Restaurant", "Rooftop Lounge", "Air Conditioning", "Parking", "Breakfast Included"],
    rooms: [
      { id: "r1", name: "Heritage Garden Room", category: "private", price: 4200, maxAdults: 2, sizeSqft: 280, beds: "1 Queen Bed" },
      { id: "r2", name: "Lakeview Suite", category: "private", price: 7800, maxAdults: 3, sizeSqft: 420, beds: "1 King Bed, 1 Sofa Bed" },
      { id: "r3", name: "Entire Saffron Bagh Villa", category: "whole_property", price: 28000, maxAdults: 10, sizeSqft: 3200, beds: "3 King, 2 Queen, 2 Single" },
    ],
    checkIn: "13:00",
    checkOut: "11:00",
    rules: [
      { label: "No smoking", icon: Cigarette, allowed: false },
      { label: "Pets on request", icon: PawPrint, allowed: true },
      { label: "No parties", icon: PartyPopper, allowed: false },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
  {
    id: "whispering-palms",
    name: "Whispering Palms Villa",
    type: "Villa",
    typeIcon: Palmtree,
    city: "Assagao",
    state: "Goa",
    rating: 4.95,
    reviews: 168,
    pricePerNight: 18500,
    guestFavorite: true,
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&q=80",
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000&q=80",
      "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?w=1000&q=80",
    ],
    description:
      "A private pool villa tucked behind areca palms in North Goa, five minutes from Assagao's cafe strip. Slow mornings by the water, faster ones on a scooter to Anjuna.",
    amenities: ["Free Wi-Fi", "Parking", "Air Conditioning", "Restaurant"],
    rooms: [
      { id: "r1", name: "Entire Whispering Palms Villa", category: "whole_property", price: 18500, maxAdults: 8, sizeSqft: 2600, beds: "2 King, 2 Queen" },
    ],
    checkIn: "14:00",
    checkOut: "11:00",
    rules: [
      { label: "No smoking indoors", icon: Cigarette, allowed: false },
      { label: "Pets allowed", icon: PawPrint, allowed: true },
      { label: "Small gatherings ok", icon: PartyPopper, allowed: true },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
  {
    id: "backpackers-nest",
    name: "Backpacker's Nest",
    type: "Hostel",
    typeIcon: Users,
    city: "Rishikesh",
    state: "Uttarakhand",
    rating: 4.78,
    reviews: 342,
    pricePerNight: 950,
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1000&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1000&q=80",
    ],
    description:
      "A riverside hostel two minutes from Laxman Jhula, built for people who came for the Ganga and stayed for the community. Bunk beds, a common kitchen, and a bonfire most nights.",
    amenities: ["Free Wi-Fi", "Common Kitchen", "Bonfire Deck", "Yoga Deck"],
    rooms: [
      { id: "r1", name: "Mixed Dorm — Top Bunk", category: "dorm", price: 950, maxAdults: 1, sizeSqft: 40, beds: "1 Bunk (Top)" },
      { id: "r2", name: "Mixed Dorm — Bottom Bunk", category: "dorm", price: 1050, maxAdults: 1, sizeSqft: 40, beds: "1 Bunk (Bottom)" },
      { id: "r3", name: "Private Riverview Room", category: "private", price: 2400, maxAdults: 2, sizeSqft: 160, beds: "1 Double Bed" },
    ],
    checkIn: "12:00",
    checkOut: "10:00",
    rules: [
      { label: "No smoking indoors", icon: Cigarette, allowed: false },
      { label: "Pets not allowed", icon: PawPrint, allowed: false },
      { label: "Quiet after 11 PM", icon: PartyPopper, allowed: false },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
  {
    id: "nilgiri-cloud-cottage",
    name: "Nilgiri Cloud Cottage",
    type: "Mountain Cabin",
    typeIcon: Mountain,
    city: "Coonoor",
    state: "Tamil Nadu",
    rating: 4.92,
    reviews: 96,
    pricePerNight: 5600,
    guestFavorite: true,
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1000&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1000&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=1000&q=80",
    ],
    description:
      "A wood-fired cabin above the tea gardens, wrapped in cloud most mornings. Wake up to eucalyptus air, walk to a working tea estate, and let the fireplace do the rest by evening.",
    amenities: ["Free Wi-Fi", "Parking", "Guided Treks", "Mountain View"],
    rooms: [
      { id: "r1", name: "Cloud Cottage — Double", category: "private", price: 5600, maxAdults: 2, sizeSqft: 300, beds: "1 Queen Bed" },
      { id: "r2", name: "Entire Cloud Cottage", category: "whole_property", price: 9800, maxAdults: 5, sizeSqft: 750, beds: "1 Queen, 2 Single" },
    ],
    checkIn: "13:00",
    checkOut: "10:30",
    rules: [
      { label: "No smoking indoors", icon: Cigarette, allowed: false },
      { label: "Pets on request", icon: PawPrint, allowed: true },
      { label: "No parties", icon: PartyPopper, allowed: false },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
  {
    id: "lotus-backwater",
    name: "Lotus Backwater Houseboat",
    type: "Houseboat",
    typeIcon: Waves,
    city: "Alleppey",
    state: "Kerala",
    rating: 4.88,
    reviews: 187,
    pricePerNight: 8900,
    images: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1000&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&q=80",
    ],
    description:
      "A traditional kettuvallam refitted for slow travel — coir sails, teak decking, and a cook on board for the whole stay. Drift through the backwaters and moor for the night under palm cover.",
    amenities: ["Backwater View", "Restaurant", "Air Conditioning"],
    rooms: [
      { id: "r1", name: "Entire Houseboat — 2 Cabin", category: "whole_property", price: 8900, maxAdults: 4, sizeSqft: 500, beds: "2 Double Beds" },
      { id: "r2", name: "Entire Houseboat — 3 Cabin", category: "whole_property", price: 12500, maxAdults: 6, sizeSqft: 720, beds: "3 Double Beds" },
    ],
    checkIn: "12:00",
    checkOut: "09:00",
    rules: [
      { label: "No smoking indoors", icon: Cigarette, allowed: false },
      { label: "Pets not allowed", icon: PawPrint, allowed: false },
      { label: "No parties", icon: PartyPopper, allowed: false },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
  {
    id: "marigold-haveli",
    name: "Marigold Haveli Suites",
    type: "Boutique Hotel",
    typeIcon: Building2,
    city: "Jaipur",
    state: "Rajasthan",
    rating: 4.85,
    reviews: 259,
    pricePerNight: 6200,
    guestFavorite: true,
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80",
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1000&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000&q=80",
    ],
    description:
      "A pink-city courtyard hotel with hand-painted ceilings and a rooftop that looks straight at Nahargarh Fort. Ten minutes from the bazaars, a world away from the noise.",
    amenities: ["Free Wi-Fi", "Restaurant", "Rooftop Lounge", "Air Conditioning", "Breakfast Included"],
    rooms: [
      { id: "r1", name: "Marigold Deluxe Room", category: "private", price: 6200, maxAdults: 2, sizeSqft: 260, beds: "1 King Bed" },
      { id: "r2", name: "Nahargarh View Suite", category: "private", price: 9400, maxAdults: 3, sizeSqft: 380, beds: "1 King, 1 Single" },
    ],
    checkIn: "14:00",
    checkOut: "11:00",
    rules: [
      { label: "No smoking indoors", icon: Cigarette, allowed: false },
      { label: "Pets not allowed", icon: PawPrint, allowed: false },
      { label: "No parties", icon: PartyPopper, allowed: false },
      { label: "Children welcome", icon: Baby, allowed: true },
    ],
  },
];

const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: "All stays", icon: Home },
  { label: "Heritage Stay", icon: Building2 },
  { label: "Villa", icon: Palmtree },
  { label: "Hostel", icon: Users },
  { label: "Boutique Hotel", icon: BedDouble },
  { label: "Houseboat", icon: Waves },
  { label: "Mountain Cabin", icon: Mountain },
];

// ─── Small UI primitives ───────────────────────────────────────────────────────

function ProstayzMark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Logo slot — swap this div for an <img src="/logo.svg" /> when ready */}
      <div
        className="w-9 h-9 rounded-xl border border-dashed border-[#C99A3D]/60 bg-[#C99A3D]/10 flex items-center justify-center flex-shrink-0"
        aria-label="Prostayz logo"
      >
        <ImagePlus size={15} className="text-[#C99A3D]" />
      </div>
      <span className="font-display text-[20px] text-[#1E2A23] tracking-tight">Prostayz</span>
    </div>
  );
}

function RatingBadge({ rating, reviews, dark }: { rating: number; reviews?: number; dark?: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[13px] font-medium ${dark ? "text-white" : "text-[#1E2A23]"}`}>
      <Star size={12} className="fill-[#C99A3D] text-[#C99A3D]" />
      {rating.toFixed(2)}
      {reviews !== undefined && <span className={dark ? "text-white/70" : "text-[#9A917D]"}>· {reviews} reviews</span>}
    </span>
  );
}

function PropertyTypeModal({ onClose }: { onClose: () => void }) {
  const types = [
    { label: "Villa", icon: Palmtree },
    { label: "Hostel", icon: Users },
    { label: "Apartment", icon: Home },
    { label: "Luxury", icon: Star },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1E2A23]/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-display text-[20px] text-[#1E2A23] mb-5">Select property type</h3>
        <div className="grid grid-cols-2 gap-3">
          {types.map((type) => (
            <button
              key={type.label}
              onClick={() => {
                // Redirect or handle logic here
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-3 p-4 border border-[#E5DECF] rounded-xl hover:border-[#C99A3D] hover:bg-[#F5F2EA] transition"
            >
              <type.icon size={24} className="text-[#2F6F62]" />
              <span className="text-[13px] font-semibold text-[#1E2A23]">{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar({ onListProperty }: { onListProperty: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[#E5DECF]">
      <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
        <ProstayzMark />

        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#6B6354]">
          <a href="#stays" className="text-[#1E2A23] font-semibold border-b-2 border-[#2F6F62] pb-1">
            Stays
          </a>
          <a href="#" className="hover:text-[#1E2A23] transition">
            Experiences
          </a>
          <a href="#" className="hover:text-[#1E2A23] transition">
            About Prostayz
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onListProperty}
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] hover:bg-[#F5F2EA] px-3.5 py-2 rounded-full transition"
          >
            List your property
          </button>
          <button className="w-10 h-10 rounded-full border border-[#E5DECF] flex items-center justify-center text-[#6B6354] hover:border-[#C99A3D] transition">
            <UserCircle2 size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero + search ─────────────────────────────────────────────────────────────

function Hero({
  query, setQuery,
}: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="relative h-[440px] md:h-[500px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1800&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(30,42,35,0.35) 0%, rgba(30,42,35,0.75) 100%)" }}
        />
        <div className="relative h-full max-w-[1280px] mx-auto px-6 flex flex-col justify-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#E8D9B0] font-semibold">
            Handpicked stays across India
          </p>
          <h1 className="font-display text-white text-[38px] sm:text-[48px] md:text-[56px] leading-[1.05] mt-3 max-w-2xl">
            Stays with a story,<br />not just a stamp card.
          </h1>
          <p className="text-white/80 text-[15px] md:text-[16px] mt-4 max-w-lg leading-relaxed">
            Havelis, backwater houseboats, mountain cabins, and hostels — each one chosen by Prostayz, not scraped from a spreadsheet.
          </p>
        </div>
      </div>

      {/* Floating search bar */}
      <div className="relative max-w-[760px] mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl md:rounded-full shadow-xl border border-[#E5DECF] flex flex-col md:flex-row items-stretch md:items-center overflow-hidden">
          <div className="flex-1 flex items-center gap-3 px-6 py-4">
            <Search size={16} className="text-[#9A917D] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D]">Destination</p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'Udaipur' or 'Goa'"
                className="w-full bg-transparent outline-none text-[14px] text-[#1E2A23] placeholder-[#B3AB99] mt-0.5"
              />
            </div>
          </div>
          <div className="hidden md:block w-px h-9 bg-[#EFE9DC]" />
          <div className="flex-1 flex items-center gap-3 px-6 py-4 border-t md:border-t-0 border-[#EFE9DC]">
            <CalendarDays size={16} className="text-[#9A917D] flex-shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D]">Dates</p>
              <p className="text-[14px] text-[#B3AB99] mt-0.5">Add dates</p>
            </div>
          </div>
          <div className="p-2 md:pr-2">
            <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#2F6F62] hover:bg-[#255A4F] text-white text-[13.5px] font-semibold px-6 py-3 rounded-xl md:rounded-full transition">
              <Search size={15} /> Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category chips ─────────────────────────────────────────────────────────────

function CategoryChips({
  active, onChange,
}: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="max-w-[1280px] mx-auto px-6 mt-10 mb-6">
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.label;
          return (
            <button
              key={c.label}
              onClick={() => onChange(c.label)}
              className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-full text-[13px] font-medium border transition ${isActive
                  ? "bg-[#1E2A23] border-[#1E2A23] text-white"
                  : "bg-white border-[#E5DECF] text-[#6B6354] hover:border-[#C99A3D]"
                }`}
            >
              <Icon size={14} className={isActive ? "text-[#C99A3D]" : "text-[#9A917D]"} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Property card ──────────────────────────────────────────────────────────────

function PropertyCard({ property, onOpen }: { property: DemoProperty; onOpen: () => void }) {
  const TypeIcon = property.typeIcon;
  const [saved, setSaved] = useState(false);

  return (
    <button onClick={onOpen} className="text-left group">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E5DECF]">
        <img
          src={property.images[0]}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
        />
        {property.guestFavorite && (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[11px] font-semibold text-[#1E2A23] px-2.5 py-1 rounded-full">
            Guest favourite
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition"
          aria-label="Save"
        >
          <Heart size={15} className={saved ? "fill-[#C99A3D] text-[#C99A3D]" : "text-white"} />
        </button>
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#1E2A23]/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          <TypeIcon size={11} /> {property.type}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-[16.5px] text-[#1E2A23] truncate">{property.name}</h3>
          <p className="text-[12.5px] text-[#9A917D] mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> {property.city}, {property.state}
          </p>
        </div>
        <RatingBadge rating={property.rating} />
      </div>

      <p className="text-[14px] text-[#1E2A23] mt-2">
        <span className="font-semibold font-mono-num">₹{property.pricePerNight.toLocaleString("en-IN")}</span>
        <span className="text-[#9A917D]"> / night</span>
      </p>
    </button>
  );
}

// ─── Property detail overlay ────────────────────────────────────────────────────

function PropertyDetail({ property, onClose }: { property: DemoProperty; onClose: () => void }) {
  const [activeImage, setActiveImage] = useState(0);
  const TypeIcon = property.typeIcon;

  const handleRequest = () => {
    toast.success("This is a demo listing — booking isn't live yet.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E2A23]/70 backdrop-blur-sm p-4">
      <div className="bg-[#F5F2EA] rounded-[24px] shadow-2xl w-full max-w-[980px] max-h-[92vh] overflow-y-auto">
        {/* Gallery */}
        <div className="relative">
          <div className="relative aspect-[16/8] bg-[#E5DECF] rounded-t-[24px] overflow-hidden">
            <img src={property.images[activeImage]} alt={property.name} className="w-full h-full object-cover" />
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + property.images.length) % property.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition"
                >
                  <ChevronLeft size={17} className="text-[#1E2A23]" />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % property.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition"
                >
                  <ChevronRight size={17} className="text-[#1E2A23]" />
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition shadow"
          >
            <X size={17} className="text-[#1E2A23]" />
          </button>
          {property.images.length > 1 && (
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {property.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-1.5 h-1.5 rounded-full transition ${i === activeImage ? "bg-white w-4" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-7 md:p-9">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#2F6F62] bg-[#2F6F62]/8 px-2.5 py-1 rounded-full mb-2.5">
                <TypeIcon size={12} /> {property.type}
              </span>
              <h2 className="font-display text-[27px] text-[#1E2A23] leading-tight">{property.name}</h2>
              <p className="text-[13px] text-[#6B6354] mt-1.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={12} /> {property.city}, {property.state}</span>
                <RatingBadge rating={property.rating} reviews={property.reviews} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">From</p>
              <p className="font-display text-[24px] text-[#1E2A23]">
                ₹{property.pricePerNight.toLocaleString("en-IN")}
                <span className="text-[12px] text-[#9A917D] font-sans font-normal"> / night</span>
              </p>
            </div>
          </div>

          <p className="text-[14px] text-[#6B6354] leading-relaxed mt-5 max-w-3xl">{property.description}</p>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Check-in", value: property.checkIn, icon: Clock },
              { label: "Check-out", value: property.checkOut, icon: Clock },
              { label: "Room types", value: String(property.rooms.length), icon: BedDouble },
              { label: "Max guests", value: String(Math.max(...property.rooms.map((r) => r.maxAdults))), icon: Users },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-[#E5DECF] bg-white px-3.5 py-3">
                <f.icon size={14} className="text-[#9A917D]" />
                <p className="text-[10.5px] uppercase tracking-wide text-[#9A917D] mt-1.5">{f.label}</p>
                <p className="text-[13.5px] font-semibold text-[#1E2A23] font-mono-num">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mt-8 mb-3">What's included</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {property.amenities.map((a) => {
              const Icon = AMENITY_ICONS[a] ?? ShieldCheck;
              return (
                <span key={a} className="flex items-center gap-2 text-[13px] text-[#1E2A23] bg-white border border-[#E5DECF] rounded-xl px-3 py-2.5">
                  <Icon size={15} className="text-[#2F6F62]" /> {a}
                </span>
              );
            })}
          </div>

          {/* Rooms & pricing */}
          <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mt-8 mb-3">Rooms & pricing</p>
          <div className="space-y-2.5">
            {property.rooms.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#E5DECF] bg-white px-4 py-3.5 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1E2A23]">{r.name}</p>
                  <p className="text-[12px] text-[#9A917D] mt-0.5">
                    {r.beds} · {r.sizeSqft} sqft · sleeps {r.maxAdults}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[14.5px] font-semibold text-[#1E2A23] font-mono-num whitespace-nowrap">
                    ₹{r.price.toLocaleString("en-IN")}
                    <span className="text-[11.5px] text-[#9A917D] font-sans font-normal"> /night</span>
                  </p>
                  <button
                    onClick={handleRequest}
                    className="text-[12.5px] font-semibold text-[#2F6F62] border border-[#2F6F62]/30 hover:bg-[#2F6F62]/8 px-3.5 py-2 rounded-lg transition whitespace-nowrap"
                  >
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* House rules */}
          <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mt-8 mb-3">House rules</p>
          <div className="flex flex-wrap gap-2">
            {property.rules.map((rule) => (
              <span
                key={rule.label}
                className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full border ${rule.allowed
                    ? "border-[#2F6F62]/25 text-[#2F6F62] bg-[#2F6F62]/6"
                    : "border-[#DBD3C4] text-[#9A917D]"
                  }`}
              >
                {rule.allowed ? <Check size={12} /> : <X size={12} />}
                {rule.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sticky CTA footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5DECF] px-7 md:px-9 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-[19px] text-[#1E2A23]">
              ₹{property.pricePerNight.toLocaleString("en-IN")}
              <span className="text-[12px] text-[#9A917D] font-sans font-normal"> / night</span>
            </p>
            <p className="text-[11.5px] text-[#9A917D]">Demo listing — no charge will be made.</p>
          </div>
          <button
            onClick={handleRequest}
            className="flex items-center gap-2 bg-[#1E2A23] hover:bg-[#16201A] text-white font-semibold text-[13.5px] px-6 py-3 rounded-xl transition"
          >
            Request to book <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#E5DECF] mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <ProstayzMark />
        <p className="text-[12.5px] text-[#9A917D] text-center sm:text-right">
          © {new Date().getFullYear()} Prostayz. Independently run stays, curated across India.
        </p>
      </div>
    </footer>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

const EntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All stays");
  const [selected, setSelected] = useState<DemoProperty | null>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  // Inside EntryPage component
  // const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return PROPERTIES.filter((p) => {
      const matchesCategory = activeCategory === "All stays" || p.type === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#F5F2EA", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* <Navbar onListProperty={() => navigate("/login")} /> */}
      <Navbar onListProperty={() => setIsListingModalOpen(true)} />
      <Hero query={query} setQuery={setQuery} />
      <CategoryChips active={activeCategory} onChange={setActiveCategory} />

      <main id="stays" className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-[22px] text-[#1E2A23]">
            {activeCategory === "All stays" ? "All stays" : activeCategory}
            <span className="text-[13px] text-[#9A917D] font-sans font-normal ml-2">
              {filtered.length} {filtered.length === 1 ? "property" : "properties"}
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#DBD3C4] rounded-2xl">
            <p className="text-[15px] font-semibold text-[#1E2A23]">No stays match that search</p>
            <p className="text-[13px] text-[#9A917D] mt-1">Try a different destination or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} onOpen={() => setSelected(property)} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {selected && <PropertyDetail property={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default EntryPage;