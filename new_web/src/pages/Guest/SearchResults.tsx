import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Star, Heart, ArrowLeft } from "lucide-react";
import { searchProperties } from "../../lib/api";
import type { PropertySummary} from "../../lib/api";


function ResultCard({ property, onOpen }: { property: PropertySummary; onOpen: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={onOpen} className="text-left group">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E5DECF]">
        {property.cover_image ? (
          <img src={property.cover_image} alt={property.property_name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#9A917D] text-xs">No photo</div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition"
        >
          <Heart size={15} className={saved ? "fill-[#C99A3D] text-[#C99A3D]" : "text-white"} />
        </button>
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

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const location = params.get("location") || "";
  const checkIn = params.get("check_in") || "";
  const checkOut = params.get("check_out") || "";
  const guests = params.get("guests") || "";

  useEffect(() => {
    setLoading(true);
    searchProperties({
      location: location || undefined,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      guests: guests ? Number(guests) : undefined,
    })
      .then((res) => {
        setResults(res.data);
        setTotal(res.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [location, checkIn, checkOut, guests]);

  return (
    <div className="min-h-screen w-full bg-[#F5F2EA]">
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B6354] hover:text-[#1E2A23] mb-5">
          <ArrowLeft size={14} /> Back to search
        </button>

        <h1 className="font-display text-[24px] text-[#1E2A23] mb-1">
          {location ? `Stays in ${location}` : "All stays"}
        </h1>
        <p className="text-[13px] text-[#9A917D] mb-6">
          {checkIn && checkOut ? `${checkIn} → ${checkOut} · ` : ""}
          {guests ? `${guests} guest${guests === "1" ? "" : "s"} · ` : ""}
          {loading ? "Searching…" : `${total} propert${total === 1 ? "y" : "ies"} found`}
        </p>

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
        ) : results.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#DBD3C4] rounded-2xl">
            <p className="text-[15px] font-semibold text-[#1E2A23]">No stays match that search</p>
            <p className="text-[13px] text-[#9A917D] mt-1">Try a different destination, date range, or guest count.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {results.map((property) => (
              <ResultCard key={property.id} property={property} onOpen={() => navigate(`/stay/${property.slug}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
