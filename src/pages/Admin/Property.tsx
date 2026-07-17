import { useEffect, useState, useCallback, type ReactNode } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Building2,
  BedDouble,
  Star,
  Phone,
  Mail,
  Globe,
  Clock,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Waves,
  Dumbbell,
  Utensils,
  Coffee,
  Brush,
  ShieldCheck,
  Circle,
  CheckCircle2,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS — shared with the rest of the vendor flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4   rust #B3452E
--------------------------------------------------------- */

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// property_images live at /uploads/{propertyId}/{filename}
// room_images live at    /uploads/{propertyId}/rooms/{filename}
const propertyAssetUrl = (propertyId: number, filename: string | null) =>
  filename ? `${backendUrl}/uploads/properties/${propertyId}/${filename}` : "";

const roomAssetUrl = (propertyId: number, filename: string | null) =>
  filename ? `${backendUrl}/uploads/properties/${propertyId}/rooms/${filename}` : "";

const AMENITY_ICONS: Record<string, any> = {
  Wifi,
  Car,
  Snowflake,
  Tv,
  Waves,
  Dumbbell,
  Utensils,
  Coffee,
  Brush,
  ShieldCheck,
};

/* ---------------------------------------------------------
   Types
--------------------------------------------------------- */

type PropertyListRow = {
  id: number;
  property_name: string;
  slug: string | null;
  star_rating: number;
  status: "draft" | "pending" | "approved" | "rejected";
  is_featured: 0 | 1;
  total_rooms: number;
  min_price: string | null;
  max_price: string | null;
  created_at: string | null;
  property_type: string | null;
  vendor_id: number;
  vendor_name: string;
  business_name: string | null;
  vendor_email: string | null;
  vendor_phone: string;
  city: string | null;
  state: string | null;
  country: string | null;
  area: string | null;
  cover_image: string | null;
};

type ListResponse = {
  success: boolean;
  total: number;
  current_page: number;
  total_pages: number;
  properties: PropertyListRow[];
  message?: string;
};

type ImageRow = { id: number; image: string; is_cover: 0 | 1; sort_order: number };
type AmenityRow = { id: number; name: string; icon: string | null };

type RoomBed = { id: number; room_id: number; bed_type: string; quantity: number };
type RoomDormBed = {
  id: number;
  room_id: number;
  bed_label: string;
  bed_type: string;
  status: "available" | "blocked" | "maintenance";
  price: string;
};
type RoomPrice = {
  room_id: number;
  price: string | null;
  weekend_price: string | null;
  extra_guest_price: string | null;
  tax: string | null;
};
type RoomRow = {
  id: number;
  room_name: string | null;
  room_type: string | null;
  room_category: "private" | "dorm" | "whole_property";
  max_adults: number | null;
  max_children: number | null;
  total_rooms: number | null;
  available_rooms: number | null;
  room_size: number | null;
  room_size_unit: "sqft" | "sqm" | null;
  private_bathroom: 0 | 1 | null;
  balcony: 0 | 1 | null;
  air_conditioning: 0 | 1 | null;
  description: string | null;
  beds: RoomBed[];
  dorm_beds: RoomDormBed[];
  images: ImageRow[];
  price: RoomPrice | null;
};

type PropertyDetail = {
  id: number;
  property_name: string;
  description: string | null;
  star_rating: number;
  contact_name: string | null;
  contact_number: string | null;
  email: string | null;
  website: string | null;
  check_in: string | null;
  check_out: string | null;
  total_rooms: number;
  min_price: string | null;
  max_price: string | null;
  status: "draft" | "pending" | "approved" | "rejected";
  is_featured: 0 | 1;
  property_type: string | null;
  vendor_id: number;
  vendor_name: string;
  vendor_business_name: string | null;
  vendor_email: string | null;
  vendor_phone: string;
  vendor_status: string;
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
  smoking_allowed: 0 | 1 | null;
  pets_allowed: 0 | 1 | null;
  parties_allowed: 0 | 1 | null;
  couples_allowed: 0 | 1 | null;
  children_allowed: 0 | 1 | null;
  completed_percentage: number | null;
  is_completed: 0 | 1 | null;
  progress: Record<string, boolean> | null;
  created_at: string | null;
};

type DetailResponse = {
  success: boolean;
  property: PropertyDetail;
  images: ImageRow[];
  amenities: AmenityRow[];
  rooms: RoomRow[];
  message?: string;
};
{/* <img alt="Saffron Bagh Heritage Stay" class="w-full h-full object-cover" src="http://localhost:51234/uploads/7/1783158996576-651857591.jpg"></img> */}
/* ---------------------------------------------------------
   Small helpers
--------------------------------------------------------- */

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-[#2F6F62]/10 text-[#2F6F62] border-[#2F6F62]/25",
  pending: "bg-[#C99A3D]/10 text-[#C99A3D] border-[#C99A3D]/25",
  rejected: "bg-[#B3452E]/10 text-[#B3452E] border-[#B3452E]/25",
  draft: "bg-[#9A917D]/10 text-[#6B6354] border-[#9A917D]/25",
};

const STATUS_FILTERS = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const PROGRESS_LABELS: Record<string, string> = {
  basic_info: "Basic info",
  location: "Location",
  photos: "Photos",
  amenities: "Amenities",
  policies: "Policies",
  rules: "House rules",
  rooms: "Rooms",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
        STATUS_STYLES[status] || "bg-[#EFE9DC] text-[#6B6354] border-[#DBD3C4]"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function StarsDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < value ? "fill-[#C99A3D] text-[#C99A3D]" : "text-[#DBD3C4]"}
        />
      ))}
    </div>
  );
}

function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
          className="p-0.5"
          aria-label={`${i + 1} star`}
        >
          <Star
            size={18}
            className={i < value ? "fill-[#C99A3D] text-[#C99A3D]" : "text-[#DBD3C4] hover:text-[#C99A3D] transition"}
          />
        </button>
      ))}
    </div>
  );
}

function AmenityChip({ name, icon }: { name: string; icon: string | null }) {
  const Icon = (icon && AMENITY_ICONS[icon]) || Circle;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DECF] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4A4438]">
      <Icon size={13} className="text-[#2F6F62]" />
      {name}
    </span>
  );
}

function FeatureChip({ label, active }: { label: string; active: boolean | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium ${
        active
          ? "border-[#2F6F62]/25 bg-[#2F6F62]/10 text-[#2F6F62]"
          : "border-[#DBD3C4] bg-white text-[#9A917D]"
      }`}
    >
      {active ? <Check size={12} /> : <X size={12} />}
      {label}
    </span>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5DECF] bg-white/70 p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={15} className="text-[#C99A3D]" />}
        <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#6B6354]">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   List item (left column)
--------------------------------------------------------- */

function PropertyListItem({
  row,
  active,
  onClick,
}: {
  row: PropertyListRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 flex gap-3 transition ${
        active ? "border-[#C99A3D] bg-[#C99A3D]/8" : "border-[#E5DECF] bg-white/60 hover:border-[#C99A3D]/50"
      }`}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#EAE4D6] flex-shrink-0 flex items-center justify-center">
        {row.cover_image ? (
          <img src={propertyAssetUrl(row.id, row.cover_image)} alt={row.property_name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={16} className="text-[#B3AB99]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13.5px] font-semibold text-[#1E2A23] truncate">{row.property_name}</p>
        </div>
        <p className="text-[11.5px] text-[#9A917D] truncate mb-1">
          {row.business_name || row.vendor_name}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={row.status} />
          {row.city && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9A917D]">
              <MapPin size={11} /> {row.city}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------
   Room card (detail column)
--------------------------------------------------------- */

function RoomCard({ room, propertyId }: { room: RoomRow; propertyId: number }) {
  return (
    <div className="rounded-xl border border-[#E5DECF] bg-white p-4">
      {room.images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {room.images.map((img) => (
            <div
              key={img.id}
              className={`w-16 h-16 rounded-lg overflow-hidden bg-[#EAE4D6] flex-shrink-0 ${
                img.is_cover ? "ring-2 ring-[#C99A3D]" : ""
              }`}
            >
              <img
                src={roomAssetUrl(propertyId, img.image)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[13.5px] font-semibold text-[#1E2A23]">{room.room_name || "Unnamed room"}</p>
          <p className="text-[11.5px] text-[#9A917D] capitalize">
            {room.room_type} · {room.room_category.replace("_", " ")}
          </p>
        </div>
        {room.price?.price && (
          <div className="text-right flex-shrink-0">
            <p className="font-mono-num text-[14px] font-semibold text-[#1E2A23]">
              {formatCurrency(room.price.price)}
            </p>
            <p className="text-[10.5px] text-[#9A917D]">per night</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {room.max_adults !== null && (
          <FeatureChip label={`${room.max_adults} adult${room.max_adults === 1 ? "" : "s"}`} active />
        )}
        {!!room.max_children && <FeatureChip label={`${room.max_children} children`} active />}
        {room.room_size && <FeatureChip label={`${room.room_size} ${room.room_size_unit || "sqft"}`} active />}
        <FeatureChip label="Private bathroom" active={!!room.private_bathroom} />
        <FeatureChip label="Balcony" active={!!room.balcony} />
        <FeatureChip label="AC" active={!!room.air_conditioning} />
        <FeatureChip
          label={`${room.available_rooms ?? 0}/${room.total_rooms ?? 0} available`}
          active={(room.available_rooms ?? 0) > 0}
        />
      </div>

      {room.beds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {room.beds.map((b) => (
            <span key={b.id} className="text-[11px] text-[#4A4438] bg-[#F5F2EA] rounded-md px-2 py-1">
              {b.quantity}× {b.bed_type}
            </span>
          ))}
        </div>
      )}

      {room.dorm_beds.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {room.dorm_beds.map((bed) => (
            <div
              key={bed.id}
              className="rounded-lg border border-[#E5DECF] px-2.5 py-2 text-[11px]"
            >
              <p className="font-medium text-[#1E2A23] truncate">{bed.bed_label}</p>
              <p className="text-[#9A917D] mb-1">{bed.bed_type}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`capitalize text-[10px] font-semibold ${
                    bed.status === "available" ? "text-[#2F6F62]" : "text-[#B3452E]"
                  }`}
                >
                  {bed.status}
                </span>
                <span className="font-mono-num text-[11px] text-[#1E2A23]">{formatCurrency(bed.price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {room.description && <p className="text-[12px] text-[#6B6354] mt-3 leading-relaxed">{room.description}</p>}
    </div>
  );
}

/* ---------------------------------------------------------
   Main
--------------------------------------------------------- */

const Property = () => {
  // list state
  const [rows, setRows] = useState<PropertyListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // detail state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // edit state
  const [editStatus, setEditStatus] = useState<string>("draft");
  const [editRating, setEditRating] = useState(0);
  const [editFeatured, setEditFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const { data } = await axios.get<ListResponse>(`${backendUrl}/api/admin/properties`, {
        params: { page, limit, search, status },
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message || "Could not load properties");
      setRows(data.properties);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      setListError(err?.response?.data?.message || err.message || "Could not load properties");
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setDetailError(null);
    setSaved(false);
    setSaveError(null);
    try {
      const { data } = await axios.get<DetailResponse>(`${backendUrl}/api/admin/properties/${id}`, {
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message || "Could not load property");
      setDetail(data);
      setEditStatus(data.property.status);
      setEditRating(data.property.star_rating || 0);
      setEditFeatured(!!data.property.is_featured);
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || err.message || "Could not load property");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId !== null) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  const isDirty =
    !!detail &&
    (editStatus !== detail.property.status ||
      editRating !== (detail.property.star_rating || 0) ||
      editFeatured !== !!detail.property.is_featured);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/properties/${detail.property.id}`,
        { status: editStatus, star_rating: editRating, is_featured: editFeatured },
        { withCredentials: true }
      );
      if (!data.success) throw new Error(data.message || "Could not save changes");

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              property: {
                ...prev.property,
                status: data.property.status,
                star_rating: data.property.star_rating,
                is_featured: data.property.is_featured,
              },
            }
          : prev
      );
      setRows((prev) =>
        prev.map((r) =>
          r.id === detail.property.id
            ? { ...r, status: data.property.status, star_rating: data.property.star_rating, is_featured: data.property.is_featured }
            : r
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D] mb-1">
          {total} total
        </p>
        <h2 className="font-display text-[24px] text-[#1E2A23]">Properties</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ---------------- LIST (left) ---------------- */}
        <div className={`w-full lg:w-[380px] flex-shrink-0 ${selectedId !== null ? "hidden lg:block" : ""}`}>
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Property, vendor, email, city…"
                className="w-full rounded-lg border border-[#DBD3C4] bg-white pl-9 pr-8 py-2.5 text-[13px] text-[#1E2A23] placeholder:text-[#B3AB99] outline-none focus:border-[#C99A3D] transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B3AB99] hover:text-[#6B6354]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative">
              <SlidersHorizontal
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99] pointer-events-none"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-[#DBD3C4] bg-white pl-8 pr-8 py-2.5 text-[13px] text-[#1E2A23] outline-none focus:border-[#C99A3D] transition cursor-pointer"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {listLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[76px] rounded-xl bg-[#EAE4D6] animate-pulse" />
              ))}

            {!listLoading && listError && (
              <div className="rounded-xl border border-[#B3452E]/25 bg-[#B3452E]/8 p-4 text-center">
                <p className="text-[12.5px] text-[#B3452E] mb-2">{listError}</p>
                <button
                  onClick={fetchList}
                  className="rounded-lg bg-[#1E2A23] text-white text-[12px] font-semibold px-3 py-1.5 hover:bg-[#16201A] transition"
                >
                  Try again
                </button>
              </div>
            )}

            {!listLoading && !listError && rows.length === 0 && (
              <div className="rounded-xl border border-[#E5DECF] bg-white/60 p-6 text-center">
                <p className="text-[13px] font-medium text-[#1E2A23] mb-1">No properties found</p>
                <p className="text-[12px] text-[#9A917D]">Try a different search or filter.</p>
              </div>
            )}

            {!listLoading &&
              !listError &&
              rows.map((row) => (
                <PropertyListItem
                  key={row.id}
                  row={row}
                  active={row.id === selectedId}
                  onClick={() => setSelectedId(row.id)}
                />
              ))}
          </div>

          {!listLoading && !listError && rows.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] text-[#9A917D]">
                {showingFrom}–{showingTo} of {total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-lg border border-[#DBD3C4] bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C99A3D] transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[12px] font-medium text-[#1E2A23] px-1">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg border border-[#DBD3C4] bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C99A3D] transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- DETAIL (right) ---------------- */}
        <div className={`flex-1 min-w-0 ${selectedId === null ? "hidden lg:block" : ""}`}>
          {selectedId === null && (
            <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/40 flex flex-col items-center justify-center py-24 text-center">
              <Building2 size={28} className="text-[#B3AB99] mb-3" />
              <p className="text-[13.5px] font-medium text-[#1E2A23] mb-1">Select a property</p>
              <p className="text-[12px] text-[#9A917D]">Pick one from the list to see full details.</p>
            </div>
          )}

          {selectedId !== null && (
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden flex items-center gap-1.5 text-[12.5px] font-medium text-[#4A4438] mb-4"
              >
                <ArrowLeft size={14} /> Back to list
              </button>

              {detailLoading && (
                <div className="flex items-center justify-center py-24 text-[#9A917D] gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[13px]">Loading property…</span>
                </div>
              )}

              {!detailLoading && detailError && (
                <div className="rounded-2xl border border-[#B3452E]/25 bg-[#B3452E]/8 p-8 text-center">
                  <p className="text-[13px] text-[#B3452E] mb-3">{detailError}</p>
                  <button
                    onClick={() => fetchDetail(selectedId)}
                    className="rounded-lg bg-[#1E2A23] text-white text-[12.5px] font-semibold px-4 py-2 hover:bg-[#16201A] transition"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!detailLoading && !detailError && detail && (
                <div className="space-y-5">
                  {/* Cover + header */}
                  <div className="rounded-2xl border border-[#E5DECF] bg-white/70 overflow-hidden">
                    <div className="h-52 bg-[#EAE4D6] flex items-center justify-center overflow-hidden">
                      {detail.images.find((i) => i.is_cover) || detail.images[0] ? (
                        <img
                          src={propertyAssetUrl(detail.property.id, (detail.images.find((i) => i.is_cover) || detail.images[0]).image)}
                          alt={detail.property.property_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={28} className="text-[#B3AB99]" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C99A3D] mb-1">
                            {detail.property.property_type || "Property"}
                          </p>
                          <h3 className="font-display text-[22px] text-[#1E2A23] leading-tight">
                            {detail.property.property_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={detail.property.status} />
                          {!!detail.property.is_featured && (
                            <span className="text-[11px] font-semibold text-[#C99A3D] bg-[#C99A3D]/10 border border-[#C99A3D]/25 rounded-full px-2.5 py-1">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <StarsDisplay value={detail.property.star_rating} />
                        {detail.property.city && (
                          <span className="inline-flex items-center gap-1 text-[12.5px] text-[#6B6354]">
                            <MapPin size={13} className="text-[#B3AB99]" />
                            {[detail.property.area, detail.property.city, detail.property.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                        <span className="text-[12.5px] text-[#6B6354]">
                          {formatCurrency(detail.property.min_price)}–{formatCurrency(detail.property.max_price)}
                        </span>
                      </div>
                      {detail.property.description && (
                        <p className="text-[13px] text-[#4A4438] leading-relaxed mt-3">
                          {detail.property.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit panel */}
                  <div className="rounded-2xl border border-[#C99A3D]/30 bg-[#C99A3D]/5 p-5">
                    <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#6B6354] mb-4">
                      Review &amp; update
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-1.5">
                          Status
                        </span>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full rounded-lg border border-[#DBD3C4] bg-white px-3 py-2.5 text-[13px] text-[#1E2A23] outline-none focus:border-[#C99A3D] transition cursor-pointer"
                        >
                          <option value="draft">Draft</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-1.5">
                          Star rating
                        </span>
                        <div className="pt-1.5">
                          <StarsInput value={editRating} onChange={setEditRating} />
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-1.5">
                          Featured
                        </span>
                        <button
                          onClick={() => setEditFeatured((v) => !v)}
                          className={`w-11 h-6 rounded-full transition relative ${
                            editFeatured ? "bg-[#2F6F62]" : "bg-[#DBD3C4]"
                          }`}
                          aria-pressed={editFeatured}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                              editFeatured ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {saveError && (
                      <p className="text-[12.5px] text-[#B3452E] bg-[#B3452E]/8 border border-[#B3452E]/20 rounded-lg px-3 py-2 mb-3">
                        {saveError}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className="flex items-center gap-2 rounded-lg bg-[#1E2A23] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#16201A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saved ? (
                          <>
                            <Check size={14} /> Saved
                          </>
                        ) : saving ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Saving…
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </button>
                      {isDirty && !saving && (
                        <button
                          onClick={() => {
                            setEditStatus(detail.property.status);
                            setEditRating(detail.property.star_rating || 0);
                            setEditFeatured(!!detail.property.is_featured);
                          }}
                          className="text-[12.5px] font-medium text-[#9A917D] hover:text-[#6B6354] transition"
                        >
                          Discard changes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vendor + contact + address */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Section title="Vendor" icon={Building2}>
                      <p className="text-[13.5px] font-semibold text-[#1E2A23] mb-0.5">
                        {detail.property.vendor_business_name || detail.property.vendor_name}
                      </p>
                      <p className="text-[12px] text-[#9A917D] mb-3">{detail.property.vendor_name}</p>
                      <div className="space-y-1.5 text-[12.5px] text-[#4A4438]">
                        {detail.property.vendor_email && (
                          <p className="flex items-center gap-2">
                            <Mail size={13} className="text-[#B3AB99]" /> {detail.property.vendor_email}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Phone size={13} className="text-[#B3AB99]" /> {detail.property.vendor_phone}
                        </p>
                      </div>
                    </Section>

                    <Section title="Contact & timing" icon={Clock}>
                      <div className="space-y-1.5 text-[12.5px] text-[#4A4438]">
                        {detail.property.contact_name && <p>{detail.property.contact_name}</p>}
                        {detail.property.contact_number && (
                          <p className="flex items-center gap-2">
                            <Phone size={13} className="text-[#B3AB99]" /> {detail.property.contact_number}
                          </p>
                        )}
                        {detail.property.email && (
                          <p className="flex items-center gap-2">
                            <Mail size={13} className="text-[#B3AB99]" /> {detail.property.email}
                          </p>
                        )}
                        {detail.property.website && (
                          <p className="flex items-center gap-2">
                            <Globe size={13} className="text-[#B3AB99]" /> {detail.property.website}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Clock size={13} className="text-[#B3AB99]" />
                          Check-in {detail.property.check_in || "—"} · Check-out {detail.property.check_out || "—"}
                        </p>
                      </div>
                    </Section>
                  </div>

                  {detail.property.address && (
                    <Section title="Address" icon={MapPin}>
                      <p className="text-[12.5px] text-[#4A4438] leading-relaxed">
                        {detail.property.address}
                        {detail.property.landmark ? ` — near ${detail.property.landmark}` : ""}
                        <br />
                        {[detail.property.city, detail.property.state, detail.property.country, detail.property.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </Section>
                  )}

                  {/* Images */}
                  {detail.images.length > 0 && (
                    <Section title="Photos" icon={ImageIcon}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {detail.images.map((img) => (
                          <div
                            key={img.id}
                            className={`aspect-square rounded-lg overflow-hidden bg-[#EAE4D6] relative ${
                              img.is_cover ? "ring-2 ring-[#C99A3D]" : ""
                            }`}
                          >
                            <img src={propertyAssetUrl(detail.property.id, img.image)} alt="" className="w-full h-full object-cover" />
                            {!!img.is_cover && (
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-wide bg-[#C99A3D] text-white rounded px-1.5 py-0.5">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Amenities */}
                  {detail.amenities.length > 0 && (
                    <Section title="Amenities">
                      <div className="flex flex-wrap gap-2">
                        {detail.amenities.map((a) => (
                          <AmenityChip key={a.id} name={a.name} icon={a.icon} />
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Rules */}
                  <Section title="House rules">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <FeatureChip label="Smoking" active={!!detail.property.smoking_allowed} />
                      <FeatureChip label="Pets" active={!!detail.property.pets_allowed} />
                      <FeatureChip label="Parties" active={!!detail.property.parties_allowed} />
                      <FeatureChip label="Couples" active={!!detail.property.couples_allowed} />
                      <FeatureChip label="Children" active={!!detail.property.children_allowed} />
                    </div>
                    {detail.property.house_rules && (
                      <p className="text-[12.5px] text-[#4A4438] leading-relaxed">{detail.property.house_rules}</p>
                    )}
                  </Section>

                  {/* Policies */}
                  {(detail.property.cancellation_policy || detail.property.refund_policy) && (
                    <Section title="Policies">
                      <div className="space-y-3">
                        {detail.property.cancellation_policy && (
                          <div>
                            <p className="text-[11.5px] font-semibold text-[#1E2A23] mb-1">Cancellation</p>
                            <p className="text-[12.5px] text-[#6B6354] leading-relaxed">
                              {detail.property.cancellation_policy}
                            </p>
                          </div>
                        )}
                        {detail.property.refund_policy && (
                          <div>
                            <p className="text-[11.5px] font-semibold text-[#1E2A23] mb-1">Refunds</p>
                            <p className="text-[12.5px] text-[#6B6354] leading-relaxed">
                              {detail.property.refund_policy}
                            </p>
                          </div>
                        )}
                      </div>
                    </Section>
                  )}

                  {/* Rooms */}
                  {detail.rooms.length > 0 && (
                    <Section title={`Rooms (${detail.rooms.length})`} icon={BedDouble}>
                      <div className="space-y-3">
                        {detail.rooms.map((room) => (
                          <RoomCard key={room.id} room={room} propertyId={detail.property.id} />
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Listing progress */}
                  {detail.property.progress && (
                    <Section title="Listing completeness">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] text-[#6B6354]">
                            {detail.property.completed_percentage ?? 0}% complete
                          </span>
                          {!!detail.property.is_completed && (
                            <span className="text-[11px] font-semibold text-[#2F6F62]">Ready for review</span>
                          )}
                        </div>
                        <div className="h-2 rounded-full bg-[#EAE4D6] overflow-hidden">
                          <div
                            className="h-full bg-[#2F6F62] transition-all"
                            style={{ width: `${detail.property.completed_percentage ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(detail.property.progress).map(([key, done]) => (
                          <span key={key} className="flex items-center gap-1.5 text-[12px] text-[#4A4438]">
                            {done ? (
                              <CheckCircle2 size={14} className="text-[#2F6F62]" />
                            ) : (
                              <Circle size={14} className="text-[#DBD3C4]" />
                            )}
                            {PROGRESS_LABELS[key] || key}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  <p className="text-[11.5px] text-[#B3AB99] text-center pt-1">
                    Listed on {formatDate(detail.property.created_at)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Property;
