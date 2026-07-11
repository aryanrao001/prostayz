import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  BedDouble,
  DoorOpen,
  Home,
  CalendarDays,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  Building2,
  User,
  CreditCard,
} from "lucide-react";
import axios from "axios";

/* ---------------------------------------------------------
   Same brand tokens as vendor pages:
   canvas #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line   #E5DECF   rust #B3452E
   Fonts: .font-display (Fraunces)  ·  .font-mono-num (JetBrains Mono)

   This page trades the vendor's boarding-pass stubs for a dense
   ledger table — admins scan volume, not individual stories.
--------------------------------------------------------- */

type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
type PaymentStatus = "pending" | "paid" | "partially_paid" | "refunded" | "failed";
type BookingType = "whole_property" | "private" | "dorm";

interface RoomLine {
  room_id: number;
  dorm_bed_id: number | null;
  quantity: number;
  room_price: string;
  extra_guest_price: string;
  tax: string;
  room_name: string;
  room_type: string;
  room_category: string;
  bed_label: string | null;
  bed_type: string | null;
}

interface PaymentLine {
  id: number;
  amount: string;
  payment_type: "advance" | "full" | "refund";
  payment_method: string | null;
  transaction_id: string | null;
  status: "initiated" | "success" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
}

interface AdminBooking {
  id: number;
  booking_number: string;
  property_id: number;
  vendor_id: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  total_amount: string;
  currency: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  contact_name: string | null;
  contact_phone: string | null;
  property_name: string;
  user_first_name: string;
  user_last_name: string | null;
  user_phone: string;
  vendor_business_name: string | null;
  vendor_first_name: string;
  vendor_last_name: string;
  rooms: RoomLine[];
  payments: PaymentLine[];
}

const STATUS_META: Record<BookingStatus, { label: string; text: string; bg: string; ring: string }> = {
  pending: { label: "Pending", text: "#95721E", bg: "#FBF0DA", ring: "#EAD2A1" },
  confirmed: { label: "Confirmed", text: "#2F6F62", bg: "#E7F0EC", ring: "#CFE1DA" },
  checked_in: { label: "Checked in", text: "#1E2A23", bg: "#FDECD9", ring: "#C99A3D" },
  checked_out: { label: "Checked out", text: "#6B6354", bg: "#EFEAE0", ring: "#DBD3C4" },
  cancelled: { label: "Cancelled", text: "#B3452E", bg: "#F6E4DF", ring: "#F0C9BC" },
  no_show: { label: "No-show", text: "#B3452E", bg: "#F6E4DF", ring: "#F0C9BC" },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; text: string; bg: string }> = {
  pending: { label: "Unpaid", text: "#95721E", bg: "#FBF0DA" },
  paid: { label: "Paid", text: "#2F6F62", bg: "#E7F0EC" },
  partially_paid: { label: "Partial", text: "#C99A3D", bg: "#FBF0DA" },
  refunded: { label: "Refunded", text: "#6B6354", bg: "#EFEAE0" },
  failed: { label: "Failed", text: "#B3452E", bg: "#F6E4DF" },
};

// Mirrors ALLOWED_TRANSITIONS in the backend controller — keep in sync.
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked in" },
  { key: "checked_out", label: "Checked out" },
  { key: "cancelled", label: "Cancelled" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}
function currencySymbol(code: string) {
  return code === "USD" ? "$" : code === "AED" ? "AED " : "₹";
}
function bookingType(rooms: RoomLine[]): BookingType {
  // room_category is the source of truth: 'whole_property' | 'private' | 'dorm'
  const category = rooms?.[0]?.room_category;
  if (category === "whole_property") return "whole_property";
  if (category === "dorm") return "dorm";
  return "private";
}
const TYPE_ICON: Record<BookingType, any> = { whole_property: Home, private: DoorOpen, dorm: BedDouble };
const TYPE_LABEL: Record<BookingType, string> = {
  whole_property: "Whole property",
  private: "Private room",
  dorm: "Dorm bed",
};

const LIMIT = 20;

const AdminBookings = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusMenuFor, setStatusMenuFor] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search) params.search = search;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get(`${backendUrl}/api/admin/bookings`, {
        withCredentials: true,
        params,
      });
      setBookings(res.data?.data || []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError("Couldn't load bookings. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, page, status, paymentStatus, search, from, to]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = async (bookingId: number, next: BookingStatus) => {
    setUpdatingId(bookingId);
    setStatusMenuFor(null);
    try {
      await axios.patch(
        `${backendUrl}/api/admin/bookings/${bookingId}/status`,
        { status: next },
        { withCredentials: true }
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, booking_status: next } : b))
      );
    } catch (err) {
      console.error("Status update failed", err);
      alert("Couldn't update status — it may already have moved, refreshing.");
      fetchBookings();
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const activeCount = bookings.filter((b) => !["cancelled", "no_show"].includes(b.booking_status)).length;
    const paidRevenue = bookings.reduce((sum, b) => {
      const paid = (b.payments || [])
        .filter((p) => p.status === "success" && p.payment_type !== "refund")
        .reduce((s, p) => s + Number(p.amount), 0);
      return sum + paid;
    }, 0);
    return { activeCount, paidRevenue };
  }, [bookings]);

  const clearFilters = () => {
    setStatus("");
    setPaymentStatus("");
    setSearchInput("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
  };
  const hasFilters = status || paymentStatus || search || from || to;

  return (
    <div className="max-w-[1400px] mx-auto pb-16 px-4 sm:px-6">
      {/* header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6 pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D]">
            Platform oversight
          </p>
          <h1 className="font-display text-[26px] text-[#1E2A23] leading-tight mt-1">
            Booking ledger
          </h1>
          <p className="text-[13px] text-[#9A917D] mt-1">
            Every reservation across every vendor, in one running record.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#9A917D]">This page</p>
            <p className="font-mono-num text-[18px] font-semibold text-[#1E2A23]">
              ₹{stats.paidRevenue.toLocaleString("en-IN")} collected
            </p>
          </div>
        </div>
      </div>

      {/* filter bar */}
      <div className="rounded-2xl border border-[#E5DECF] bg-white p-3.5 mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reference, guest name, or phone"
            className="w-full pl-8 pr-3 py-2 text-[13px] rounded-full border border-[#E5DECF] bg-[#F5F2EA]/50 focus:outline-none focus:border-[#C99A3D] transition"
          />
        </div>

        <select
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="text-[12.5px] rounded-full border border-[#E5DECF] bg-white px-3 py-2 text-[#6B6354] focus:outline-none focus:border-[#C99A3D]"
        >
          <option value="">Any payment status</option>
          <option value="pending">Unpaid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex items-center gap-1.5 text-[12.5px] text-[#6B6354]">
          <CalendarDays size={13} className="text-[#9A917D]" />
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-full border border-[#E5DECF] bg-white px-2.5 py-1.5 focus:outline-none focus:border-[#C99A3D]"
          />
          <span className="text-[#DBD3C4]">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-full border border-[#E5DECF] bg-white px-2.5 py-1.5 focus:outline-none focus:border-[#C99A3D]"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[12px] font-medium text-[#B3452E] hover:underline ml-auto"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* status tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition border ${
              status === t.key
                ? "bg-[#1E2A23] text-white border-[#1E2A23]"
                : "bg-white text-[#6B6354] border-[#E5DECF] hover:border-[#C99A3D]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/60 py-16 text-center">
          <Loader2 className="mx-auto text-[#9A917D] mb-2 animate-spin" size={22} />
          <p className="text-[13px] text-[#9A917D]">Loading the ledger…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-[#F0C9BC] bg-[#F6E4DF]/40 py-16 text-center">
          <AlertTriangle className="mx-auto text-[#B3452E] mb-2" size={22} />
          <p className="text-[13px] text-[#B3452E] mb-3">{error}</p>
          <button
            onClick={fetchBookings}
            className="text-[12.5px] font-medium text-white bg-[#B3452E] rounded-full px-4 py-1.5 hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/60 py-16 text-center">
          <p className="text-[13px] text-[#9A917D]">No bookings match these filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5DECF] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E5DECF] bg-[#FBF9F4] text-[10.5px] uppercase tracking-[0.06em] text-[#9A917D]">
                  <th className="text-left font-semibold px-4 py-3 w-8"></th>
                  <th className="text-left font-semibold px-3 py-3">Reference</th>
                  <th className="text-left font-semibold px-3 py-3">Guest</th>
                  <th className="text-left font-semibold px-3 py-3">Property / vendor</th>
                  <th className="text-left font-semibold px-3 py-3">Stay</th>
                  <th className="text-left font-semibold px-3 py-3">Type</th>
                  <th className="text-right font-semibold px-3 py-3">Amount</th>
                  <th className="text-left font-semibold px-3 py-3">Payment</th>
                  <th className="text-left font-semibold px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const type = bookingType(b.rooms);
                  const TypeIcon = TYPE_ICON[type];
                  const statusMeta = STATUS_META[b.booking_status];
                  const paymentMeta = PAYMENT_META[b.payment_status];
                  const isExpanded = expandedId === b.id;
                  const nextOptions = ALLOWED_TRANSITIONS[b.booking_status] || [];

                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        className="border-b border-[#F0ECE0] last:border-0 hover:bg-[#FBF9F4] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      >
                        <td className="px-4 py-3 text-[#B3AB99]">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="px-3 py-3 font-mono-num text-[12px] text-[#1E2A23]">
                          {b.booking_number}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-[#1E2A23]">
                            {[b.user_first_name, b.user_last_name].filter(Boolean).join(" ")}
                          </p>
                          <p className="text-[11.5px] text-[#9A917D]">{b.contact_phone || b.user_phone}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-[#1E2A23]">{b.property_name}</p>
                          <p className="text-[11.5px] text-[#9A917D]">
                            {b.vendor_business_name || `${b.vendor_first_name} ${b.vendor_last_name}`}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-[#6B6354] whitespace-nowrap">
                          {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)}
                          <span className="text-[#B3AB99]"> · {b.nights}n</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#6B6354]">
                            <TypeIcon size={12} className="text-[#9A917D]" />
                            {TYPE_LABEL[type]}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num font-semibold text-[#1E2A23] whitespace-nowrap">
                          {currencySymbol(b.currency)}
                          {Number(b.total_amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="text-[10.5px] font-semibold uppercase tracking-[0.04em] rounded-full px-2 py-0.5"
                            style={{ color: paymentMeta.text, background: paymentMeta.bg }}
                          >
                            {paymentMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (nextOptions.length === 0) return;
                              setStatusMenuFor(statusMenuFor === b.id ? null : b.id);
                            }}
                            disabled={updatingId === b.id}
                            className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] rounded-full px-2 py-0.5 border disabled:opacity-50"
                            style={{ color: statusMeta.text, background: statusMeta.bg, borderColor: statusMeta.ring }}
                          >
                            {updatingId === b.id ? <Loader2 size={10} className="animate-spin" /> : null}
                            {statusMeta.label}
                            {nextOptions.length > 0 && <ChevronDown size={10} />}
                          </button>

                          {statusMenuFor === b.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-3 top-9 z-10 bg-white border border-[#E5DECF] rounded-xl shadow-lg py-1 min-w-[150px]"
                            >
                              {nextOptions.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => handleStatusChange(b.id, opt)}
                                  className="w-full text-left px-3 py-2 text-[12px] text-[#1E2A23] hover:bg-[#F5F2EA] transition"
                                >
                                  Move to {STATUS_META[opt].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FBF9F4] border-b border-[#F0ECE0]">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              {/* rooms */}
                              <div>
                                <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] font-semibold text-[#9A917D] mb-2">
                                  <Building2 size={12} /> Rooms / beds booked
                                </p>
                                <div className="space-y-1.5">
                                  {b.rooms.map((r, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-[12.5px] bg-white rounded-lg border border-[#E5DECF] px-3 py-2"
                                    >
                                      <div>
                                        <span className="font-medium text-[#1E2A23]">{r.room_name}</span>
                                        {r.bed_label && (
                                          <span className="text-[#9A917D]"> · {r.bed_label}</span>
                                        )}
                                        <span className="text-[#B3AB99]"> · qty {r.quantity}</span>
                                      </div>
                                      <span className="font-mono-num text-[#6B6354]">
                                        {currencySymbol(b.currency)}
                                        {Number(r.room_price).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* payments */}
                              <div>
                                <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] font-semibold text-[#9A917D] mb-2">
                                  <CreditCard size={12} /> Payment trail
                                </p>
                                {b.payments.length === 0 ? (
                                  <p className="text-[12px] text-[#B3AB99] italic">No payment attempts yet.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {b.payments.map((p) => (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between text-[12.5px] bg-white rounded-lg border border-[#E5DECF] px-3 py-2"
                                      >
                                        <div>
                                          <span className="font-medium text-[#1E2A23] capitalize">
                                            {p.payment_type}
                                          </span>
                                          <span className="text-[#9A917D]">
                                            {" "}
                                            · {p.payment_method || "—"} · {p.status}
                                          </span>
                                        </div>
                                        <span className="font-mono-num text-[#6B6354]">
                                          {currencySymbol(b.currency)}
                                          {Number(p.amount).toLocaleString("en-IN")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {b.contact_name && (
                              <p className="flex items-center gap-1.5 text-[11.5px] text-[#9A917D] mt-3">
                                <User size={12} /> Booked for: {b.contact_name}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5DECF] bg-[#FBF9F4]">
            <p className="text-[12px] text-[#9A917D]">
              {total.toLocaleString("en-IN")} booking{total !== 1 ? "s" : ""} · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <PageBtn onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft size={14} /></PageBtn>
              <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></PageBtn>
              <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></PageBtn>
              <PageBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight size={14} /></PageBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PageBtn = ({ children, ...props }: any) => (
  <button
    {...props}
    className="w-7 h-7 flex items-center justify-center rounded-full text-[#6B6354] border border-[#E5DECF] bg-white hover:border-[#C99A3D] disabled:opacity-40 disabled:hover:border-[#E5DECF] transition"
  >
    {children}
  </button>
);

export default AdminBookings;
