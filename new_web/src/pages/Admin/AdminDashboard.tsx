import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  Users,
  CalendarCheck2,
  IndianRupee,
  BedDouble,
  ShieldAlert,
  X,
  ChevronRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  Star,
  Phone,
  Mail,
  Loader2,
  RefreshCcw,
  ArrowUpRight,
  CreditCard,
  BadgeCheck,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Brand tokens — lifted from AdminMain so this page slots in without drift.
// -----------------------------------------------------------------------------
const INK = "#1E2A23";
const BODY = "#4A4438";
const MUTED = "#9A917D";
const BORDER = "#E5DECF";
const FILL = "#EFE9DC";
const PAGE_BG = "#F8F7F4";
const GREEN = "#2F6F62";
const GREEN_DARK = "#24564B";
const GREEN_LIGHT = "#3F8B7A";
const GOLD = "#C99A3F";
const GOLD_LIGHT = "#D9B36C";
const TERRACOTTA = "#B3452E";

const STATUS_COLORS: Record<string, string> = {
  pending: GOLD,
  confirmed: GREEN,
  checked_in: GREEN_LIGHT,
  checked_out: INK,
  cancelled: TERRACOTTA,
  no_show: MUTED,
  approved: GREEN,
  draft: MUTED,
  rejected: TERRACOTTA,
  active: GREEN,
  blocked: TERRACOTTA,
  paid: GREEN,
  partially_paid: GOLD_LIGHT,
  refunded: MUTED,
  failed: TERRACOTTA,
};

const statusColor = (label: string) => STATUS_COLORS[label] ?? MUTED;
const statusText = (label: string) =>
  label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// -----------------------------------------------------------------------------
// Formatters
// -----------------------------------------------------------------------------
const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtNum = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);

const fmtDate = (d: string | null | undefined, withTime = false) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

// -----------------------------------------------------------------------------
// Types (trimmed to what the UI reads — matches the controller's SQL output)
// -----------------------------------------------------------------------------
interface DashboardCounts {
  total_vendors: number;
  active_vendors: number;
  pending_vendors: number;
  blocked_vendors: number;
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
  draft_properties: number;
  rejected_properties: number;
  featured_properties: number;
  total_rooms: number;
  total_available_rooms: number;
  total_users: number;
  active_users: number;
  blocked_users: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  checked_in_bookings: number;
  checked_out_bookings: number;
  cancelled_bookings: number;
  no_show_bookings: number;
  total_revenue: number;
  pending_payment_amount: number;
  revenue_lost_to_cancellations: number;
  avg_booking_value: number;
}

interface RecentBooking {
  id: number;
  booking_number: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  check_in_date: string;
  check_out_date: string;
  created_at: string;
  property_name: string;
  vendor_name: string;
  guest_name: string;
}

interface TopCity {
  city: string;
  state: string;
  property_count: number;
}

interface OverviewData {
  counts: DashboardCounts;
  cancellation_rate: number;
  top_cities: TopCity[];
  recent_bookings: RecentBooking[];
}

interface TrendPoint {
  period: string;
  total_bookings: number;
  cancelled_bookings: number;
  confirmed_bookings: number;
  revenue: number;
}

interface DistributionSlice {
  label: string;
  value: number;
}

interface StatusDistribution {
  booking_status: DistributionSlice[];
  payment_status: DistributionSlice[];
  property_status: DistributionSlice[];
  vendor_status: DistributionSlice[];
}

interface TopVendorRow {
  id: number;
  business_name: string;
  vendor_name: string;
  total_properties: number;
  total_bookings: number;
  cancelled_bookings: number;
  revenue: number;
}

interface TopPropertyRow {
  id: number;
  property_name: string;
  vendor_name: string;
  total_bookings: number;
  cancelled_bookings: number;
  revenue: number;
}

interface CityStat {
  city: string;
  state: string;
  total_properties: number;
  total_bookings: number;
  cancelled_bookings: number;
  revenue: number;
}

type PerformerType = "vendors" | "properties";
type PerformerMetric = "revenue" | "bookings";
type Granularity = "day" | "week" | "month";

// -----------------------------------------------------------------------------
// Axios instance
// -----------------------------------------------------------------------------
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const api = axios.create({
  baseURL: `${backendUrl}/api/admin/dashboard`,
  withCredentials: true,
});

// =============================================================================
// Small building blocks
// =============================================================================

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <span className="text-[10px] font-bold text-[#2F6F62] uppercase tracking-wider">
          {eyebrow}
        </span>
        <h2 className="font-display text-[19px] text-[#1E2A23] leading-tight mt-0.5">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5DECF] shadow-[0_1px_2px_rgba(30,42,35,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#EFE9DC] ${className}`} />;
}

function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E9CFC3] bg-[#FBF2EE] px-4 py-3 text-[12.5px] text-[#B3452E]">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 font-semibold hover:underline"
        >
          <RefreshCcw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// KPI Card ---------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "green" | "gold" | "terracotta";
  loading?: boolean;
}) {
  const toneMap: Record<string, { bg: string; text: string }> = {
    neutral: { bg: FILL, text: INK },
    green: { bg: "#E4EFEC", text: GREEN_DARK },
    gold: { bg: "#F6EDDB", text: "#8A6A26" },
    terracotta: { bg: "#FBEAE5", text: TERRACOTTA },
  };
  const t = toneMap[tone];

  return (
    <Card className="p-5 flex flex-col gap-3 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(30,42,35,0.08)] transition-all duration-200">
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: t.bg, color: t.text }}
        >
          <Icon size={16} />
        </div>
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-6 w-24 mb-1" />
        ) : (
          <span className="block font-display text-[22px] text-[#1E2A23] tabular-nums leading-none">
            {value}
          </span>
        )}
        <span className="block text-[12px] text-[#9A917D] mt-2">{label}</span>
        {sub && <span className="block text-[11px] text-[#4A4438] mt-1">{sub}</span>}
      </div>
    </Card>
  );
}

// Status pill --------------------------------------------------------------
function StatusPill({ label }: { label: string }) {
  const color = statusColor(label);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {statusText(label)}
    </span>
  );
}

// Generic modal shell --------------------------------------------------------
function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div
        className="fixed inset-0 bg-[#1E2A23]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E5DECF] shadow-2xl animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#EFE9DC]">
          <div>
            <span className="text-[10px] font-bold text-[#2F6F62] uppercase tracking-wider">
              {eyebrow}
            </span>
            <h3 className="font-display text-[19px] text-[#1E2A23] mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9A917D] hover:bg-[#EFE9DC] hover:text-[#1E2A23] transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-[#9A917D]">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#EFE9DC] bg-[#FBFAF7] px-3.5 py-3">
      <span className="block text-[10.5px] uppercase tracking-wide text-[#9A917D]">
        {label}
      </span>
      <span className="block font-display text-[16px] text-[#1E2A23] tabular-nums mt-0.5">
        {value}
      </span>
    </div>
  );
}

// =============================================================================
// Booking detail modal
// =============================================================================
function BookingDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null) return;
    setLoading(true);
    setData(null);
    api
      .get(`/bookings/${id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Modal
      open={id != null}
      onClose={onClose}
      eyebrow="Booking"
      title={data?.booking?.booking_number ?? "Loading…"}
    >
      {loading && <ModalLoading />}
      {!loading && data && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <StatusPill label={data.booking.booking_status} />
            <StatusPill label={data.booking.payment_status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Metric label="Check-in" value={fmtDate(data.booking.check_in_date)} />
            <Metric label="Check-out" value={fmtDate(data.booking.check_out_date)} />
            <Metric label="Nights" value={String(data.booking.nights)} />
            <Metric label="Guests" value={`${data.booking.adults} Adults, ${data.booking.children} Kids`} />
            <Metric label="Total Amount" value={fmtINR(data.booking.total_amount)} />
            <Metric label="Booked On" value={fmtDate(data.booking.created_at)} />
          </div>

          <div className="rounded-xl border border-[#EFE9DC] p-4">
            <span className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">Property & guest</span>
            <p className="font-display text-[15px] text-[#1E2A23] mt-1">
              {data.booking.property_name}
            </p>
            <p className="text-[12.5px] text-[#4A4438] mt-1">
              Vendor: {data.booking.business_name || data.booking.vendor_name}
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-[12.5px] text-[#4A4438]">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-[#9A917D]" /> {data.booking.contact_name}
              </span>
              {data.booking.contact_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#9A917D]" /> {data.booking.contact_phone}
                </span>
              )}
              {data.booking.user_email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-[#9A917D]" /> {data.booking.user_email}
                </span>
              )}
            </div>
          </div>

          {data.rooms?.length > 0 && (
            <div>
              <span className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">Rooms booked</span>
              <div className="mt-2 space-y-2">
                {data.rooms.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg bg-[#FBFAF7] border border-[#EFE9DC] px-3.5 py-2.5 text-[12.5px]"
                  >
                    <div>
                      <p className="text-[#1E2A23] font-medium">{r.room_name}</p>
                      <p className="text-[#9A917D]">
                        {r.room_type} {r.bed_label ? `· ${r.bed_label}` : ""} · Qty {r.quantity}
                      </p>
                    </div>
                    <span className="font-display tabular-nums text-[#1E2A23]">
                      {fmtINR(r.room_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.payments?.length > 0 ? (
            <div>
              <span className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">Payment history</span>
              <div className="mt-2 space-y-2">
                {data.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-[#EFE9DC] px-3.5 py-2.5 text-[12.5px]"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-[#9A917D]" />
                      <span className="text-[#4A4438]">
                        {p.payment_method ?? "—"} · {p.payment_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display tabular-nums text-[#1E2A23]">
                        {fmtINR(p.amount)}
                      </span>
                      <StatusPill label={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#9A917D]">No payment records yet.</p>
          )}

          {data.booking.cancellation_reason && (
            <div className="rounded-xl border border-[#E9CFC3] bg-[#FBF2EE] px-4 py-3">
              <span className="text-[10.5px] uppercase tracking-wide text-[#B3452E]">
                Cancelled {data.booking.cancelled_by ? `by ${data.booking.cancelled_by}` : ""}
              </span>
              <p className="text-[12.5px] text-[#4A4438] mt-1">{data.booking.cancellation_reason}</p>
            </div>
          )}
        </div>
      )}
      {!loading && !data && id != null && (
        <ErrorNote message="Couldn't load this booking." />
      )}
    </Modal>
  );
}

// =============================================================================
// Vendor detail modal
// =============================================================================
function VendorDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null) return;
    setLoading(true);
    setData(null);
    api
      .get(`/vendors/${id}`, { params: { limit: 5 } })
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Modal
      open={id != null}
      onClose={onClose}
      eyebrow="Vendor"
      title={data?.vendor?.business_name || `${data?.vendor?.first_name ?? ""} ${data?.vendor?.last_name ?? ""}`.trim() || "Loading…"}
    >
      {loading && <ModalLoading />}
      {!loading && data && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <StatusPill label={data.vendor.status} />
            <span className="text-[12.5px] text-[#9A917D]">
              Joined {fmtDate(data.vendor.created_at)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Properties" value={String(data.properties?.length ?? 0)} />
            <Metric label="Total Bookings" value={fmtNum(data.booking_stats.total_bookings)} />
            <Metric label="Cancelled" value={fmtNum(data.booking_stats.cancelled_bookings)} />
            <Metric label="Revenue" value={fmtINR(data.booking_stats.total_revenue)} />
          </div>

          <div className="flex flex-wrap gap-4 text-[12.5px] text-[#4A4438]">
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[#9A917D]" /> {data.vendor.email || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#9A917D]" /> {data.vendor.country_code} {data.vendor.phone}
            </span>
            {data.vendor.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#9A917D]" /> {data.vendor.city}, {data.vendor.state}
              </span>
            )}
          </div>

          {data.properties?.length > 0 && (
            <div>
              <span className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">Properties</span>
              <div className="mt-2 space-y-2">
                {data.properties.slice(0, 6).map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-[#EFE9DC] px-3.5 py-2.5 text-[12.5px]"
                  >
                    <div>
                      <p className="text-[#1E2A23] font-medium">{p.property_name}</p>
                      <p className="text-[#9A917D]">{fmtNum(p.total_bookings)} bookings</p>
                    </div>
                    <StatusPill label={p.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!loading && !data && id != null && <ErrorNote message="Couldn't load this vendor." />}
    </Modal>
  );
}

// =============================================================================
// Property detail modal
// =============================================================================
function PropertyDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null) return;
    setLoading(true);
    setData(null);
    api
      .get(`/properties/${id}`, { params: { limit: 5 } })
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Modal
      open={id != null}
      onClose={onClose}
      eyebrow="Property"
      title={data?.property?.property_name ?? "Loading…"}
    >
      {loading && <ModalLoading />}
      {!loading && data && (
        <div className="space-y-5">
          {data.images?.[0] && (
            <div className="h-40 w-full rounded-xl bg-[#EFE9DC] overflow-hidden flex items-center justify-center text-[11px] text-[#9A917D]">
              {data.images[0].image}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill label={data.property.status} />
            {!!data.property.is_featured && <StatusPill label="featured" />}
            <span className="flex items-center gap-1 text-[12.5px] text-[#9A917D]">
              <Star size={12} className="text-[#C99A3F] fill-[#C99A3F]" /> {data.property.star_rating || 0}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Total Bookings" value={fmtNum(data.booking_stats.total_bookings)} />
            <Metric label="Cancelled" value={fmtNum(data.booking_stats.cancelled_bookings)} />
            <Metric label="Revenue" value={fmtINR(data.booking_stats.total_revenue)} />
            <Metric label="Avg. Booking" value={fmtINR(data.booking_stats.avg_booking_value)} />
          </div>

          <div className="flex flex-wrap gap-4 text-[12.5px] text-[#4A4438]">
            <span className="flex items-center gap-1.5">
              <Building2 size={13} className="text-[#9A917D]" /> {data.property.vendor_name} · {data.property.business_name}
            </span>
            {data.property.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#9A917D]" /> {data.property.area ? `${data.property.area}, ` : ""}{data.property.city}, {data.property.state}
              </span>
            )}
          </div>

          {data.rooms?.length > 0 && (
            <div>
              <span className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">Room types</span>
              <div className="mt-2 space-y-2">
                {data.rooms.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-[#EFE9DC] px-3.5 py-2.5 text-[12.5px]"
                  >
                    <div>
                      <p className="text-[#1E2A23] font-medium">{r.room_name}</p>
                      <p className="text-[#9A917D]">
                        {r.available_rooms}/{r.total_rooms} available · booked {r.times_booked}×
                      </p>
                    </div>
                    <span className="font-display tabular-nums text-[#1E2A23]">
                      {fmtINR(r.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!loading && !data && id != null && <ErrorNote message="Couldn't load this property." />}
    </Modal>
  );
}

// =============================================================================
// Custom recharts tooltip — matches card styling
// =============================================================================
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as TrendPoint;
  return (
    <div className="bg-white border border-[#E5DECF] rounded-xl shadow-lg px-3.5 py-2.5 text-[12px]">
      <p className="text-[#9A917D] text-[10.5px] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[#1E2A23] font-display text-[14px] tabular-nums">{fmtINR(p.revenue)}</p>
      <p className="text-[#4A4438] mt-1">{fmtNum(p.total_bookings)} bookings · {fmtNum(p.cancelled_bookings)} cancelled</p>
    </div>
  );
}

// =============================================================================
// Main page
// =============================================================================
export default function AdminDashboard() {
  const [range, setRange] = useState({ start_date: "", end_date: "" });
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [performerType, setPerformerType] = useState<PerformerType>("vendors");
  const [performerMetric, setPerformerMetric] = useState<PerformerMetric>("revenue");

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [distribution, setDistribution] = useState<StatusDistribution | null>(null);
  const [topVendors, setTopVendors] = useState<TopVendorRow[]>([]);
  const [topProperties, setTopProperties] = useState<TopPropertyRow[]>([]);
  const [cityStats, setCityStats] = useState<CityStat[]>([]);

  const [loading, setLoading] = useState({ overview: true, trend: true, dist: true, top: true, city: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [bookingModalId, setBookingModalId] = useState<number | null>(null);
  const [vendorModalId, setVendorModalId] = useState<number | null>(null);
  const [propertyModalId, setPropertyModalId] = useState<number | null>(null);

  const dateParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (range.start_date) p.start_date = range.start_date;
    if (range.end_date) p.end_date = range.end_date;
    return p;
  }, [range]);

  const loadOverview = useCallback(() => {
    setLoading((s) => ({ ...s, overview: true }));
    api
      .get("", { params: dateParams })
      .then((res) => {
        setOverview(res.data.data);
        setErrors((e) => ({ ...e, overview: "" }));
      })
      .catch(() => setErrors((e) => ({ ...e, overview: "Couldn't load the overview." })))
      .finally(() => setLoading((s) => ({ ...s, overview: false })));
  }, [dateParams]);

  const loadTrend = useCallback(() => {
    setLoading((s) => ({ ...s, trend: true }));
    api
      .get("/charts/trend", { params: { ...dateParams, granularity } })
      .then((res) => {
        setTrend(res.data.data);
        setErrors((e) => ({ ...e, trend: "" }));
      })
      .catch(() => setErrors((e) => ({ ...e, trend: "Couldn't load the trend chart." })))
      .finally(() => setLoading((s) => ({ ...s, trend: false })));
  }, [dateParams, granularity]);

  const loadDistribution = useCallback(() => {
    setLoading((s) => ({ ...s, dist: true }));
    api
      .get("/charts/status-distribution", { params: dateParams })
      .then((res) => {
        setDistribution(res.data.data);
        setErrors((e) => ({ ...e, dist: "" }));
      })
      .catch(() => setErrors((e) => ({ ...e, dist: "Couldn't load status breakdowns." })))
      .finally(() => setLoading((s) => ({ ...s, dist: false })));
  }, [dateParams]);

  const loadTopPerformers = useCallback(() => {
    setLoading((s) => ({ ...s, top: true }));
    api
      .get("/top-performers", { params: { ...dateParams, type: performerType, metric: performerMetric, limit: 6 } })
      .then((res) => {
        if (performerType === "vendors") setTopVendors(res.data.data);
        else setTopProperties(res.data.data);
        setErrors((e) => ({ ...e, top: "" }));
      })
      .catch(() => setErrors((e) => ({ ...e, top: "Couldn't load top performers." })))
      .finally(() => setLoading((s) => ({ ...s, top: false })));
  }, [dateParams, performerType, performerMetric]);

  const loadCityStats = useCallback(() => {
    setLoading((s) => ({ ...s, city: true }));
    api
      .get("/city-stats")
      .then((res) => {
        setCityStats(res.data.data);
        setErrors((e) => ({ ...e, city: "" }));
      })
      .catch(() => setErrors((e) => ({ ...e, city: "Couldn't load city stats." })))
      .finally(() => setLoading((s) => ({ ...s, city: false })));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadTrend(); }, [loadTrend]);
  useEffect(() => { loadDistribution(); }, [loadDistribution]);
  useEffect(() => { loadTopPerformers(); }, [loadTopPerformers]);
  useEffect(() => { loadCityStats(); }, [loadCityStats]);

  const counts = overview?.counts;
  const maxTopValue = useMemo(() => {
    const rows = performerType === "vendors" ? topVendors : topProperties;
    const key = performerMetric === "revenue" ? "revenue" : "total_bookings";
    return Math.max(1, ...rows.map((r: any) => Number(r[key]) || 0));
  }, [performerType, performerMetric, topVendors, topProperties]);

  const donutData = distribution?.booking_status?.filter((d) => d.value > 0) ?? [];
  const donutTotal = donutData.reduce((s, d) => s + Number(d.value), 0);

  return (
    <div style={{ backgroundColor: PAGE_BG }} className="-m-8 p-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <span className="text-[10px] font-bold text-[#2F6F62] uppercase tracking-wider">
            Operations
          </span>
          <h1 className="font-display text-[26px] text-[#1E2A23] mt-0.5">Dashboard Overview</h1>
          <p className="text-[13px] text-[#9A917D] mt-1">
            A daily read on vendors, listings, bookings and revenue across Prostayz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={range.start_date}
            onChange={(e) => setRange((r) => ({ ...r, start_date: e.target.value }))}
            className="bg-white border border-[#E5DECF] rounded-lg px-3 py-2 text-[12.5px] text-[#4A4438] outline-none focus:border-[#2F6F62] transition"
          />
          <span className="text-[#9A917D] text-[12px]">to</span>
          <input
            type="date"
            value={range.end_date}
            onChange={(e) => setRange((r) => ({ ...r, end_date: e.target.value }))}
            className="bg-white border border-[#E5DECF] rounded-lg px-3 py-2 text-[12.5px] text-[#4A4438] outline-none focus:border-[#2F6F62] transition"
          />
          {(range.start_date || range.end_date) && (
            <button
              onClick={() => setRange({ start_date: "", end_date: "" })}
              className="text-[12px] text-[#B3452E] font-medium hover:underline px-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => {
              loadOverview();
              loadTrend();
              loadDistribution();
              loadTopPerformers();
            }}
            className="flex items-center gap-1.5 bg-[#1E2A23] text-white rounded-lg px-3.5 py-2 text-[12.5px] font-medium hover:bg-[#2F6F62] transition"
          >
            <RefreshCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {errors.overview && (
        <div className="mb-5">
          <ErrorNote message={errors.overview} onRetry={loadOverview} />
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={counts ? fmtINR(counts.total_revenue) : "—"}
          sub={counts ? `${fmtINR(counts.pending_payment_amount)} pending` : undefined}
          tone="green"
          loading={loading.overview}
        />
        <StatCard
          icon={CalendarCheck2}
          label="Total Bookings"
          value={counts ? fmtNum(counts.total_bookings) : "—"}
          sub={counts ? `${fmtNum(counts.confirmed_bookings)} confirmed` : undefined}
          loading={loading.overview}
        />
        <StatCard
          icon={TrendingDown}
          label="Cancellation Rate"
          value={overview ? `${overview.cancellation_rate}%` : "—"}
          sub={counts ? `${fmtINR(counts.revenue_lost_to_cancellations)} lost` : undefined}
          tone="terracotta"
          loading={loading.overview}
        />
        <StatCard
          icon={IndianRupee}
          label="Avg. Booking Value"
          value={counts ? fmtINR(counts.avg_booking_value) : "—"}
          tone="gold"
          loading={loading.overview}
        />
        <StatCard
          icon={Users}
          label="Vendors"
          value={counts ? fmtNum(counts.total_vendors) : "—"}
          sub={counts ? `${fmtNum(counts.pending_vendors)} pending approval` : undefined}
          loading={loading.overview}
        />
        <StatCard
          icon={Building2}
          label="Properties"
          value={counts ? fmtNum(counts.total_properties) : "—"}
          sub={counts ? `${fmtNum(counts.pending_properties)} awaiting review` : undefined}
          tone="green"
          loading={loading.overview}
        />
        <StatCard
          icon={BedDouble}
          label="Rooms Available"
          value={counts ? fmtNum(counts.total_available_rooms) : "—"}
          sub={counts ? `of ${fmtNum(counts.total_rooms)} total` : undefined}
          loading={loading.overview}
        />
        <StatCard
          icon={ShieldAlert}
          label="Registered Users"
          value={counts ? fmtNum(counts.total_users) : "—"}
          sub={counts ? `${fmtNum(counts.blocked_users)} blocked` : undefined}
          loading={loading.overview}
        />
      </div>

      {/* Trend + Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <Card className="xl:col-span-2 p-6">
          <SectionHeading
            eyebrow="Performance"
            title="Revenue & Bookings Trend"
            action={
              <div className="flex bg-[#EFE9DC] rounded-lg p-1 gap-1">
                {(["day", "week", "month"] as Granularity[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1 rounded-md text-[11.5px] font-semibold capitalize transition ${
                      granularity === g ? "bg-white text-[#1E2A23] shadow-sm" : "text-[#9A917D]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            }
          />
          {errors.trend ? (
            <ErrorNote message={errors.trend} onRetry={loadTrend} />
          ) : loading.trend ? (
            <Skeleton className="h-72 w-full" />
          ) : trend.length === 0 ? (
            <EmptyState text="No bookings in this window yet." />
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={BORDER} strokeDasharray="3 4" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(v) => fmtDate(v)}
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={{ stroke: BORDER }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={GREEN}
                  strokeWidth={2.25}
                  fill="url(#revFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: GREEN, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Snapshot" title="Booking Status" />
          {errors.dist ? (
            <ErrorNote message={errors.dist} onRetry={loadDistribution} />
          ) : loading.dist ? (
            <Skeleton className="h-56 w-full" />
          ) : donutData.length === 0 ? (
            <EmptyState text="No bookings to break down yet." />
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((d) => (
                        <Cell key={d.label} fill={statusColor(d.label)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-[22px] text-[#1E2A23] tabular-nums">
                    {fmtNum(donutTotal)}
                  </span>
                  <span className="text-[10.5px] text-[#9A917D] uppercase tracking-wide">Bookings</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-[#4A4438]">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColor(d.label) }}
                      />
                      {statusText(d.label)}
                    </span>
                    <span className="tabular-nums text-[#1E2A23] font-medium">{fmtNum(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Top performers + Top cities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <Card className="xl:col-span-2 p-6">
          <SectionHeading
            eyebrow="Leaderboard"
            title="Top Performers"
            action={
              <div className="flex items-center gap-3">
                <div className="flex bg-[#EFE9DC] rounded-lg p-1 gap-1">
                  {(["vendors", "properties"] as PerformerType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPerformerType(t)}
                      className={`px-3 py-1 rounded-md text-[11.5px] font-semibold capitalize transition ${
                        performerType === t ? "bg-white text-[#1E2A23] shadow-sm" : "text-[#9A917D]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <select
                  value={performerMetric}
                  onChange={(e) => setPerformerMetric(e.target.value as PerformerMetric)}
                  className="bg-white border border-[#E5DECF] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[#4A4438] outline-none focus:border-[#2F6F62]"
                >
                  <option value="revenue">By Revenue</option>
                  <option value="bookings">By Bookings</option>
                </select>
              </div>
            }
          />

          {errors.top ? (
            <ErrorNote message={errors.top} onRetry={loadTopPerformers} />
          ) : loading.top ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (performerType === "vendors" ? topVendors : topProperties).length === 0 ? (
            <EmptyState text="Nothing to rank yet for this window." />
          ) : (
            <div className="space-y-1.5">
              {(performerType === "vendors" ? topVendors : topProperties).map((row: any, i) => {
                const value = performerMetric === "revenue" ? row.revenue : row.total_bookings;
                const pct = Math.max(4, Math.round((Number(value) / maxTopValue) * 100));
                const name = performerType === "vendors" ? row.business_name || row.vendor_name : row.property_name;
                const sub = performerType === "vendors" ? row.vendor_name : row.vendor_name;

                return (
                  <button
                    key={row.id}
                    onClick={() =>
                      performerType === "vendors" ? setVendorModalId(row.id) : setPropertyModalId(row.id)
                    }
                    className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-[#FBFAF7] transition text-left group"
                  >
                    <span className="w-5 text-[11px] font-bold text-[#9A917D] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-medium text-[#1E2A23] truncate">{name}</span>
                        <span className="text-[12.5px] font-display tabular-nums text-[#1E2A23] flex-shrink-0">
                          {performerMetric === "revenue" ? fmtINR(row.revenue) : `${fmtNum(row.total_bookings)} bk`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-[#EFE9DC] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: i === 0 ? GOLD : GREEN }}
                        />
                      </div>
                      <span className="text-[11px] text-[#9A917D] mt-1 block truncate">{sub}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-[#C9C1AE] group-hover:text-[#2F6F62] flex-shrink-0 transition"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Geography" title="Top Cities" />
          {errors.city ? (
            <ErrorNote message={errors.city} onRetry={loadCityStats} />
          ) : loading.city ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : cityStats.length === 0 ? (
            <EmptyState text="No city data yet." />
          ) : (
            <div className="space-y-3">
              {cityStats.slice(0, 6).map((c) => (
                <div key={`${c.city}-${c.state}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFE9DC] flex items-center justify-center text-[#2F6F62] flex-shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-medium text-[#1E2A23]">{c.city}</p>
                      <p className="text-[11px] text-[#9A917D]">
                        {c.total_properties} properties · {c.total_bookings} bookings
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-display tabular-nums text-[#1E2A23]">
                    {fmtINR(c.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent bookings */}
      <Card className="p-6">
        <SectionHeading
          eyebrow="Latest Activity"
          title="Recent Bookings"
          action={
            <span className="flex items-center gap-1 text-[12px] text-[#2F6F62] font-medium">
              View all <ArrowUpRight size={13} />
            </span>
          }
        />
        {loading.overview ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !overview || overview.recent_bookings.length === 0 ? (
          <EmptyState text="No bookings recorded yet." />
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">
                  <th className="px-2 pb-3 font-semibold">Booking</th>
                  <th className="px-2 pb-3 font-semibold">Guest</th>
                  <th className="px-2 pb-3 font-semibold">Property</th>
                  <th className="px-2 pb-3 font-semibold">Stay</th>
                  <th className="px-2 pb-3 font-semibold">Status</th>
                  <th className="px-2 pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent_bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setBookingModalId(b.id)}
                    className="border-t border-[#EFE9DC] hover:bg-[#FBFAF7] cursor-pointer transition"
                  >
                    <td className="px-2 py-3">
                      <span className="text-[12.5px] font-medium text-[#1E2A23]">{b.booking_number}</span>
                      <span className="block text-[11px] text-[#9A917D]">{fmtDate(b.created_at, true)}</span>
                    </td>
                    <td className="px-2 py-3 text-[12.5px] text-[#4A4438]">{b.guest_name}</td>
                    <td className="px-2 py-3 text-[12.5px] text-[#4A4438] max-w-[180px] truncate">
                      {b.property_name}
                    </td>
                    <td className="px-2 py-3 text-[12px] text-[#4A4438] whitespace-nowrap">
                      {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)}
                    </td>
                    <td className="px-2 py-3">
                      <StatusPill label={b.booking_status} />
                    </td>
                    <td className="px-2 py-3 text-right font-display tabular-nums text-[13px] text-[#1E2A23]">
                      {fmtINR(b.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <BookingDetailModal id={bookingModalId} onClose={() => setBookingModalId(null)} />
      <VendorDetailModal id={vendorModalId} onClose={() => setVendorModalId(null)} />
      <PropertyDetailModal id={propertyModalId} onClose={() => setPropertyModalId(null)} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-[#EFE9DC] flex items-center justify-center text-[#9A917D] mb-3">
        <BadgeCheck size={16} />
      </div>
      <p className="text-[12.5px] text-[#9A917D]">{text}</p>
    </div>
  );
}