import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
    Loader2,
    ArrowLeft,
    MapPin,
    Star,
    Clock,
    Home,
    BedDouble,
    Users,
    Ruler,
    Bath,
    DoorOpen,
    Wind,
    ImageOff,
    Sparkles,
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
    Cigarette,
    Dog,
    PartyPopper,
    Heart,
    Baby,
    CheckCircle2,
    XCircle,
    ScrollText,
    RotateCcw,
} from "lucide-react";

/* ---------------------------------------------------------
   Same tokens as VendorMain:
   canvas #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line   #E5DECF   rust #B3452E
   Fonts: Fraunces (display, via .font-display)
          Inter (body, default)
          JetBrains Mono (figures, via .font-mono-num)
--------------------------------------------------------- */

// amenities.icon in the DB stores exact lucide-react export names
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

const RULE_ICONS: Record<string, any> = {
    smoking_allowed: Cigarette,
    pets_allowed: Dog,
    parties_allowed: PartyPopper,
    couples_allowed: Heart,
    children_allowed: Baby,
};

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
    draft: { bg: "#EFEAE0", text: "#6B6354", ring: "#DBD3C4" },
    pending: { bg: "#FBF0DA", text: "#95721E", ring: "#C99A3D" },
    approved: { bg: "#E7F0EC", text: "#2F6F62", ring: "#2F6F62" },
    rejected: { bg: "#F6E4DF", text: "#B3452E", ring: "#B3452E" },
};

function formatTime(t?: string | null) {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m} ${suffix}`;
}

function formatMoney(v?: number | string | null) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return n.toLocaleString("en-IN");
}

const ListingDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImg, setActiveImg] = useState(0);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${backendUrl}/api/vendor/property/${id}`, {
                    withCredentials: true,
                });
                // controller returns { success, property, address, images, amenities, policies, rules, rooms }
                setData(response.data);
                setActiveImg(0);
            } catch (err) {
                setError("Failed to load property details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPropertyDetails();
    }, [id, backendUrl]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <Loader2 className="animate-spin text-[#C99A3D] w-7 h-7" />
                <p className="text-[12.5px] text-[#9A917D]">Loading property…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto mt-10 rounded-2xl border border-[#F0C9BC] bg-[#F6E4DF] px-6 py-5 text-[#B3452E] text-sm">
                {error}
            </div>
        );
    }

    if (!data?.property) {
        return <div className="p-6 text-[#6B6354] text-sm">Property not found.</div>;
    }

    const { property, address, images = [], amenities = [], policies, rules = [], rooms = [] } = data;
    const status = (property.status || "draft") as string;
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.draft;
    const gallery = images.length > 0 ? images : null;
    const cover = gallery ? gallery[activeImg] : null;

    return (
        <div className="max-w-5xl mx-auto pb-16">
            <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1.5 text-[#9A917D] hover:text-[#1E2A23] mb-5 text-[13px] font-medium transition"
            >
                <ArrowLeft size={15} /> Back to portfolio
            </button>

            {/* ---------------- HERO ---------------- */}
            <div className="rounded-3xl border border-[#E5DECF] bg-white overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Gallery */}
                    <div className="lg:col-span-3 p-4">
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#F5F2EA] border border-dashed border-[#DBD3C4] flex items-center justify-center">
                            {cover ? (
                                <img
                                    src={`${backendUrl}/uploads/properties/${property.id}/${cover.image}`}
                                    alt={property.property_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-[#B3AB99]">
                                    <ImageOff size={26} />
                                    <span className="text-[11.5px]">No photos uploaded yet</span>
                                </div>
                            )}
                        </div>
                        {gallery && gallery.length > 1 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto">
                                {gallery.map((img: any, i: number) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImg(i)}
                                        className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? "border-[#C99A3D]" : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={`${backendUrl}/uploads/properties/${property.id}/${img.image}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Key info */}
                    <div className="lg:col-span-2 p-6 lg:pl-2 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D]">
                                {property.star_rating ? `${property.star_rating}-star stay` : "Unrated stay"}
                            </p>
                            <span
                                className="text-[10.5px] font-semibold uppercase tracking-[0.1em] rounded-full px-3 py-1 border"
                                style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.ring }}
                            >
                                {status}
                            </span>
                        </div>

                        <h1 className="font-display text-[26px] leading-tight text-[#1E2A23] mt-1">
                            {property.property_name}
                        </h1>

                        {address && (
                            <p className="flex items-start gap-1.5 text-[13px] text-[#6B6354] mt-2">
                                <MapPin size={15} className="text-[#9A917D] flex-shrink-0 mt-0.5" />
                                <span>
                                    {[address.area, address.city, address.state, address.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                    {address.landmark ? ` · ${address.landmark}` : ""}
                                </span>
                            </p>
                        )}

                        {property.star_rating ? (
                            <div className="flex gap-0.5 mt-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={15}
                                        className={i < property.star_rating ? "text-[#C99A3D] fill-[#C99A3D]" : "text-[#E5DECF]"}
                                    />
                                ))}
                            </div>
                        ) : null}

                        <p className="text-[13.5px] text-[#6B6354] leading-relaxed mt-4">
                            {property.description || "No description added yet."}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-auto pt-6">
                            <QuickFact icon={Clock} label="Check-in" value={formatTime(property.check_in)} />
                            <QuickFact icon={Clock} label="Check-out" value={formatTime(property.check_out)} />
                            <QuickFact icon={Home} label="Total rooms" value={property.total_rooms ?? "—"} mono />
                            <QuickFact
                                icon={Sparkles}
                                label="Price range"
                                value={
                                    property.min_price
                                        ? `₹${formatMoney(property.min_price)}–${formatMoney(property.max_price)}`
                                        : "Not set"
                                }
                                mono
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------------- AMENITIES ---------------- */}
            {amenities.length > 0 && (
                <Section title="Amenities" eyebrow={`${amenities.length} listed`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {amenities.map((a: any) => {
                            const Icon = AMENITY_ICONS[a.icon] || Sparkles;
                            return (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-2.5 rounded-xl border border-[#E5DECF] bg-white px-3.5 py-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#2F6F62]/10 flex items-center justify-center flex-shrink-0">
                                        <Icon size={15} className="text-[#2F6F62]" />
                                    </div>
                                    <span className="text-[13px] font-medium text-[#1E2A23] truncate">{a.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ---------------- HOUSE RULES ---------------- */}
            {rules.length > 0 && (
                <Section title="House Rules" eyebrow="What's permitted">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {rules.map((r: any) => {
                            const Icon = RULE_ICONS[r.key] || ScrollText;
                            return (
                                <div
                                    key={r.key}
                                    className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3"
                                    style={{
                                        borderColor: r.allowed ? "#CFE1DA" : "#E5DECF",
                                        background: r.allowed ? "#F3F8F6" : "#FAF8F3",
                                    }}
                                >
                                    <Icon size={15} className={r.allowed ? "text-[#2F6F62]" : "text-[#B3AB99]"} />
                                    <span className="text-[12.5px] font-medium text-[#1E2A23] flex-1">{r.label}</span>
                                    {r.allowed ? (
                                        <CheckCircle2 size={15} className="text-[#2F6F62]" />
                                    ) : (
                                        <XCircle size={15} className="text-[#C9A793]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ---------------- POLICIES ---------------- */}
            {policies && (
                <Section title="Policies" eyebrow="Cancellation & refunds">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <PolicyCard icon={RotateCcw} title="Cancellation" text={policies.cancellation_policy} />
                        <PolicyCard icon={ScrollText} title="House rules note" text={policies.house_rules} />
                        <PolicyCard icon={CheckCircle2} title="Refunds" text={policies.refund_policy} />
                    </div>
                </Section>
            )}

            {/* ---------------- ROOMS LEDGER ---------------- */}
            {rooms.length > 0 && (
                <Section title="Rooms & Rates" eyebrow={`${rooms.length} room type${rooms.length > 1 ? "s" : ""}`}>
                    <div className="space-y-3">
                        {rooms.map((room: any) => (
                            <RoomRow key={room.id} room={room} propertyId={property.id} backendUrl={backendUrl} />
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

/* ---------------- shared pieces ---------------- */

const Section = ({
    title,
    eyebrow,
    children,
}: {
    title: string;
    eyebrow?: string;
    children: React.ReactNode;
}) => (
    <div className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-[18px] text-[#1E2A23]">{title}</h2>
            {eyebrow && (
                <span className="text-[11px] uppercase tracking-[0.1em] text-[#9A917D]">{eyebrow}</span>
            )}
        </div>
        {children}
    </div>
);

const QuickFact = ({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: any;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) => (
    <div className="rounded-xl border border-[#E5DECF] bg-[#F5F2EA]/60 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[#9A917D]">
            <Icon size={12} /> {label}
        </p>
        <p className={`text-[13.5px] font-semibold text-[#1E2A23] mt-0.5 ${mono ? "font-mono-num" : ""}`}>
            {value}
        </p>
    </div>
);

const PolicyCard = ({ icon: Icon, title, text }: { icon: any; title: string; text?: string | null }) => (
    <div className="rounded-2xl border border-[#E5DECF] bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={15} className="text-[#C99A3D]" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1E2A23]">{title}</p>
        </div>
        <p className="text-[12.5px] text-[#6B6354] leading-relaxed">{text || "Not specified."}</p>
    </div>
);

const RoomRow = ({ room, propertyId, backendUrl }: { room: any; propertyId:any; backendUrl: string }) => {
    const isDorm = room.room_category === "dorm";
    const price = room.price;
    const occupied = (room.total_rooms || 0) - (room.available_rooms || 0);
    const availPct = room.total_rooms ? Math.round((room.available_rooms / room.total_rooms) * 100) : 0;

    return (
        <div className="rounded-2xl border border-[#E5DECF] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5F2EA] border border-dashed border-[#DBD3C4] flex items-center justify-center flex-shrink-0">
                        {room.images?.[0] ? (
                            <img
                                src={`${backendUrl}/uploads/properties/${propertyId}/rooms/${room.images[0].image}`} alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <DoorOpen size={18} className="text-[#B3AB99]" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14.5px] font-semibold text-[#1E2A23]">{room.room_name}</h3>
                            <span className="text-[10px] uppercase tracking-[0.06em] rounded-full bg-[#2F6F62]/10 text-[#2F6F62] px-2 py-0.5 font-semibold">
                                {room.room_type}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[#6B6354]">
                            <span className="flex items-center gap-1">
                                <Users size={12} /> {room.max_adults ?? 0} adults · {room.max_children ?? 0} kids
                            </span>
                            {room.room_size && (
                                <span className="flex items-center gap-1">
                                    <Ruler size={12} /> {room.room_size} {room.room_size_unit}
                                </span>
                            )}
                            {room.private_bathroom ? (
                                <span className="flex items-center gap-1">
                                    <Bath size={12} /> Private bath
                                </span>
                            ) : null}
                            {room.air_conditioning ? (
                                <span className="flex items-center gap-1">
                                    <Wind size={12} /> AC
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* price ledger */}
                {!isDorm && price && (
                    <div className="text-right flex-shrink-0">
                        <p className="font-mono-num text-[19px] font-semibold text-[#1E2A23]">
                            ₹{formatMoney(price.price)}
                        </p>
                        <p className="text-[11px] text-[#9A917D]">
                            per night · weekend ₹{formatMoney(price.weekend_price)}
                        </p>
                    </div>
                )}
            </div>

            {/* beds */}
            {!isDorm && room.beds?.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-[#E5DECF]">
                    <BedDouble size={14} className="text-[#9A917D]" />
                    {room.beds.map((b: any) => (
                        <span key={b.id} className="text-[12px] text-[#6B6354]">
                            {b.quantity}× {b.bed_type}
                        </span>
                    ))}
                </div>
            )}

            {/* dorm beds — mini ledger, one line per bunk */}
            {isDorm && room.dorm_beds?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-[#E5DECF] space-y-1.5">
                    {room.dorm_beds.map((bed: any) => (
                        <div key={bed.id} className="flex items-center justify-between text-[12.5px]">
                            <span className="flex items-center gap-2 text-[#1E2A23]">
                                <BedDouble size={12} className="text-[#9A917D]" />
                                {bed.bed_label}
                                <span className="text-[#9A917D]">· {bed.bed_type}</span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span
                                    className={`text-[10px] uppercase tracking-[0.06em] font-semibold ${bed.status === "available" ? "text-[#2F6F62]" : "text-[#B3452E]"
                                        }`}
                                >
                                    {bed.status}
                                </span>
                                <span className="font-mono-num font-semibold text-[#1E2A23]">
                                    ₹{formatMoney(bed.price)}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* availability bar */}
            {room.total_rooms ? (
                <div className="mt-4 pt-4 border-t border-dashed border-[#E5DECF]">
                    <div className="flex items-center justify-between text-[11px] text-[#9A917D] mb-1.5">
                        <span>
                            {room.available_rooms} of {room.total_rooms} available
                        </span>
                        <span>{occupied} occupied</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F0EBE0] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#C99A3D]"
                            style={{ width: `${availPct}%` }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ListingDetails;