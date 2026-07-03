import React, { useMemo, useState } from "react";
import {
  Search,
  BedDouble,
  DoorOpen,
  Users,
  Moon,
  Phone,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  BadgeCheck,
  Ticket,
} from "lucide-react";

/* ---------------------------------------------------------
   Same tokens as VendorMain / ListingDetails:
   canvas #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line   #E5DECF   rust #B3452E
   Fonts: .font-display (Fraunces)  ·  .font-mono-num (JetBrains Mono)
--------------------------------------------------------- */

type BookingStatus = "confirmed" | "pending" | "checked_in" | "completed" | "cancelled";

interface Booking {
  id: string;
  ref: string;
  guest: string;
  phone: string;
  property: string;
  roomName: string;
  bookingType: "whole_room" | "dorm_bed";
  bedLabel?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  amount: number;
  status: BookingStatus;
}

// ---------------- demo data, shaped off your real property/rooms ----------------
const DEMO_BOOKINGS: Booking[] = [
  {
    id: "1",
    ref: "PSZ-1052",
    guest: "Ananya Verma",
    phone: "+91 98123 44210",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Heritage Garden Room",
    bookingType: "whole_room",
    checkIn: "2026-07-08",
    checkOut: "2026-07-11",
    nights: 3,
    adults: 2,
    children: 0,
    amount: 12600,
    status: "confirmed",
  },
  {
    id: "2",
    ref: "PSZ-1053",
    guest: "Rohan Malhotra",
    phone: "+91 99887 21034",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Backpacker Mixed Dorm",
    bookingType: "dorm_bed",
    bedLabel: "Bunk A · Top",
    checkIn: "2026-07-08",
    checkOut: "2026-07-10",
    nights: 2,
    adults: 1,
    children: 0,
    amount: 1500,
    status: "confirmed",
  },
  {
    id: "3",
    ref: "PSZ-1054",
    guest: "Emma Fischer",
    phone: "+49 151 2233 8899",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Backpacker Mixed Dorm",
    bookingType: "dorm_bed",
    bedLabel: "Bunk A · Bottom",
    checkIn: "2026-07-01",
    checkOut: "2026-07-05",
    nights: 4,
    adults: 1,
    children: 0,
    amount: 4200,
    status: "checked_in",
  },
  {
    id: "4",
    ref: "PSZ-1055",
    guest: "Sara Ibrahim",
    phone: "+971 50 442 1187",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Backpacker Mixed Dorm",
    bookingType: "dorm_bed",
    bedLabel: "Bunk B · Top",
    checkIn: "2026-07-15",
    checkOut: "2026-07-16",
    nights: 1,
    adults: 1,
    children: 0,
    amount: 950,
    status: "pending",
  },
  {
    id: "5",
    ref: "PSZ-1049",
    guest: "Vikram Shah",
    phone: "+91 98220 77654",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Heritage Garden Room",
    bookingType: "whole_room",
    checkIn: "2026-06-20",
    checkOut: "2026-06-22",
    nights: 2,
    adults: 1,
    children: 1,
    amount: 8400,
    status: "completed",
  },
  {
    id: "6",
    ref: "PSZ-1041",
    guest: "Karan Kapoor",
    phone: "+91 96543 10982",
    property: "Saffron Bagh Heritage Stay",
    roomName: "Heritage Garden Room",
    bookingType: "whole_room",
    checkIn: "2026-06-05",
    checkOut: "2026-06-06",
    nights: 1,
    adults: 2,
    children: 0,
    amount: 4200,
    status: "cancelled",
  },
];

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

  const filtered = useMemo(() => {
    const tabFilter = TABS.find((t) => t.key === tab) ?? TABS[0];
    return DEMO_BOOKINGS.filter((b) => tabFilter.match(b.status)).filter((b) =>
      query.trim()
        ? (b.guest + b.ref + b.roomName).toLowerCase().includes(query.trim().toLowerCase())
        : true
    );
  }, [tab, query]);

  const stats = useMemo(() => {
    const upcoming = DEMO_BOOKINGS.filter((b) => b.status === "confirmed" || b.status === "pending").length;
    const checkedIn = DEMO_BOOKINGS.filter((b) => b.status === "checked_in").length;
    const revenue = DEMO_BOOKINGS.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.amount, 0);
    return { total: DEMO_BOOKINGS.length, upcoming, checkedIn, revenue };
  }, []);

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
            Whole-room and single-bed bookings across your properties.
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

      {/* stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total bookings" value={stats.total} />
        <StatCard label="Upcoming" value={stats.upcoming} accent="#C99A3D" />
        <StatCard label="Checked in now" value={stats.checkedIn} accent="#2F6F62" />
        <StatCard label="Revenue on book" value={`₹${stats.revenue.toLocaleString("en-IN")}`} mono />
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

      {/* booking stubs */}
      {filtered.length === 0 ? (
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

const BookingStub = ({ booking: b }: { booking: Booking }) => {
  const meta = STATUS_META[b.status];
  const StatusIcon = meta.icon;
  const TypeIcon = b.bookingType === "whole_room" ? DoorOpen : BedDouble;
  const color = avatarColor(b.guest);

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
              {b.bookingType === "whole_room" ? "Whole room" : "Single bed"}
            </span>
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
          ₹{b.amount.toLocaleString("en-IN")}
        </p>
        <p className="font-mono-num text-[10px] text-[#B3AB99] tracking-wide">{b.ref}</p>
      </div>
    </div>
  );
};

export default Booking;