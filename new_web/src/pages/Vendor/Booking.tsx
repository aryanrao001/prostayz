import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  BedDouble,
  DoorOpen,
  Home,
  Users,
  Moon,
  Phone,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  BadgeCheck,
  Ticket,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

/* ---------------------------------------------------------
   Same tokens as VendorMain / ListingDetails:
   canvas #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line   #E5DECF   rust #B3452E
   Fonts: .font-display (Fraunces)  ·  .font-mono-num (JetBrains Mono)
--------------------------------------------------------- */

type BookingStatus = "confirmed" | "pending" | "checked_in" | "completed" | "cancelled";
type BookingType = "whole_property" | "whole_room" | "dorm_bed";

interface Booking {
  id: string;
  ref: string;
  guest: string;
  phone: string;
  property: string;
  propertyId: string;
  roomName: string;
  bookingType: BookingType;
  bedLabel?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  amount: number;
  amountPaid: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: string;
}

interface VendorProperty {
  id: string;
  name: string;
}

/* ---------------------------------------------------------
   Backend → UI mapping
--------------------------------------------------------- */

const BOOKING_STATUS_MAP: Record<string, BookingStatus> = {
  pending: "pending",
  confirmed: "confirmed",
  checked_in: "checked_in",
  checked_out: "completed",
  cancelled: "cancelled",
  no_show: "cancelled",
};

function mapApiBookingToUi(b: any): Booking {
  // rooms[] comes from booking_rooms joined with rooms + room_dorm_beds.
  // A booking can theoretically span multiple room rows; the card shows the
  // primary one and — if there's more than one — a "+N more" is folded into roomName.
  const primaryRoom = b.rooms?.[0];
  const extraRoomCount = (b.rooms?.length || 1) - 1;

  let bookingType: BookingType = "whole_room";
  if (primaryRoom?.room_category === "whole_property") bookingType = "whole_property";
  else if (primaryRoom?.dorm_bed_id) bookingType = "dorm_bed";

  const amountPaid = (b.payments || [])
    .filter((p: any) => p.status === "success" && p.payment_type !== "refund")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return {
    id: String(b.id),
    ref: b.booking_number,
    guest: [b.user_first_name, b.user_last_name].filter(Boolean).join(" ") || b.contact_name || "Guest",
    phone: b.contact_phone || b.user_phone || "—",
    property: b.property_name,
    propertyId: String(b.property_id),
    roomName: primaryRoom
      ? `${primaryRoom.room_name}${extraRoomCount > 0 ? ` +${extraRoomCount} more` : ""}`
      : "Room unavailable",
    bookingType,
    bedLabel: primaryRoom?.bed_label || undefined,
    checkIn: b.check_in_date,
    checkOut: b.check_out_date,
    nights: b.nights,
    adults: b.adults,
    children: b.children,
    amount: Number(b.total_amount),
    amountPaid,
    currency: b.currency || "INR",
    status: BOOKING_STATUS_MAP[b.booking_status] || "pending",
    paymentStatus: b.payment_status,
  };
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; text: string; bg: string; ring: string; icon: any }
> = {
  confirmed: { label: "Confirmed", text: "#2F6F62", bg: "#E7F0EC", ring: "#CFE1DA", icon: CheckCircle2 },
  pending: { label: "Pending", text: "#95721E", bg: "#FBF0DA", ring: "#EAD2A1", icon: Clock3 },
  checked_in: { label: "Checked in", text: "#1E2A23", bg: "#FDECD9", ring: "#C99A3D", icon: BadgeCheck },
  completed: { label: "Completed", text: "#6B6354", bg: "#EFEAE0", ring: "#DBD3C4", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", text: "#B3452E", bg: "#F6E4DF", ring: "#F0C9BC", icon: XCircle },
};

const AVATAR_PALETTE = ["#2F6F62", "#C99A3D", "#B3452E", "#5B6B85"];
function avatarColor(name: string) {
  const sum = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function currencySymbol(code: string) {
  return code === "USD" ? "$" : code === "AED" ? "AED " : "₹";
}

const TABS: { key: string; label: string; match: (s: BookingStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "upcoming", label: "Upcoming", match: (s) => s === "confirmed" || s === "pending" },
  { key: "checked_in", label: "Checked in", match: (s) => s === "checked_in" },
  { key: "completed", label: "Completed", match: (s) => s === "completed" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];

const Booking = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<VendorProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Step 1 — fetch the vendor's properties, so we know what to scope bookings by
  // and can label the property filter with real names.
  const fetchProperties = async (): Promise<VendorProperty[]> => {
    try {
      const res = await axios.get(`${backendUrl}/api/vendor/properties`, {
        withCredentials: true,
      });
      const list: VendorProperty[] = (res.data?.data || []).map((p: any) => ({
        id: String(p.id),
        name: p.property_name,
      }));
      setProperties(list);
      return list;
    } catch (err) {
      console.error("Failed to load properties", err);
      return [];
    }
  };

  // Step 2 — fetch bookings, optionally scoped to a property.
  const fetchBookings = async (propertyId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${backendUrl}/api/vendor/bookings`, {
        withCredentials: true,
        params: propertyId && propertyId !== "all" ? { propertyId } : {},
      });
      const mapped = (res.data?.data || []).map(mapApiBookingToUi);
      setBookings(mapped);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError("Couldn't load your bookings. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchProperties();
      await fetchBookings();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    fetchBookings(propertyId);
  };

  const filtered = useMemo(() => {
    const tabFilter = TABS.find((t) => t.key === tab) ?? TABS[0];
    return bookings
      .filter((b) => tabFilter.match(b.status))
      .filter((b) =>
        query.trim()
          ? (b.guest + b.ref + b.roomName + b.property).toLowerCase().includes(query.trim().toLowerCase())
          : true
      );
  }, [tab, query, bookings]);

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
    const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + b.amountPaid, 0);
    return { total: bookings.length, upcoming, checkedIn, revenue };
  }, [bookings]);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* intro */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D]">
            Reservations
          </p>
          <h1 className="font-display text-[24px] text-[#1E2A23] leading-tight mt-1">
            Every stay, one ledger
          </h1>
          <p className="text-[13px] text-[#9A917D] mt-1">
            Whole-property, whole-room, and single-bed bookings across your properties.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest, room, or reference"
            className="pl-8 pr-3 py-2 text-[13px] rounded-full border border-[#E5DECF] bg-white w-64 focus:outline-none focus:border-[#C99A3D] transition"
          />
        </div>
      </div>

      {/* property filter */}
      {properties.length > 0 && (
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          <button
            onClick={() => handlePropertyChange("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition border ${
              selectedPropertyId === "all"
                ? "bg-[#2F6F62] text-white border-[#2F6F62]"
                : "bg-white text-[#6B6354] border-[#E5DECF] hover:border-[#2F6F62]"
            }`}
          >
            <Home size={12} />
            All properties
          </button>
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePropertyChange(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition border ${
                selectedPropertyId === p.id
                  ? "bg-[#2F6F62] text-white border-[#2F6F62]"
                  : "bg-white text-[#6B6354] border-[#E5DECF] hover:border-[#2F6F62]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total bookings" value={loading ? "—" : stats.total} />
        <StatCard label="Upcoming" value={loading ? "—" : stats.upcoming} accent="#C99A3D" />
        <StatCard label="Checked in now" value={loading ? "—" : stats.checkedIn} accent="#2F6F62" />
        <StatCard
          label="Revenue collected"
          value={loading ? "—" : `₹${stats.revenue.toLocaleString("en-IN")}`}
          mono
        />
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition border ${
              tab === t.key
                ? "bg-[#1E2A23] text-white border-[#1E2A23]"
                : "bg-white text-[#6B6354] border-[#E5DECF] hover:border-[#C99A3D]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* content states */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/60 py-14 text-center">
          <Loader2 className="mx-auto text-[#9A917D] mb-2 animate-spin" size={22} />
          <p className="text-[13px] text-[#9A917D]">Loading your bookings…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-[#F0C9BC] bg-[#F6E4DF]/40 py-14 text-center">
          <AlertTriangle className="mx-auto text-[#B3452E] mb-2" size={22} />
          <p className="text-[13px] text-[#B3452E] mb-3">{error}</p>
          <button
            onClick={() => fetchBookings(selectedPropertyId)}
            className="text-[12.5px] font-medium text-white bg-[#B3452E] rounded-full px-4 py-1.5 hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/60 py-14 text-center">
          <Ticket className="mx-auto text-[#B3AB99] mb-2" size={22} />
          <p className="text-[13px] text-[#9A917D]">No bookings match this view.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((b) => (
            <BookingStub key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  mono?: boolean;
}) => (
  <div className="rounded-2xl border border-[#E5DECF] bg-white px-4 py-3.5">
    <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#9A917D]">{label}</p>
    <p
      className={`text-[20px] font-semibold mt-0.5 ${mono ? "font-mono-num" : "font-display"}`}
      style={{ color: accent || "#1E2A23" }}
    >
      {value}
    </p>
  </div>
);

const TYPE_LABEL: Record<BookingType, string> = {
  whole_property: "Whole property",
  whole_room: "Whole room",
  dorm_bed: "Single bed",
};

const BookingStub = ({ booking: b }: { booking: Booking }) => {
  const meta = STATUS_META[b.status];
  const StatusIcon = meta.icon;
  const TypeIcon = b.bookingType === "dorm_bed" ? BedDouble : b.bookingType === "whole_property" ? Home : DoorOpen;
  const color = avatarColor(b.guest);
  const symbol = currencySymbol(b.currency);
  const partiallyPaid = b.paymentStatus === "partially_paid";

  return (
    <div className="relative flex rounded-2xl border border-[#E5DECF] bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* main */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
          style={{ background: color }}
        >
          {initials(b.guest)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14.5px] font-semibold text-[#1E2A23] truncate">{b.guest}</h3>
            <span className="flex items-center gap-1 text-[10.5px] uppercase tracking-[0.05em] font-semibold text-[#9A917D] bg-[#F5F2EA] rounded-full px-2 py-0.5">
              <TypeIcon size={11} />
              {TYPE_LABEL[b.bookingType]}
            </span>
            {partiallyPaid && (
              <span className="text-[10.5px] uppercase tracking-[0.05em] font-semibold text-[#95721E] bg-[#FBF0DA] rounded-full px-2 py-0.5">
                Partially paid
              </span>
            )}
          </div>

          <p className="text-[12.5px] text-[#6B6354] mt-1 flex items-center gap-1 flex-wrap">
            <span className="font-medium text-[#1E2A23]">{b.roomName}</span>
            {b.bedLabel && <span className="text-[#9A917D]">· {b.bedLabel}</span>}
            <span className="text-[#DBD3C4]">·</span>
            {b.property}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12px] text-[#6B6354]">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} className="text-[#9A917D]" />
              {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
            </span>
            <span className="flex items-center gap-1.5">
              <Moon size={13} className="text-[#9A917D]" />
              {b.nights} night{b.nights > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-[#9A917D]" />
              {b.adults} adult{b.adults > 1 ? "s" : ""}
              {b.children ? ` · ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#9A917D]" />
              {b.phone}
            </span>
          </div>
        </div>
      </div>

      {/* perforation */}
      <div className="relative w-px border-l border-dashed border-[#DBD3C4]">
        <span className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#F5F2EA]" />
        <span className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#F5F2EA]" />
      </div>

      {/* stub */}
      <div className="w-[132px] flex-shrink-0 flex flex-col items-center justify-center gap-2 py-4 px-3 bg-[#FBF9F4]">
        <span
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2.5 py-1 border"
          style={{ color: meta.text, background: meta.bg, borderColor: meta.ring }}
        >
          <StatusIcon size={11} />
          {meta.label}
        </span>
        <p className="font-mono-num text-[17px] font-semibold text-[#1E2A23]">
          {symbol}
          {b.amount.toLocaleString("en-IN")}
        </p>
        <p className="font-mono-num text-[10px] text-[#B3AB99] tracking-wide">{b.ref}</p>
      </div>
    </div>
  );
};

export default Booking;