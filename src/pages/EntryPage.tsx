import { useEffect, useState } from "react";
import {
  Search, MapPin, Star, Heart, UserCircle2, ImagePlus, ArrowRight,
  CalendarDays, Users, Check, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { searchProperties, searchDestinations, PropertySummary, Destination } from "../lib/api";

/* ---------------------------------------------------------
    TOKENS — shared across the Prostayz product (see src/index.css
    for the app-wide font-display / font-mono-num definitions)
    canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
    line    #DBD3C4
--------------------------------------------------------- */

function ProstayzMark() {
  return (
    <div className="flex items-center gap-2.5">
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

interface PropertyTypeModalProps {
  onClose: () => void;
}

export function PropertyTypeModal({ onClose }: PropertyTypeModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  const types = [
    { label: "Villa", imgSrc: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=150&q=80", description: "Luxury private stays" },
    { label: "Hostel", imgSrc: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=150&q=80", description: "Shared living spaces" },
    { label: "Apartment", imgSrc: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=150&q=80", description: "Modern urban lofts" },
    { label: "Luxury", imgSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80", description: "Bespoke elite estates" },
  ];

  const handleContinue = () => {
    if (selectedType) {
      onClose();
      navigate("/login");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#1E2A23]/25 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans antialiased">
      <div className="relative w-full max-w-5xl rounded-[20px] bg-[#FAF9F5] shadow-[0_24px_50px_-16px_rgba(30,42,35,0.1)] text-[#1E2A23] overflow-hidden">
        <button onClick={onClose} className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white hover:bg-gray-100 active:scale-95 shadow-sm border border-gray-200/60 transition-all flex items-center justify-center z-20 group">
          <X size={12} className="text-gray-400 group-hover:text-[#1E2A23]" />
        </button>
        <div className="flex flex-col md:flex-row min-h-0">
          <div className="md:w-[30%] bg-gradient-to-br from-[#2F6F62]/10 to-transparent p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-200/60">
            <div>
              <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-[#2F6F62] bg-[#2F6F62]/10 px-2 py-0.5 rounded-full mb-2">Step 1 of 2</span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-snug text-[#1E2A23]">What's your space vibe?</h2>
            </div>
            <p className="hidden md:block text-[11px] text-gray-400 font-normal leading-relaxed">Select a category to match your listing's true environment.</p>
          </div>
          <div className="md:w-[70%] p-5 md:p-6 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {types.map((type) => {
                const isSelected = selectedType === type.label;
                return (
                  <button
                    key={type.label}
                    onClick={() => setSelectedType(type.label)}
                    className={`group relative w-full rounded-[12px] border p-2.5 transition-all duration-200 flex items-center gap-3 text-left outline-none bg-white ${isSelected ? "border-[#2F6F62] bg-white shadow-[0_8px_16px_-6px_rgba(47,111,98,0.08)] scale-[1.01]" : "border-gray-200/60 hover:border-[#2F6F62]/40"}`}
                  >
                    <div className="relative w-12 h-12 rounded-[8px] overflow-hidden bg-gray-100 shrink-0">
                      <img src={type.imgSrc} alt={type.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex-grow min-w-0 pr-4">
                      <h3 className="text-xs font-bold tracking-wide text-[#1E2A23] group-hover:text-[#2F6F62] transition-colors">{type.label}</h3>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 font-normal">{type.description}</p>
                    </div>
                    <div className={`absolute right-3 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-200 ${isSelected ? "bg-[#2F6F62] border-[#2F6F62] text-white" : "border-gray-200 text-transparent scale-90 group-hover:border-gray-300"}`}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-[10px] text-gray-400 font-normal">All choices redirect to verification logic.</span>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className={`px-5 py-1.5 rounded-md font-medium text-[11px] tracking-wide transition-all duration-300 flex items-center gap-1 ${selectedType ? "bg-[#2F6F62] text-white shadow-sm hover:bg-[#25574D] active:scale-[0.98] cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                <span>Continue</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ onListProperty }: { onListProperty: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[#E5DECF]">
      <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
        <button onClick={() => navigate("/")}><ProstayzMark /></button>
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#6B6354]">
          <a href="#stays" className="text-[#1E2A23] font-semibold border-b-2 border-[#2F6F62] pb-1">Stays</a>
          <a href="#" className="hover:text-[#1E2A23] transition">Experiences</a>
          <a href="#" className="hover:text-[#1E2A23] transition">About Prostayz</a>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onListProperty} className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] hover:bg-[#F5F2EA] px-3.5 py-2 rounded-full transition">
            List your property
          </button>
          <button onClick={() => navigate("/login?mode=login")} className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2A23] hover:bg-[#F5F2EA] px-3.5 py-2 rounded-full transition">
            Login
          </button>
          <button className="w-10 h-10 rounded-full border border-[#E5DECF] flex items-center justify-center text-[#6B6354] hover:border-[#C99A3D] transition">
            <UserCircle2 size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Search bar: location → dates → guests, Airbnb-style ─────────────── */
function SearchBar() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(0);
  const [step, setStep] = useState<"location" | "dates" | "guests" | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (location.trim().length >= 2) {
        searchDestinations(location).then(setSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [location]);

  const runSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests > 0) params.set("guests", String(guests));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative max-w-[760px] mx-auto px-6 -mt-8">
      <div className="bg-white rounded-2xl md:rounded-full shadow-xl border border-[#E5DECF] flex flex-col md:flex-row items-stretch md:items-center overflow-visible">
        {/* Step 1 — Where */}
        <div className="relative flex-1">
          <button
            onClick={() => setStep(step === "location" ? null : "location")}
            className="w-full flex items-center gap-3 px-6 py-4 text-left"
          >
            <Search size={16} className="text-[#9A917D] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D]">Destination</p>
              <p className={`text-[14px] mt-0.5 truncate ${location ? "text-[#1E2A23]" : "text-[#B3AB99]"}`}>
                {location || "Search destinations"}
              </p>
            </div>
          </button>
          {step === "location" && (
            <div className="absolute left-0 top-full mt-2 w-[340px] bg-white rounded-2xl shadow-xl border border-[#E5DECF] p-3 z-30">
              <input
                autoFocus
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Try 'Udaipur' or 'Goa'"
                className="w-full bg-[#F5F2EA] rounded-xl px-3.5 py-2.5 text-[14px] outline-none text-[#1E2A23] placeholder-[#B3AB99]"
              />
              {suggestions.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {suggestions.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => { setLocation(d.city || d.label); setShowSuggestions(false); setStep("dates"); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#F5F2EA] text-left"
                    >
                      <MapPin size={14} className="text-[#9A917D] shrink-0" />
                      <span className="text-[13.5px] text-[#1E2A23]">{d.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:block w-px h-9 bg-[#EFE9DC]" />

        {/* Step 2 — Dates */}
        <div className="relative flex-1">
          <button
            onClick={() => setStep(step === "dates" ? null : "dates")}
            className="w-full flex items-center gap-3 px-6 py-4 border-t md:border-t-0 border-[#EFE9DC] text-left"
          >
            <CalendarDays size={16} className="text-[#9A917D] flex-shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D]">Dates</p>
              <p className={`text-[14px] mt-0.5 ${checkIn ? "text-[#1E2A23]" : "text-[#B3AB99]"}`}>
                {checkIn && checkOut ? `${checkIn} → ${checkOut}` : "Add dates"}
              </p>
            </div>
          </button>
          {step === "dates" && (
            <div className="absolute left-0 top-full mt-2 w-[300px] bg-white rounded-2xl shadow-xl border border-[#E5DECF] p-4 z-30 flex flex-col gap-3">
              <label className="text-[12px] text-[#6B6354]">
                Check-in
                <input type="date" value={checkIn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setCheckIn(e.target.value)} className="w-full mt-1 rounded-xl border border-[#E5DECF] px-3 py-2 text-[13.5px] outline-none" />
              </label>
              <label className="text-[12px] text-[#6B6354]">
                Check-out
                <input type="date" value={checkOut} min={checkIn || new Date().toISOString().slice(0, 10)} onChange={(e) => setCheckOut(e.target.value)} className="w-full mt-1 rounded-xl border border-[#E5DECF] px-3 py-2 text-[13.5px] outline-none" />
              </label>
              <button onClick={() => setStep("guests")} className="text-[12.5px] font-semibold text-[#2F6F62] self-end">Next: Guests</button>
            </div>
          )}
        </div>

        <div className="hidden md:block w-px h-9 bg-[#EFE9DC]" />

        {/* Step 3 — Guests */}
        <div className="relative flex-1">
          <button
            onClick={() => setStep(step === "guests" ? null : "guests")}
            className="w-full flex items-center gap-3 px-6 py-4 border-t md:border-t-0 border-[#EFE9DC] text-left"
          >
            <Users size={16} className="text-[#9A917D] flex-shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A917D]">Guests</p>
              <p className={`text-[14px] mt-0.5 ${guests > 0 ? "text-[#1E2A23]" : "text-[#B3AB99]"}`}>
                {guests > 0 ? `${guests} guest${guests === 1 ? "" : "s"}` : "Add guests"}
              </p>
            </div>
          </button>
          {step === "guests" && (
            <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-2xl shadow-xl border border-[#E5DECF] p-4 z-30">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] text-[#1E2A23]">Guests</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setGuests((g) => Math.max(0, g - 1))} className="w-7 h-7 rounded-full border border-[#DBD3C4] text-[#1E2A23]">−</button>
                  <span className="w-5 text-center text-[13.5px] font-mono-num">{guests}</span>
                  <button onClick={() => setGuests((g) => g + 1)} className="w-7 h-7 rounded-full border border-[#DBD3C4] text-[#1E2A23]">+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-2 md:pr-2">
          <button onClick={() => { setStep(null); runSearch(); }} className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#2F6F62] hover:bg-[#255A4F] text-white text-[13.5px] font-semibold px-6 py-3 rounded-xl md:rounded-full transition">
            <Search size={15} /> Search
          </button>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative">
      <div className="relative h-[440px] md:h-[500px] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(30,42,35,0.35) 0%, rgba(30,42,35,0.75) 100%)" }} />
        <div className="relative max-w-[1280px] mx-auto px-6 h-full flex flex-col justify-center pb-20">
          <h1 className="font-display text-white text-[36px] md:text-[48px] leading-[1.05] max-w-xl">
            Stays chosen for the story, not the spreadsheet.
          </h1>
          <p className="text-white/80 text-[14.5px] mt-3 max-w-md">
            Havelis, backwater houseboats, mountain cabins, and hostels — each one chosen by Prostayz, not scraped from a spreadsheet.
          </p>
        </div>
      </div>
      <SearchBar />
    </div>
  );
}

function PropertyCard({ property, onOpen }: { property: PropertySummary; onOpen: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={onOpen} className="text-left group">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E5DECF]">
        {property.cover_image ? (
          <img src={property.cover_image} alt={property.property_name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#9A917D] text-xs">No photo yet</div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition"
          aria-label="Save"
        >
          <Heart size={15} className={saved ? "fill-[#C99A3D] text-[#C99A3D]" : "text-white"} />
        </button>
        {property.property_type_name && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#1E2A23]/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            {property.property_type_name}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-[16.5px] text-[#1E2A23] truncate">{property.property_name}</h3>
          <p className="text-[12.5px] text-[#9A917D] mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> {[property.city, property.state].filter(Boolean).join(", ")}
          </p>
        </div>
        {property.star_rating > 0 && (
          <span className="flex items-center gap-1 text-[13px] font-medium text-[#1E2A23] shrink-0">
            <Star size={12} className="fill-[#C99A3D] text-[#C99A3D]" /> {property.star_rating}
          </span>
        )}
      </div>
      <p className="text-[14px] text-[#1E2A23] mt-2">
        <span className="font-semibold font-mono-num">₹{Number(property.min_price ?? 0).toLocaleString("en-IN")}</span>
        <span className="text-[#9A917D]"> / night</span>
      </p>
    </button>
  );
}

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

const EntryPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  useEffect(() => {
    searchProperties({ limit: 12, sort: "newest" })
      .then((res) => setProperties(res.data))
      .catch(() => toast.error("Couldn't load stays right now"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F5F2EA]">
      <Navbar onListProperty={() => setIsListingModalOpen(true)} />
      <Hero />

      <main id="stays" className="max-w-[1280px] mx-auto px-6 pt-10 pb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-[22px] text-[#1E2A23]">
            Featured stays
            <span className="text-[13px] text-[#9A917D] font-sans font-normal ml-2">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-2xl bg-[#E5DECF]" />
                <div className="h-4 bg-[#E5DECF] rounded mt-3 w-3/4" />
                <div className="h-3 bg-[#E5DECF] rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#DBD3C4] rounded-2xl">
            <p className="text-[15px] font-semibold text-[#1E2A23]">No stays live yet</p>
            <p className="text-[13px] text-[#9A917D] mt-1">Check back soon, or list your own property.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} onOpen={() => navigate(`/stay/${property.slug}`)} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      {isListingModalOpen && <PropertyTypeModal onClose={() => setIsListingModalOpen(false)} />}
    </div>
  );
};

export default EntryPage;
