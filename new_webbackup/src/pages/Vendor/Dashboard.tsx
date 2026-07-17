import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Building2, BedDouble, Star, MapPin, Search,
    Bell, ChevronRight, Users, IndianRupee, CheckCircle2,
    Clock3, Home, Hotel, Palmtree, ArrowUpRight,
    FileWarning, PenLine, TrendingUp, Globe2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/* ---------------------------------------------------------
   DESIGN TOKENS — kept consistent with the listing-flow screen
   canvas #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line   #DBD3C4   clay #B3452E (attention / needs revision)
--------------------------------------------------------- */

const inputCls =
    "w-full bg-white border border-[#DBD3C4] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition";

/* ---------------------------------------------------------
   TYPES — shaped directly off the SQL schema provided
--------------------------------------------------------- */

type PropertyStatus = "draft" | "pending" | "approved" | "rejected";
type RoomCategory = "private" | "dorm" | "whole_property";

interface RoomTypeSummary {
    id: number;
    room_category: RoomCategory;
    room_name: string;
    total_rooms: number;
    available_rooms: number;
    price: number;
}

interface PropertySummary {
    id: number;
    property_name: string;
    slug: string;
    property_type: string;
    city: string;
    state: string;
    star_rating: number;
    total_rooms: number;
    min_price: number | null;
    max_price: number | null;
    status: PropertyStatus;
    cover_image: string;
    rooms: RoomTypeSummary[];
    last_saved_at: string; // human readable, demo only
}

interface ListingProgress {
    property_id: number;
    current_step: number; // 1-8, matches the onboarding STEPS array
    completed_percentage: number;
    is_completed: boolean;
    progress: Record<"basic_info" | "location" | "photos" | "amenities" | "policies" | "rules" | "rooms", boolean>;
    last_saved_at: string;
}

/* ---------------------------------------------------------
   DEMO DATA — properties 1 & 2 are the real rows from the dump
   (Saffron Bagh, pending + its abandoned draft duplicate). Two
   more are added so the portfolio view and status stamp read
   correctly across all four states the schema defines.
--------------------------------------------------------- */

const VENDOR = {
    first_name: "Rajat",
    last_name: "Yadav",
    business_name: "Web Loxic",
    email: "aryanrao9311@gmail.com",
    status: "active" as const,
};

const PROPERTIES: PropertySummary[] = [
    {
        id: 1,
        property_name: "Saffron Bagh Heritage Stay",
        slug: "saffron-bagh-heritage-stay",
        property_type: "Luxury",
        city: "Udaipur",
        state: "Rajasthan",
        star_rating: 4,
        total_rooms: 9,
        min_price: 950,
        max_price: 4200,
        status: "pending",
        cover_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&q=80",
        rooms: [
            { id: 6, room_category: "private", room_name: "Heritage Garden Room", total_rooms: 6, available_rooms: 4, price: 4200 },
            { id: 7, room_category: "dorm", room_name: "Backpacker Mixed Dorm", total_rooms: 1, available_rooms: 1, price: 950 },
        ],
        last_saved_at: "Jul 1, 12:07 PM",
    },
    {
        id: 2,
        property_name: "Saffron Bagh Heritage Stay",
        slug: "saffron-bagh-heritage-stay-2",
        property_type: "Luxury",
        city: "Udaipur",
        state: "Rajasthan",
        star_rating: 0,
        total_rooms: 0,
        min_price: null,
        max_price: null,
        status: "draft",
        cover_image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=700&q=80",
        rooms: [],
        last_saved_at: "Jul 1, 12:10 PM",
    },
    {
        id: 3,
        property_name: "Dune & Dust Desert Camp",
        slug: "dune-and-dust-desert-camp",
        property_type: "Villa",
        city: "Jaisalmer",
        state: "Rajasthan",
        star_rating: 3,
        total_rooms: 5,
        min_price: 3200,
        max_price: 8600,
        status: "approved",
        cover_image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=700&q=80",
        rooms: [
            { id: 8, room_category: "whole_property", room_name: "Entire Dune Camp", total_rooms: 1, available_rooms: 1, price: 8600 },
            { id: 9, room_category: "private", room_name: "Desert View Tent", total_rooms: 4, available_rooms: 3, price: 3200 },
        ],
        last_saved_at: "Jun 28, 06:40 PM",
    },
    {
        id: 4,
        property_name: "Lake Pichola Boutique Rooms",
        slug: "lake-pichola-boutique-rooms",
        property_type: "Apartment",
        city: "Udaipur",
        state: "Rajasthan",
        star_rating: 0,
        total_rooms: 4,
        min_price: 2100,
        max_price: 3400,
        status: "rejected",
        cover_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=700&q=80",
        rooms: [
            { id: 10, room_category: "private", room_name: "Lakeview Room", total_rooms: 4, available_rooms: 4, price: 2100 },
        ],
        last_saved_at: "Jun 25, 09:12 AM",
    },
];

const PROGRESS: ListingProgress[] = [
    {
        property_id: 1,
        current_step: 7,
        completed_percentage: 100,
        is_completed: true,
        progress: { basic_info: true, location: true, photos: true, amenities: true, policies: true, rules: true, rooms: true },
        last_saved_at: "Jul 1, 12:07 PM",
    },
    {
        property_id: 2,
        current_step: 2,
        completed_percentage: 15,
        is_completed: false,
        progress: { basic_info: true, location: false, photos: false, amenities: false, policies: false, rules: false, rooms: false },
        last_saved_at: "Jul 1, 12:10 PM",
    },
];

const PROGRESS_STEP_LABELS: Record<keyof ListingProgress["progress"], string> = {
    basic_info: "Property details",
    location: "Location",
    photos: "Photos",
    amenities: "Amenities",
    policies: "Policies & rules",
    rules: "House rules",
    rooms: "Rooms & pricing",
};

const propertyTypeIcons: Record<string, LucideIcon> = {
    Villa: Home,
    Apartment: Building2,
    Hostel: BedDouble,
    Luxury: Palmtree,
};

const roomCategoryIcons: Record<RoomCategory, LucideIcon> = {
    private: BedDouble,
    dorm: Users,
    whole_property: Home,
};

/* ---------------------------------------------------------
   STATUS STAMP — the signature element. Vendor listings move
   through an approval workflow the way a paper document would
   at a registrar's office, so status reads as an ink stamp
   rather than a soft little pill.
--------------------------------------------------------- */

const STAMP_STYLES: Record<PropertyStatus, { label: string; color: string; solid?: boolean }> = {
    approved: { label: "Live", color: "#2F6F62" },
    pending: { label: "In review", color: "#C99A3D" },
    draft: { label: "Draft", color: "#9A917D" },
    rejected: { label: "Needs revision", color: "#B3452E" },
};

function StatusStamp({ status }: { status: PropertyStatus }) {
    const s = STAMP_STYLES[status];
    const isDraft = status === "draft";
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[10.5px] font-mono-num font-bold uppercase tracking-[0.12em] select-none"
            style={{
                color: s.color,
                border: `1.5px ${isDraft ? "dashed" : "solid"} ${s.color}`,
                borderRadius: "3px",
                transform: "rotate(-2deg)",
                background: isDraft ? "transparent" : `${s.color}0D`,
            }}
        >
            {status === "approved" && <CheckCircle2 size={11} />}
            {status === "pending" && <Clock3 size={11} />}
            {status === "rejected" && <FileWarning size={11} />}
            {status === "draft" && <PenLine size={11} />}
            {s.label}
        </span>
    );
}

/* ---------------------------------------------------------
   SMALL PRIMITIVES
--------------------------------------------------------- */

function StatCard({
    icon: Icon, label, value, sub, accent,
}: { icon: LucideIcon; label: string; value: string; sub: string; accent: string }) {
    return (
        <div className="bg-white rounded-2xl border border-[#E5DECF] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}14`, color: accent }}
                >
                    <Icon size={16} />
                </span>
            </div>
            <div>
                <p className="font-display text-[28px] leading-none text-[#1E2A23]">{value}</p>
                <p className="text-[12.5px] font-semibold text-[#4A4438] mt-2">{label}</p>
                <p className="text-[11.5px] text-[#9A917D] mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function ProgressBar({ value, color = "#2F6F62" }: { value: number; color?: string }) {
    return (
        <div className="h-1.5 w-full rounded-full bg-[#EFE9DC] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
        </div>
    );
}

/* ---------------------------------------------------------
   CONTINUE-LISTING CARD — surfaces property_listing_progress
   rows where is_completed = 0
--------------------------------------------------------- */

function ContinueListingCard({ property, progress }: { property: PropertySummary; progress: ListingProgress }) {
    const steps = Object.entries(progress.progress) as [keyof ListingProgress["progress"], boolean][];
    const nextStep = steps.find(([, done]) => !done);

    return (
        <div className="rounded-2xl border border-[#C99A3D]/35 bg-[#C99A3D]/[0.05] p-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#E5DECF]">
                <img src={property.cover_image} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-[16.5px] text-[#1E2A23] truncate">{property.property_name}</h3>
                    <StatusStamp status={property.status} />
                </div>
                <p className="text-[12px] text-[#9A917D] mt-1">Last saved {progress.last_saved_at}</p>
                <div className="flex items-center gap-3 mt-3">
                    <ProgressBar value={progress.completed_percentage} color="#C99A3D" />
                    <span className="text-[12px] font-mono-num font-semibold text-[#9A7427] flex-shrink-0">
                        {progress.completed_percentage}%
                    </span>
                </div>
                {nextStep && (
                    <p className="text-[11.5px] text-[#6B6354] mt-2">
                        Next up: <span className="font-semibold text-[#1E2A23]">{PROGRESS_STEP_LABELS[nextStep[0]]}</span>
                    </p>
                )}
            </div>
            <button className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-[#1E2A23] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#16201A] transition whitespace-nowrap">
                Continue listing <ChevronRight size={15} />
            </button>
        </div>
    );
}

/* ---------------------------------------------------------
   PROPERTY CARD — portfolio grid
--------------------------------------------------------- */

function PropertyCard({ property }: { property: PropertySummary }) {
    const TypeIcon = propertyTypeIcons[property.property_type] || Hotel;
    const roomCategoryCounts = property.rooms.reduce<Record<RoomCategory, number>>(
        (acc, r) => ({ ...acc, [r.room_category]: (acc[r.room_category] || 0) + 1 }),
        { private: 0, dorm: 0, whole_property: 0 }
    );

    return (
        <div className="bg-white rounded-2xl border border-[#E5DECF] overflow-hidden flex flex-col group">
            <div className="relative aspect-[16/10]">
                <img src={property.cover_image} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-3 left-3"><StatusStamp status={property.status} /></div>
                <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-[10.5px] font-semibold text-[#1E2A23] px-2 py-1 rounded-full flex items-center gap-1">
                    <TypeIcon size={11} /> {property.property_type}
                </span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-[17px] leading-snug text-[#1E2A23]">{property.property_name}</h3>
                <p className="text-[12px] text-[#9A917D] mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {property.city}, {property.state}
                </p>

                <div className="flex items-center gap-1.5 mt-3">
                    {property.star_rating > 0 ? (
                        <>
                            <Star size={13} className="fill-[#C99A3D] text-[#C99A3D]" />
                            <span className="text-[12.5px] font-semibold font-mono-num text-[#1E2A23]">{property.star_rating}.0</span>
                        </>
                    ) : (
                        <span className="text-[11.5px] text-[#B3AB99]">Not yet rated</span>
                    )}
                </div>

                {property.rooms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {(Object.entries(roomCategoryCounts) as [RoomCategory, number][])
                            .filter(([, count]) => count > 0)
                            .map(([cat, count]) => {
                                const Icon = roomCategoryIcons[cat];
                                const label = cat === "private" ? "private" : cat === "dorm" ? "dorm" : "whole-property";
                                return (
                                    <span key={cat} className="text-[11px] bg-[#F5F2EA] text-[#6B6354] px-2 py-1 rounded-full flex items-center gap-1">
                                        <Icon size={11} /> {count} {label}
                                    </span>
                                );
                            })}
                    </div>
                ) : (
                    <p className="text-[11.5px] text-[#B3AB99] mt-3 italic">No rooms configured yet</p>
                )}

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-[#EFE9DC]">
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#9A917D]">From</p>
                        <p className="font-display text-[18px] text-[#1E2A23] flex items-center">
                            {property.min_price ? (
                                <>
                                    <IndianRupee size={13} className="mt-0.5" />
                                    {property.min_price.toLocaleString("en-IN")}
                                </>
                            ) : (
                                "—"
                            )}
                        </p>
                    </div>
                    <button className="flex items-center gap-1 text-[12.5px] font-semibold text-[#2F6F62] group-hover:gap-1.5 transition-all">
                        Manage <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------------------------------------
   RIGHT RAIL — ledger-style checklist for the listing that
   still needs work, plus a room-inventory breakdown
--------------------------------------------------------- */

function ChecklistLedger({ progress }: { progress: ListingProgress }) {
    const steps = Object.entries(progress.progress) as [keyof ListingProgress["progress"], boolean][];
    return (
        <div className="bg-white rounded-2xl border border-[#E5DECF] p-5">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354]">Listing ledger</p>
                <span className="text-[11px] font-mono-num text-[#9A917D]">{progress.completed_percentage}%</span>
            </div>
            <p className="text-[12px] text-[#9A917D] mb-4">Saffron Bagh · draft copy</p>
            <ul className="space-y-0">
                {steps.map(([key, done], i) => (
                    <li key={key} className="flex items-center gap-3 py-2 border-b border-[#EFE9DC] last:border-0">
                        <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono-num font-bold ${
                                done ? "bg-[#2F6F62] text-white" : "border border-dashed border-[#DBD3C4] text-[#B3AB99]"
                            }`}
                        >
                            {done ? <CheckCircle2 size={12} /> : i + 1}
                        </span>
                        <span className={`text-[13px] flex-1 ${done ? "text-[#1E2A23]" : "text-[#9A917D]"}`}>
                            {PROGRESS_STEP_LABELS[key]}
                        </span>
                        {!done && <span className="text-[10.5px] font-semibold text-[#C99A3D] uppercase tracking-wide">Pending</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RoomInventoryPanel({ properties }: { properties: PropertySummary[] }) {
    const totals = properties.reduce<Record<RoomCategory, number>>(
        (acc, p) => {
            p.rooms.forEach((r) => {
                acc[r.room_category] += r.total_rooms;
            });
            return acc;
        },
        { private: 0, dorm: 0, whole_property: 0 }
    );
    const max = Math.max(1, totals.private, totals.dorm, totals.whole_property);
    const rows: { key: RoomCategory; label: string; color: string }[] = [
        { key: "private", label: "Private rooms", color: "#2F6F62" },
        { key: "dorm", label: "Dorm beds", color: "#C99A3D" },
        { key: "whole_property", label: "Whole-property", color: "#8A6FA8" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-[#E5DECF] p-5">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-4">Inventory across portfolio</p>
            <div className="space-y-3.5">
                {rows.map((row) => (
                    <div key={row.key}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[12.5px] text-[#4A4438]">{row.label}</span>
                            <span className="text-[12px] font-mono-num font-semibold text-[#1E2A23]">{totals[row.key]}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F5F2EA] overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${(totals[row.key] / max) * 100}%`, background: row.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function Dashboard() {
    const [query, setQuery] = useState("");

    const liveProperties = useMemo(() => PROPERTIES.filter((p) => p.status !== "draft"), []);
    const draftProgress = useMemo(() => PROGRESS.filter((p) => !p.is_completed), []);
    const { vendor } = useAuth();

    const filteredProperties = useMemo(() => {
        if (!query.trim()) return liveProperties;
        const q = query.toLowerCase();
        return liveProperties.filter(
            (p) => p.property_name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
        );
    }, [query, liveProperties]);

    const stats = useMemo(() => {
        const approved = PROPERTIES.filter((p) => p.status === "approved").length;
        const pending = PROPERTIES.filter((p) => p.status === "pending").length;
        const totalRooms = PROPERTIES.reduce((sum, p) => sum + p.total_rooms, 0);
        const ratedProps = PROPERTIES.filter((p) => p.star_rating > 0);
        const avgRating = ratedProps.length
            ? (ratedProps.reduce((s, p) => s + p.star_rating, 0) / ratedProps.length).toFixed(1)
            : "—";
        return { total: PROPERTIES.length, approved, pending, totalRooms, avgRating };
    }, []);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
            {/* ---------- MAIN ---------- */}
            <main className="min-w-0">
                    {/* topbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">Vendor overview</p>
                            <h1 className="font-display text-[28px] leading-tight text-[#1E2A23] mt-1">
                                Good to see you, {vendor.first_name.trim()}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                <input
                                    className={inputCls + " pl-9 w-56"}
                                    placeholder="Search your properties"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button className="relative w-10 h-10 rounded-lg border border-[#DBD3C4] bg-white flex items-center justify-center hover:border-[#C99A3D] transition">
                                <Bell size={16} className="text-[#6B6354]" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B3452E] text-white text-[9px] font-bold flex items-center justify-center">2</span>
                            </button>
                        </div>
                    </div>

                    {/* stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={Building2} label="Properties" value={String(stats.total)} sub={`${stats.approved} live now`} accent="#2F6F62" />
                        <StatCard icon={Clock3} label="Awaiting review" value={String(stats.pending)} sub="Usually 24–48 hrs" accent="#C99A3D" />
                        <StatCard icon={BedDouble} label="Total rooms" value={String(stats.totalRooms)} sub="across live listings" accent="#8A6FA8" />
                        <StatCard icon={Star} label="Avg. rating" value={stats.avgRating} sub="from rated stays" accent="#1E2A23" />
                    </div>

                    {/* continue where you left off */}
                    {draftProgress.length > 0 && (
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-display text-[19px] text-[#1E2A23]">Finish setting up</h2>
                                <span className="text-[12px] text-[#9A917D]">{draftProgress.length} listing in progress</span>
                            </div>
                            <div className="space-y-3">
                                {draftProgress.map((progress) => {
                                    const property = PROPERTIES.find((p) => p.id === progress.property_id);
                                    if (!property) return null;
                                    return <ContinueListingCard key={progress.property_id} property={property} progress={progress} />;
                                })}
                            </div>
                        </section>
                    )}

                    {/* portfolio */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-display text-[19px] text-[#1E2A23]">Your portfolio</h2>
                            <button className="flex items-center gap-1 text-[12.5px] font-semibold text-[#2F6F62]">
                                View all <ChevronRight size={14} />
                            </button>
                        </div>
                        {filteredProperties.length > 0 ? (
                            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredProperties.map((p) => (
                                    <PropertyCard key={p.id} property={p} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-14 border-2 border-dashed border-[#DBD3C4] rounded-2xl text-[#9A917D]">
                                <Globe2 size={22} className="mx-auto mb-2 opacity-60" />
                                Nothing matches "{query}" yet.
                            </div>
                        )}
                    </section>
            </main>

            {/* ---------- RIGHT RAIL: INSIGHTS ---------- */}
            <aside className="space-y-5 xl:sticky xl:top-6">
                {draftProgress[0] && <ChecklistLedger progress={draftProgress[0]} />}
                <RoomInventoryPanel properties={liveProperties} />

                <div className="bg-[#1E2A23] rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={15} className="text-[#C99A3D]" />
                        <p className="text-[11px] font-semibold tracking-wide uppercase text-[#C99A3D]">Tip</p>
                    </div>
                    <p className="text-[13px] leading-relaxed text-white/85">
                        Listings with five or more photos and every amenity tagged get reviewed faster and rank higher in search.
                    </p>
                </div>
            </aside>
        </div>
    );
}