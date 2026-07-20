import React, { useState, useMemo, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Hotel, Building2, Palmtree, Home, BedDouble, Building,
    MapPin, Image as ImageIcon, Sparkles, ShieldCheck, DoorOpen,
    CheckCircle2, Star, Plus, Trash2, ChevronLeft, ChevronRight,
    Wifi, Car, Utensils, Dumbbell, Waves, Snowflake, Tv, Coffee,
    PawPrint, Cigarette, PartyPopper, Users, Baby, Phone, Mail,
    Globe, Clock, IndianRupee, Check, X, ParkingCircle,
    BellRing, Wine, ChefHat, Refrigerator, Microwave, WashingMachine,
    Bath, Mountain, Flame, ArrowUpCircle, BatteryCharging, Bell,
    Shirt, Plane, Bike, Dog, Lock, Sofa, LampDesk, PlugZap, Laptop,
    Presentation, Briefcase, Gamepad2, Accessibility, Landmark,
    HeartPulse, Package, Wind, Monitor, BrushCleaning, ImagePlus,
    User, FileCheck2, ImageOff,
} from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------------------------------------------------------
   TOKENS
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

const amenityIcons: Record<string, LucideIcon> = {
    Wifi, ParkingCircle, Snowflake, Tv, Waves, Dumbbell, Utensils,
    BellRing, Coffee, Wine, ChefHat, Refrigerator, Microwave,
    WashingMachine, Bath, Building, Trees: Sparkles, Mountain, Flame,
    ArrowUpCircle, BatteryCharging, ShieldCheck, Bell, BrushCleaning,
    Shirt, Plane, Car, Bike, Dog, Cigarette, Users, Lock, Sofa,
    BedDouble, LampDesk, PlugZap, Laptop, Presentation, Briefcase,
    Sparkles, Gamepad2, Baby, Accessibility, Landmark, HeartPulse,
    Package, Wind, Monitor
};

// Sub-steps within this "Property Listing" stage
const STEPS = [
    { key: "type", label: "Property Type", icon: Hotel },
    { key: "details", label: "Property Details", icon: Sparkles },
    { key: "location", label: "Location", icon: MapPin },
    { key: "photos", label: "Photos", icon: ImageIcon },
    { key: "amenities", label: "Amenities", icon: ShieldCheck },
    { key: "policies", label: "Policies & Rules", icon: DoorOpen },
    { key: "rooms", label: "Rooms & Pricing", icon: BedDouble },
    { key: "review", label: "Review & Publish", icon: CheckCircle2 },
];

// Macro onboarding flow — this page is the "Listing" stage
const MACRO_STEPS = [
    { key: "account", label: "Account", icon: User },
    { key: "address", label: "Business Address", icon: MapPin },
    // { key: "documents", label: "Documents", icon: FileCheck2 },
    { key: "listing", label: "Property Listing", icon: Home },
];
const CURRENT_MACRO_STEP = 2; // 0-indexed — "Property Listing" is step 4 of 4

// Property photo pool cap — matches the backend multer limit
// (uploadPropertyImages.js: files: 25). This is now the WHOLE pool of
// photos for the property; rooms in Step 7 pick 1-5 each from it.
const MAX_PROPERTY_PHOTOS = 25;
const MAX_ROOM_PHOTOS = 5;

const uid = () => Math.random().toString(36).slice(2, 9);

const ROOM_CATEGORIES = [
    { id: "private", label: "Private room", hint: "Sold as a whole room", icon: BedDouble },
    { id: "dorm", label: "Dormitory", hint: "Sold bed-by-bed", icon: Users },
    { id: "whole_property", label: "Entire property", hint: "One guest books it all", icon: Home },
] as const;

const STATUS_STYLES: Record<string, string> = {
    available: "bg-[#2F6F62]/8 text-[#2F6F62] border-[#2F6F62]/30",
    blocked: "bg-[#B3452E]/8 text-[#B3452E] border-[#B3452E]/30",
    maintenance: "bg-[#C99A3D]/10 text-[#9A7427] border-[#C99A3D]/30",
};

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

type RoomCategory = "private" | "dorm" | "whole_property";
type DormBedStatus = "available" | "blocked" | "maintenance";

interface Bed {
    id: string | number;
    bed_type: string;
    quantity: number;
}

interface DormBed {
    id: string | number;
    bed_label: string;
    bed_type: string;
    status: DormBedStatus;
    price: number;
}

interface Room {
    id: string | number;
    room_category: RoomCategory;
    room_name: string;
    room_type: string;
    max_adults: number;
    max_children: number;
    total_rooms: number;
    available_rooms: number;
    room_size: number;
    room_size_unit: "sqft" | "sqm";
    private_bathroom: boolean;
    balcony: boolean;
    air_conditioning: boolean;
    beds: Bed[];
    dorm_beds: DormBed[];
    price: number;
    weekend_price: number;
    extra_guest_price: number;
    tax: number;
    // Rooms no longer carry their own uploaded files. They reference photos
    // already uploaded for the property (previewImages) by id, plus which
    // one of those is the room's cover shot.
    image_ids: (string | number)[];
    cover_image_id: string | number | null;
}

interface PropertyDetails {
    property_name: string;
    star_rating: number;
    contact_name: string;
    contact_number: string;
    email: string;
    website: string;
    check_in: string;
    check_out: string;
    total_rooms: number | string;
    description: string;
}

interface PropertyAddress {
    country: string;
    state: string;
    city: string;
    area: string;
    address: string;
    pincode: string;
    landmark: string;
    latitude: string;
    longitude: string;
}

interface Policies {
    cancellation_policy: string;
    house_rules: string;
    refund_policy: string;
}

interface Rules {
    smoking_allowed: boolean;
    pets_allowed: boolean;
    parties_allowed: boolean;
    couples_allowed: boolean;
    children_allowed: boolean;
}

// A single unified image type — `file` is present only for newly-picked
// local images that haven't been uploaded yet. Images that came back from
// the server (already saved) simply won't have a `file`, and their `id`
// is the real property_images.id — which is exactly what rooms need to
// reference in Step 7.
interface PropertyImagePreview {
    id: string | number;
    src: string;
    is_cover: boolean;
    file?: File;
}

/* ---------------------------------------------------------
   BLANK / EMPTY DEFAULTS
   These used to be pre-filled demo content ("Saffron Bagh Heritage Stay",
   3 fully-configured rooms, 5 pre-checked amenities). That's dangerous for
   a real vendor: if they click through the wizard without editing every
   field, they'd publish placeholder content as their real listing. Real
   state now starts empty; demo generators below are only used when the
   vendor explicitly adds a new room via the "+ Add room type" buttons.
--------------------------------------------------------- */

const BLANK_DETAILS: PropertyDetails = {
    property_name: "",
    star_rating: 0,
    contact_name: "",
    contact_number: "",
    email: "",
    website: "",
    check_in: "",
    check_out: "",
    total_rooms: "",
    description: "",
};

const BLANK_ADDRESS: PropertyAddress = {
    country: "India",
    state: "",
    city: "",
    area: "",
    address: "",
    pincode: "",
    landmark: "",
    latitude: "",
    longitude: "",
};

const BLANK_POLICIES: Policies = {
    cancellation_policy: "",
    house_rules: "",
    refund_policy: "",
};

const BLANK_RULES: Rules = {
    smoking_allowed: false,
    pets_allowed: false,
    parties_allowed: false,
    couples_allowed: true,
    children_allowed: true,
};

/* ---------------------------------------------------------
   NEW-ROOM TEMPLATES (used only when the vendor clicks "+ Add room type")
--------------------------------------------------------- */

const NEW_PRIVATE_ROOM = (): Room => ({
    id: uid(),
    room_category: "private",
    room_name: "",
    room_type: "",
    max_adults: 2,
    max_children: 0,
    total_rooms: 1,
    available_rooms: 1,
    room_size: 0,
    room_size_unit: "sqft",
    private_bathroom: true,
    balcony: false,
    air_conditioning: true,
    beds: [{ id: uid(), bed_type: "Queen Bed", quantity: 1 }],
    dorm_beds: [],
    price: 0,
    weekend_price: 0,
    extra_guest_price: 0,
    tax: 0,
    image_ids: [],
    cover_image_id: null,
});

const NEW_DORM_ROOM = (): Room => ({
    id: uid(),
    room_category: "dorm",
    room_name: "",
    room_type: "Dormitory",
    max_adults: 0,
    max_children: 0,
    total_rooms: 1,
    available_rooms: 1,
    room_size: 0,
    room_size_unit: "sqft",
    private_bathroom: false,
    balcony: false,
    air_conditioning: true,
    beds: [],
    dorm_beds: [
        { id: uid(), bed_label: "Bed 1", bed_type: "Bunk - Bottom", status: "available", price: 0 },
    ],
    price: 0,
    weekend_price: 0,
    extra_guest_price: 0,
    tax: 0,
    image_ids: [],
    cover_image_id: null,
});

const NEW_VILLA_ROOM = (): Room => ({
    id: uid(),
    room_category: "whole_property",
    room_name: "",
    room_type: "Whole Property",
    max_adults: 2,
    max_children: 0,
    total_rooms: 1,
    available_rooms: 1,
    room_size: 0,
    room_size_unit: "sqft",
    private_bathroom: true,
    balcony: false,
    air_conditioning: true,
    beds: [{ id: uid(), bed_type: "Queen Bed", quantity: 1 }],
    dorm_beds: [],
    price: 0,
    weekend_price: 0,
    extra_guest_price: 0,
    tax: 0,
    image_ids: [],
    cover_image_id: null,
});

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-1.5">{label}</span>
            {children}
            {hint && <span className="block text-[11px] text-[#9A917D] mt-1">{hint}</span>}
        </label>
    );
}

const inputCls =
    "w-full bg-white border border-[#DBD3C4] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition";

function Toggle({
    checked, onChange, label, icon: Icon,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; icon: LucideIcon }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-center justify-between gap-3 w-full border rounded-xl px-4 py-3 text-left transition ${checked ? "bg-[#2F6F62]/8 border-[#2F6F62]" : "bg-white border-[#DBD3C4] hover:border-[#C99A3D]"
                }`}
        >
            <span className="flex items-center gap-2.5 text-[14px] text-[#1E2A23] font-medium">
                <Icon size={17} className={checked ? "text-[#2F6F62]" : "text-[#9A917D]"} />
                {label}
            </span>
            <span className={`w-9 h-5 rounded-full relative transition flex-shrink-0 ${checked ? "bg-[#2F6F62]" : "bg-[#DBD3C4]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
            </span>
        </button>
    );
}

function StepHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
    return (
        <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">{eyebrow}</p>
            <h2 className="font-display text-[26px] text-[#1E2A23] mt-1">{title}</h2>
            <p className="text-[13.5px] text-[#9A917D] mt-1">{sub}</p>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-[#EFE9DC] pb-3">
            <span className="text-[13px] text-[#9A917D]">{label}</span>
            <span className="text-[13.5px] font-medium text-[#1E2A23] text-right">{value}</span>
        </div>
    );
}

/* ---------------------------------------------------------
   PROSTAYZ WORDMARK — logo slot + name
--------------------------------------------------------- */

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
            <span className="font-display text-[19px] text-[#1E2A23] tracking-tight">Prostayz</span>
        </div>
    );
}

/* ---------------------------------------------------------
   MACRO STEP TRACKER — shows where "Property Listing" sits
   in the wider onboarding flow (Account → Address → Documents → Listing)
--------------------------------------------------------- */

function MacroStepTracker() {
    return (
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-2">
            {MACRO_STEPS.map((m, i) => {
                const Icon = m.icon;
                const done = i < CURRENT_MACRO_STEP;
                const active = i === CURRENT_MACRO_STEP;
                return (
                    <React.Fragment key={m.key}>
                        <span
                            className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-1 rounded-full transition ${
                                active
                                    ? "bg-[#1E2A23] text-white"
                                    : done
                                    ? "text-[#2F6F62]"
                                    : "text-[#B3AB99]"
                            }`}
                        >
                            {done ? (
                                <Check size={11} />
                            ) : active ? (
                                <Icon size={11} />
                            ) : (
                                <span className="font-mono-num">{i + 1}</span>
                            )}
                            {m.label}
                        </span>
                        {i < MACRO_STEPS.length - 1 && (
                            <ChevronRight size={12} className="text-[#DBD3C4] flex-shrink-0" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/* ---------------------------------------------------------
   ROOM PHOTO PICKER — grid of the property's uploaded photo pool.
   Click a photo to toggle it in/out of this room's selection (max 5).
   Click the star on a selected photo to make it this room's cover.

   NOTE: `pool` and `selectedIds` default to [] below. Without these
   defaults, any render where a room's image_ids/property images are
   momentarily undefined (e.g. mid-hydration, or a stale room object from
   a hot-reload) throws "Cannot read properties of undefined (reading
   'length')" and crashes the whole step — which is exactly what you hit.
--------------------------------------------------------- */

function RoomPhotoPicker({
    pool = [],
    selectedIds = [],
    coverId = null,
    onToggle,
    onSetCover,
}: {
    pool?: PropertyImagePreview[];
    selectedIds?: (string | number)[];
    coverId?: string | number | null;
    onToggle: (imageId: string | number) => void;
    onSetCover: (imageId: string | number) => void;
}) {
    const safePool = pool ?? [];
    const safeSelectedIds = selectedIds ?? [];

    if (safePool.length === 0) {
        return (
            <div className="flex items-center gap-2 text-[12.5px] text-[#B3AB99] py-3 px-1">
                <ImageOff size={15} />
                Upload property photos in the Photos step first — you'll pick from
                them here.
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354]">
                    Choose photos for this room
                </p>
                <span className="text-[11px] text-[#9A917D] font-mono-num">
                    {safeSelectedIds.length}/{MAX_ROOM_PHOTOS} selected
                </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {safePool.map((img) => {
                    const selected = safeSelectedIds.includes(img.id);
                    const isCover = coverId === img.id;
                    return (
                        <div
                            key={img.id}
                            onClick={() => onToggle(img.id)}
                            className={`relative rounded-lg overflow-hidden aspect-square border-2 cursor-pointer transition ${
                                selected
                                    ? "border-[#C99A3D]"
                                    : "border-transparent opacity-75 hover:opacity-100"
                            }`}
                        >
                            <img src={img.src} alt="" className="w-full h-full object-cover" />
                            {selected && (
                                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#C99A3D] flex items-center justify-center">
                                    <Check size={10} className="text-white" />
                                </div>
                            )}
                            {selected && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetCover(img.id);
                                    }}
                                    title="Set as this room's cover photo"
                                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center"
                                >
                                    <Star
                                        size={11}
                                        className={isCover ? "text-[#C99A3D] fill-[#C99A3D]" : "text-[#B3AB99]"}
                                    />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function CompleteListing() {
    const [step, setStep] = useState(0);

    // FIX: was hardcoded to `1`, which submitted a possibly-nonexistent
    // property_type_id if the real list didn't contain id 1. Now starts
    // unselected and is validated before the vendor can continue.
    const [propertyType, setPropertyType] = useState<number | null>(null);
    const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
    const [propertyId, setPropertyId] = useState<number | string | null>(null);

    // Property-level photos (Step 3) — a single unified list. This is now
    // also the SOURCE POOL that the Rooms step (Step 6) picks from.
    const [previewImages, setPreviewImages] = useState<PropertyImagePreview[]>([]);
    const navigate = useNavigate();

    const [amenityList, setAmenityList] = useState<any[]>([]);

    // FIX: was pre-filled with fake demo content ("Saffron Bagh Heritage
    // Stay", a real-looking address, 5 pre-checked amenities, 3 fully
    // configured rooms). A vendor who didn't carefully edit every field
    // could publish that placeholder content as their real listing.
    const [details, setDetails] = useState<PropertyDetails>({ ...BLANK_DETAILS });
    const [address, setAddress] = useState<PropertyAddress>({ ...BLANK_ADDRESS });
    const [amenities, setAmenities] = useState<number[]>([]);
    const [policies, setPolicies] = useState<Policies>({ ...BLANK_POLICIES });
    const [rules, setRules] = useState<Rules>({ ...BLANK_RULES });
    const [rooms, setRooms] = useState<Room[]>([]);

    /* -----------------------------------------------------
       PROPERTY TYPE + AMENITY LOOKUPS
    ----------------------------------------------------- */

    const propertyIcons: Record<string, LucideIcon> = {
        Hotel,
        Villa: Home,
        Apartment: Building2,
        Hostel: BedDouble,
        Dormitory: BedDouble,
        luxury: Palmtree,
    };

    const getPropertyTypes = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/property-types`);
            if (response.data.success) {
                setPropertyTypes(response.data.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const getAmenities = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/property-types/amenities`);
            if (response.data.success) {
                setAmenityList(response.data.data);
            }
        } catch (error) {
            toast.error("Unable to load amenities.");
        }
    };

    /* -----------------------------------------------------
       CONTINUE INCOMPLETE LISTING (full hydration, including rooms)
    ----------------------------------------------------- */

    const getIncompleteListing = async () => {
        const loadingToast = toast.loading("Loading your saved listing...");
        try {
            const response = await axios.get(`${backendUrl}/api/listing/continue-listing`, {
                withCredentials: true,
            });
            toast.dismiss(loadingToast);
            if (!response.data.hasListing) return;

            const data = response.data;
            setPropertyId(data.property_id);
            setStep(data.current_step);

            if (data.property) {
                setDetails(data.property);
                // The saved property type must be re-applied to `propertyType`,
                // otherwise re-submitting basic info sends a stale/default id.
                if (data.property.property_type_id) {
                    setPropertyType(Number(data.property.property_type_id));
                }
            }
            if (data.address) setAddress(data.address);

            if (data.amenities) {
                setAmenities(data.amenities.map((item: any) => item.amenity_id));
            }
            if (data.policies) setPolicies(data.policies);
            if (data.rules) setRules(data.rules);

            // Property-level photos — these already exist on the server, so they
            // have no `file` attached (only newly-picked local files get one).
            // These ids are the real property_images.id values the Rooms step
            // needs for its photo picker.
            if (data.images) {
                const preview: PropertyImagePreview[] = data.images.map((img: any) => ({
                    id: img.id,
                    src: `${backendUrl}/uploads/properties/${data.property_id}/${img.image}`,
                    is_cover: !!img.is_cover,
                }));
                setPreviewImages(preview);
            }

            // Rooms — backend returns flat rows joined with price/beds/dorm_beds,
            // and `images` here is the room_property_images link rows joined
            // back to property_images (see listing.controller.js getIncompleteListing).
            if (data.rooms && Array.isArray(data.rooms)) {
                const hydratedRooms: Room[] = data.rooms.map((room: any) => {
                    const linkedImages = room.images || [];
                    const coverLink = linkedImages.find((img: any) => img.is_cover);
                    return {
                        id: room.id,
                        room_category: room.room_category ?? "private",
                        room_name: room.room_name,
                        room_type: room.room_type,
                        max_adults: Number(room.max_adults) || 0,
                        max_children: Number(room.max_children) || 0,
                        total_rooms: Number(room.total_rooms) || 0,
                        available_rooms: Number(room.available_rooms) || 0,
                        room_size: Number(room.room_size) || 0,
                        room_size_unit: room.room_size_unit ?? "sqft",
                        private_bathroom: !!room.private_bathroom,
                        balcony: !!room.balcony,
                        air_conditioning: !!room.air_conditioning,
                        price: Number(room.price) || 0,
                        weekend_price: Number(room.weekend_price ?? room.price) || 0,
                        extra_guest_price: Number(room.extra_guest_price) || 0,
                        tax: Number(room.tax) || 0,
                        beds: (room.beds || []).map((b: any) => ({
                            id: b.id,
                            bed_type: b.bed_type,
                            quantity: b.quantity,
                        })),
                        dorm_beds: (room.dorm_beds || []).map((b: any) => ({
                            id: b.id,
                            bed_label: b.bed_label,
                            bed_type: b.bed_type,
                            status: b.status,
                            price: Number(b.price) || 0,
                        })),
                        // Defensive: always arrays/nullable, never undefined —
                        // this is what RoomPhotoPicker reads .length off of.
                        image_ids: linkedImages.map((img: any) => img.property_image_id) ?? [],
                        cover_image_id: coverLink ? coverLink.property_image_id : (linkedImages[0]?.property_image_id ?? null),
                    };
                });
                setRooms(hydratedRooms);
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || "Failed to load your saved listing.");
            console.error(error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([getPropertyTypes(), getAmenities()]);
            await getIncompleteListing();
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* -----------------------------------------------------
       STEP 0: PROPERTY TYPE
    ----------------------------------------------------- */

    const confirmPropertyType = () => {
        if (propertyType === null) {
            toast.error("Please select a property type to continue.");
            return;
        }
        goNext();
    };

    /* -----------------------------------------------------
       STEP 1: BASIC INFO
    ----------------------------------------------------- */

    const saveBasicInformation = async () => {
        if (propertyType === null) {
            toast.error("Please go back and select a property type.");
            return;
        }
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/basic-information`,
                {
                    property_id: propertyId,
                    property_type_id: propertyType,
                    property_name: details.property_name,
                    description: details.description,
                    star_rating: details.star_rating,
                    contact_name: details.contact_name,
                    contact_number: details.contact_number,
                    email: details.email,
                    website: details.website,
                    check_in: details.check_in,
                    check_out: details.check_out,
                    total_rooms: details.total_rooms,
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                setPropertyId(response.data.property_id);
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong.");
        }
    };

    /* -----------------------------------------------------
       STEP 2: LOCATION
    ----------------------------------------------------- */

    const saveLocation = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/location`,
                {
                    property_id: propertyId,
                    country: address.country,
                    state: address.state,
                    city: address.city,
                    area: address.area,
                    address: address.address,
                    pincode: address.pincode,
                    landmark: address.landmark,
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to save location.");
        }
    };

    /* -----------------------------------------------------
       STEP 3: PROPERTY PHOTOS
       previewImages is the single source of truth. Adding files appends to
       whatever is already there (including hydrated server images);
       removing just filters that one image out.
       Cap raised to MAX_PROPERTY_PHOTOS (25) since this is now the whole
       pool that rooms pick from, not a per-step limited upload.
    ----------------------------------------------------- */

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (previewImages.length + files.length > MAX_PROPERTY_PHOTOS) {
            toast.error(`Maximum ${MAX_PROPERTY_PHOTOS} images allowed.`);
            return;
        }
        const newItems: PropertyImagePreview[] = files.map((file) => ({
            id: uid(),
            file,
            src: URL.createObjectURL(file),
            is_cover: previewImages.length === 0, // only auto-cover if nothing exists yet
        }));
        setPreviewImages((prev) => [...prev, ...newItems]);
        e.target.value = ""; // allow re-selecting the same file again later
    };

    const removeImage = (id: string | number) => {
        setPreviewImages((prev) => {
            const removed = prev.find((img) => img.id === id);
            if (removed?.file) URL.revokeObjectURL(removed.src); // only revoke blob urls we created
            const filtered = prev.filter((img) => img.id !== id);
            if (filtered.length && !filtered.some((img) => img.is_cover)) {
                filtered[0] = { ...filtered[0], is_cover: true };
            }
            return filtered;
        });
        // If a room had this photo selected, drop the reference so we never
        // hold onto a dangling id (removing a property photo should not
        // silently break a room's selection without the room UI reflecting it).
        setRooms((rs) =>
            rs.map((r) => {
                if (!r.image_ids.includes(id)) return r;
                const nextIds = r.image_ids.filter((imgId) => imgId !== id);
                const nextCover = r.cover_image_id === id ? (nextIds[0] ?? null) : r.cover_image_id;
                return { ...r, image_ids: nextIds, cover_image_id: nextCover };
            })
        );
    };

    const setCoverImage = (id: string | number) => {
        setPreviewImages((prev) => prev.map((img) => ({ ...img, is_cover: img.id === id })));
    };

    const savePhotos = async () => {
        try {
            if (previewImages.length === 0) {
                toast.error("Please select images.");
                return;
            }

            // Only images picked locally (not yet on the server) need uploading.
            const newFiles = previewImages.filter((img) => img.file);

            // Everything is already saved from a previous session — nothing new
            // to upload, ids are already real, just move on.
            if (newFiles.length === 0) {
                goNext();
                return;
            }

            const formData = new FormData();
            formData.append("property_id", String(propertyId));
            newFiles.forEach((img) => {
                formData.append("images", img.file as File);
            });
            const response = await axios.post(`${backendUrl}/api/listing/photos`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response.data.success) {
                toast.success(response.data.message);

                // IMPORTANT: swap local blob-url images for the server's real
                // rows (real property_images.id + filename). Rooms in Step 7
                // reference these ids directly, so we can't keep using the
                // temporary local `uid()` ids past this point. The backend now
                // returns the FULL current image list (old + new) here — see
                // savePropertyImages in the controller — so this correctly
                // replaces local state with authoritative server ids without
                // losing any previously-saved photos.
                if (response.data.images) {
                    previewImages.forEach((img) => {
                        if (img.file) URL.revokeObjectURL(img.src);
                    });
                    const preview: PropertyImagePreview[] = response.data.images.map((img: any) => ({
                        id: img.id,
                        src: `${backendUrl}/uploads/properties/${propertyId}/${img.image}`,
                        is_cover: !!img.is_cover,
                    }));
                    setPreviewImages(preview);
                }

                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to upload photos.");
        }
    };

    /* -----------------------------------------------------
       STEP 4: AMENITIES
    ----------------------------------------------------- */

    const toggleAmenity = (id: number) =>
        setAmenities((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

    const saveAmenities = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/amenities`,
                { property_id: propertyId, amenities },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to save amenities.");
        }
    };

    /* -----------------------------------------------------
       STEP 5: POLICIES & RULES
    ----------------------------------------------------- */

    const savePolicies = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/policies`,
                {
                    property_id: propertyId,
                    cancellation_policy: policies.cancellation_policy,
                    house_rules: policies.house_rules,
                    refund_policy: policies.refund_policy,
                    smoking_allowed: rules.smoking_allowed,
                    pets_allowed: rules.pets_allowed,
                    parties_allowed: rules.parties_allowed,
                    couples_allowed: rules.couples_allowed,
                    children_allowed: rules.children_allowed,
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to save policies.");
        }
    };

    /* -----------------------------------------------------
       STEP 6: ROOMS
       Rooms no longer upload their own images — they pick 1-5 from
       `previewImages` (the property's own photo pool from Step 3).
    ----------------------------------------------------- */

    const updateRoom = (id: string | number, patch: Partial<Room>) =>
        setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const addRoom = (category: RoomCategory = "private") =>
        setRooms((rs) => [
            ...rs,
            category === "dorm" ? NEW_DORM_ROOM() : category === "whole_property" ? NEW_VILLA_ROOM() : NEW_PRIVATE_ROOM(),
        ]);

    const removeRoom = (id: string | number) => setRooms((rs) => rs.filter((r) => r.id !== id));

    const addBed = (roomId: string | number) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, beds: [...r.beds, { id: uid(), bed_type: "Single Bed", quantity: 1 }] }
                    : r
            )
        );

    const removeBed = (roomId: string | number, bedId: string | number) =>
        setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, beds: r.beds.filter((b) => b.id !== bedId) } : r)));

    const updateBed = (roomId: string | number, bedId: string | number, patch: Partial<Bed>) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b)) }
                    : r
            )
        );

    const addDormBed = (roomId: string | number) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? {
                        ...r,
                        dorm_beds: [
                            ...r.dorm_beds,
                            {
                                id: uid(),
                                bed_label: `Bed ${r.dorm_beds.length + 1}`,
                                bed_type: "Bunk - Bottom",
                                status: "available" as DormBedStatus,
                                price: r.price || 0,
                            },
                        ],
                    }
                    : r
            )
        );

    const removeDormBed = (roomId: string | number, bedId: string | number) =>
        setRooms((rs) =>
            rs.map((r) => (r.id === roomId ? { ...r, dorm_beds: r.dorm_beds.filter((b) => b.id !== bedId) } : r))
        );

    const updateDormBed = (roomId: string | number, bedId: string | number, patch: Partial<DormBed>) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, dorm_beds: r.dorm_beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b)) }
                    : r
            )
        );

    // Toggle a property photo in/out of a room's selection (max 5 per room).
    const toggleRoomImage = (roomId: string | number, imageId: string | number) => {
        setRooms((rs) =>
            rs.map((r) => {
                if (r.id !== roomId) return r;
                const already = r.image_ids.includes(imageId);
                let nextIds: (string | number)[];
                if (already) {
                    nextIds = r.image_ids.filter((id) => id !== imageId);
                } else {
                    if (r.image_ids.length >= MAX_ROOM_PHOTOS) {
                        toast.error(`Maximum ${MAX_ROOM_PHOTOS} photos per room.`);
                        return r;
                    }
                    nextIds = [...r.image_ids, imageId];
                }
                const nextCover = nextIds.includes(r.cover_image_id as any) ? r.cover_image_id : (nextIds[0] ?? null);
                return { ...r, image_ids: nextIds, cover_image_id: nextCover };
            })
        );
    };

    const setRoomCoverImage = (roomId: string | number, imageId: string | number) =>
        setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, cover_image_id: imageId } : r)));

    const saveRooms = async () => {
        try {
            if (!rooms.length) {
                toast.error("Add at least one room.");
                return;
            }
            for (const r of rooms) {
                if (!r.room_name?.trim()) {
                    toast.error("Every room needs a name.");
                    return;
                }
                if (r.image_ids.length === 0) {
                    toast.error(`"${r.room_name || "A room"}" needs at least one photo selected.`);
                    return;
                }
            }

            // Plain JSON now — no FormData, no files. Rooms only carry
            // references (image_ids / cover_image_id) into photos that were
            // already uploaded in Step 3.
            const payload = {
                property_id: propertyId,
                rooms: rooms.map(({ id, ...rest }) => rest),
            };

            const response = await axios.post(`${backendUrl}/api/listing/rooms`, payload, {
                withCredentials: true,
            });

            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to save rooms.");
        }
    };

    /* -----------------------------------------------------
      PUBLISH
    ----------------------------------------------------- */

    const publishListing = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/publish`,
                { property_id: propertyId },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                // e.g. redirect to vendor dashboard / listings list
                navigate("/vendor/dashboard");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to publish listing.");
        }
    };

    /* -----------------------------------------------------
       NAVIGATION
    ----------------------------------------------------- */

    const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
    const goPrev = () => setStep((s) => Math.max(0, s - 1));

    const handleNext = async () => {
        switch (step) {
            case 0:
                confirmPropertyType();
                break;
            case 1:
                await saveBasicInformation();
                break;
            case 2:
                await saveLocation();
                break;
            case 3:
                await savePhotos();
                break;
            case 4:
                await saveAmenities();
                break;
            case 5:
                await savePolicies();
                break;
            case 6:
                await saveRooms();
                break;
            default:
                goNext();
        }
    };

    /* -----------------------------------------------------
       DERIVED VALUES
    ----------------------------------------------------- */

    const selectedType = propertyTypes.find((t) => t.id === propertyType);
    const SelectedIcon = selectedType ? propertyIcons[selectedType.name] : null;

    const coverImage =
        previewImages.find((img) => img.is_cover) ?? (previewImages.length > 0 ? previewImages[0] : null);

    const priceRange = useMemo(() => {
        if (!rooms.length) return null;
        const prices = rooms.map((r) =>
            r.room_category === "dorm"
                ? Math.min(...(r.dorm_beds.length ? r.dorm_beds.map((b) => Number(b.price) || 0) : [0]))
                : Number(r.price) || 0
        );
        return [Math.min(...prices), Math.max(...prices)];
    }, [rooms]);

    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */

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

            {/* ── Top bar: Prostayz brand + macro step tracker ─────────────────── */}
            <div className="border-b border-[#E5DECF] bg-white/70 backdrop-blur sticky top-0 z-20">
                <div className="max-w-[1280px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
                    <ProstayzMark />
                    <MacroStepTracker />
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-6">
                {/* ---------- LEFT: STEP RAIL ---------- */}
                <aside className="lg:sticky lg:top-[76px] h-fit">
                    <div className="mb-6">
                        <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">
                            Step {CURRENT_MACRO_STEP + 1} of {MACRO_STEPS.length} · Property Listing
                        </p>
                        <h1 className="font-display text-[26px] leading-tight text-[#1E2A23] mt-1">Create listing</h1>
                        <p className="text-[12.5px] text-[#9A917D] mt-1.5">
                            The last stretch — your account, address and documents are already done.
                        </p>
                    </div>
                    <ol className="space-y-1">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;
                            return (
                                <li key={s.key}>
                                    <button
                                        // onClick={() => setStep(i)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition group ${active ? "bg-[#1E2A23] text-white" : "hover:bg-[#EAE4D6] text-[#1E2A23]"
                                            }`}
                                    >
                                        <span
                                            className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-mono-num flex-shrink-0 ${active
                                                ? "bg-[#C99A3D] text-[#1E2A23]"
                                                : done
                                                    ? "bg-[#2F6F62] text-white"
                                                    : "bg-[#E3DCCC] text-[#9A917D]"
                                                }`}
                                        >
                                            {done ? <Check size={14} /> : i + 1}
                                        </span>
                                        <span className="flex-1 text-[13.5px] font-medium">{s.label}</span>
                                        <Icon size={15} className={active ? "text-white/70" : "text-[#B3AB99]"} />
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </aside>

                {/* ---------- CENTER: STEP CONTENT ---------- */}
                <main className="bg-white rounded-2xl border border-[#E5DECF] p-7 lg:p-9 min-h-[640px] flex flex-col">
                    <div className="flex-1">
                        {/* STEP 0: TYPE */}
                        {step === 0 && (
                            <div>
                                <StepHeader eyebrow="Step 1" title="What kind of place is this?" sub="Pick the closest match — you can refine details next." />
                                {loading ? (
                                    <p className="text-[13px] text-[#9A917D] mt-6">Loading property types…</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                                        {propertyTypes.map((t) => {
                                            const Icon = propertyIcons[t.name];
                                            const active = propertyType === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setPropertyType(t.id)}
                                                    className={`text-left rounded-xl border p-4 transition ${active ? "border-[#2F6F62] bg-[#2F6F62]/6 ring-1 ring-[#2F6F62]" : "border-[#E5DECF] hover:border-[#C99A3D]"
                                                        }`}
                                                >
                                                    {Icon && <Icon size={22} className={active ? "text-[#2F6F62]" : "text-[#6B6354]"} />}
                                                    <p className="mt-2.5 text-[14px] font-semibold text-[#1E2A23]">{t.name}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 1: DETAILS */}
                        {step === 1 && (
                            <div>
                                <StepHeader eyebrow="Step 2" title="Tell guests about the property" sub="The essentials that shape the listing page." />
                                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                    <Field label="Property name">
                                        <input className={inputCls} value={details.property_name}
                                            onChange={(e) => setDetails({ ...details, property_name: e.target.value })} />
                                    </Field>
                                    <Field label="Star rating">
                                        <div className="flex items-center gap-1.5 pt-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button key={n} onClick={() => setDetails({ ...details, star_rating: n })}>
                                                    <Star size={22} className={n <= details.star_rating ? "fill-[#C99A3D] text-[#C99A3D]" : "text-[#DBD3C4]"} />
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label="Contact name">
                                        <input className={inputCls} value={details.contact_name}
                                            onChange={(e) => setDetails({ ...details, contact_name: e.target.value })} />
                                    </Field>
                                    <Field label="Contact number">
                                        <div className="relative">
                                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                            <input className={inputCls + " pl-9"} value={details.contact_number}
                                                onChange={(e) => setDetails({ ...details, contact_number: e.target.value })} />
                                        </div>
                                    </Field>
                                    <Field label="Email">
                                        <div className="relative">
                                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                            <input className={inputCls + " pl-9"} value={details.email}
                                                onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                                        </div>
                                    </Field>
                                    <Field label="Website">
                                        <div className="relative">
                                            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                            <input className={inputCls + " pl-9"} value={details.website}
                                                onChange={(e) => setDetails({ ...details, website: e.target.value })} />
                                        </div>
                                    </Field>
                                    <Field label="Check-in time">
                                        <div className="relative">
                                            <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                            <input type="time" className={inputCls + " pl-9"} value={details.check_in}
                                                onChange={(e) => setDetails({ ...details, check_in: e.target.value })} />
                                        </div>
                                    </Field>
                                    <Field label="Check-out time">
                                        <div className="relative">
                                            <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                            <input type="time" className={inputCls + " pl-9"} value={details.check_out}
                                                onChange={(e) => setDetails({ ...details, check_out: e.target.value })} />
                                        </div>
                                    </Field>
                                    <Field label="Total rooms">
                                        <input type="number" className={inputCls} value={details.total_rooms}
                                            onChange={(e) => setDetails({ ...details, total_rooms: e.target.value })} />
                                    </Field>
                                </div>
                                <Field label="Description" hint="Two or three sentences that set the scene.">
                                    <textarea rows={4} className={inputCls + " mt-1"} value={details.description}
                                        onChange={(e) => setDetails({ ...details, description: e.target.value })} />
                                </Field>
                            </div>
                        )}

                        {/* STEP 2: LOCATION */}
                        {step === 2 && (
                            <div>
                                <StepHeader eyebrow="Step 3" title="Where will guests find you?" sub="Used for search, maps, and directions." />
                                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                    <Field label="Country">
                                        <input className={inputCls} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                                    </Field>
                                    <Field label="State">
                                        <input className={inputCls} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                                    </Field>
                                    <Field label="City">
                                        <input className={inputCls} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                                    </Field>
                                    <Field label="Area">
                                        <input className={inputCls} value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} />
                                    </Field>
                                    <Field label="Pincode">
                                        <input className={inputCls} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                                    </Field>
                                    <Field label="Landmark">
                                        <input className={inputCls} value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                                    </Field>
                                </div>
                                <Field label="Full address">
                                    <textarea rows={2} className={inputCls + " mt-1"} value={address.address}
                                        onChange={(e) => setAddress({ ...address, address: e.target.value })} />
                                </Field>
                                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                    <Field label="Latitude">
                                        <input className={inputCls + " font-mono-num"} value={address.latitude} onChange={(e) => setAddress({ ...address, latitude: e.target.value })} />
                                    </Field>
                                    <Field label="Longitude">
                                        <input className={inputCls + " font-mono-num"} value={address.longitude} onChange={(e) => setAddress({ ...address, longitude: e.target.value })} />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PHOTOS */}
                        {step === 3 && (
                            <div>
                                <StepHeader
                                    eyebrow="Step 4"
                                    title="Show the property"
                                    sub={`Upload every photo you have — up to ${MAX_PROPERTY_PHOTOS}. You'll assign 1-5 of these to each room in Step 7.`}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                                    {previewImages.map((image) => (
                                        <div key={image.id} className="relative rounded-xl overflow-hidden border group">
                                            <img src={image.src} className="w-full h-40 object-cover" alt="" />
                                            {image.is_cover && (
                                                <span className="absolute top-2 left-2 bg-[#1E2A23] text-white text-[9px] font-semibold uppercase px-2 py-1 rounded-full">
                                                    Cover
                                                </span>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                                {!image.is_cover && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCoverImage(image.id)}
                                                        className="bg-white text-[#1E2A23] p-1.5 rounded-full"
                                                        title="Set as cover"
                                                    >
                                                        <Check size={13} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(image.id)}
                                                    className="bg-white text-[#B3452E] p-1.5 rounded-full"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {previewImages.length < MAX_PROPERTY_PHOTOS && (
                                        <label className="border-2 border-dashed rounded-xl h-40 flex items-center justify-center cursor-pointer">
                                            <div className="text-center">
                                                <Plus size={28} />
                                                <p>Add Photos</p>
                                            </div>
                                            <input type="file" multiple accept="image/*" hidden onChange={handleImageSelect} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: AMENITIES */}
                        {step === 4 && (
                            <div>
                                <StepHeader eyebrow="Step 5" title="What's included?" sub="Select everything guests can use on site." />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                                    {amenityList.map((a) => {
                                        const Icon = amenityIcons[a.icon] || ShieldCheck;
                                        const active = amenities.includes(a.id);
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => toggleAmenity(a.id)}
                                                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition ${active ? "border-[#2F6F62] bg-[#2F6F62]/6" : "border-[#E5DECF]"
                                                    }`}
                                            >
                                                <Icon size={17} className={active ? "text-[#2F6F62]" : "text-[#9A917D]"} />
                                                <span className="text-[13px]">{a.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 5: POLICIES & RULES */}
                        {step === 5 && (
                            <div>
                                <StepHeader eyebrow="Step 6" title="Policies & house rules" sub="Set guest expectations before they book." />
                                <div className="space-y-4 mt-6">
                                    <Field label="Cancellation policy">
                                        <textarea rows={2} className={inputCls} value={policies.cancellation_policy}
                                            onChange={(e) => setPolicies({ ...policies, cancellation_policy: e.target.value })} />
                                    </Field>
                                    <Field label="House rules">
                                        <textarea rows={2} className={inputCls} value={policies.house_rules}
                                            onChange={(e) => setPolicies({ ...policies, house_rules: e.target.value })} />
                                    </Field>
                                    <Field label="Refund policy">
                                        <textarea rows={2} className={inputCls} value={policies.refund_policy}
                                            onChange={(e) => setPolicies({ ...policies, refund_policy: e.target.value })} />
                                    </Field>
                                </div>
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mt-7 mb-2.5">Stay rules</p>
                                <div className="grid sm:grid-cols-2 gap-2.5">
                                    <Toggle label="Smoking allowed" icon={Cigarette} checked={rules.smoking_allowed} onChange={(v) => setRules({ ...rules, smoking_allowed: v })} />
                                    <Toggle label="Pets allowed" icon={PawPrint} checked={rules.pets_allowed} onChange={(v) => setRules({ ...rules, pets_allowed: v })} />
                                    <Toggle label="Parties allowed" icon={PartyPopper} checked={rules.parties_allowed} onChange={(v) => setRules({ ...rules, parties_allowed: v })} />
                                    <Toggle label="Couples allowed" icon={Users} checked={rules.couples_allowed} onChange={(v) => setRules({ ...rules, couples_allowed: v })} />
                                    <Toggle label="Children allowed" icon={Baby} checked={rules.children_allowed} onChange={(v) => setRules({ ...rules, children_allowed: v })} />
                                </div>
                            </div>
                        )}

                        {/* STEP 6: ROOMS */}
                        {step === 6 && (
                            <div>
                                <StepHeader eyebrow="Step 7" title="Rooms & pricing" sub="Private rooms, dorm beds, or the entire property — each sells differently. Pick photos for each room from what you uploaded in Step 4." />
                                <div className="space-y-5 mt-6">
                                    {rooms.map((r, idx) => (
                                        <div key={r.id} className="rounded-xl border border-[#E5DECF] overflow-hidden">
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <input
                                                            placeholder="Room name"
                                                            className="font-display text-[17px] text-[#1E2A23] bg-transparent outline-none border-b border-transparent focus:border-[#2F6F62] placeholder-[#B3AB99]"
                                                            value={r.room_name}
                                                            onChange={(e) => updateRoom(r.id, { room_name: e.target.value })}
                                                        />
                                                        <p className="text-[12px] text-[#9A917D] font-mono-num">
                                                            Room {String(idx + 1).padStart(2, "0")} · {r.room_type || "Untitled type"}
                                                        </p>
                                                    </div>
                                                    {rooms.length > 1 && (
                                                        <button onClick={() => removeRoom(r.id)} className="text-[#B3452E] p-1.5 hover:bg-[#B3452E]/8 rounded-lg flex-shrink-0">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* category selector */}
                                                <div className="grid grid-cols-3 gap-2 mb-5">
                                                    {ROOM_CATEGORIES.map((c) => {
                                                        const Icon = c.icon;
                                                        const active = r.room_category === c.id;
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => updateRoom(r.id, { room_category: c.id as RoomCategory })}
                                                                className={`text-left rounded-lg border px-3 py-2.5 transition ${active ? "border-[#2F6F62] bg-[#2F6F62]/6" : "border-[#E5DECF] hover:border-[#C99A3D]"
                                                                    }`}
                                                            >
                                                                <Icon size={15} className={active ? "text-[#2F6F62]" : "text-[#9A917D]"} />
                                                                <p className="text-[12.5px] font-semibold text-[#1E2A23] mt-1">{c.label}</p>
                                                                <p className="text-[10.5px] text-[#9A917D]">{c.hint}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                    <Field label="Type label">
                                                        <input className={inputCls} value={r.room_type} onChange={(e) => updateRoom(r.id, { room_type: e.target.value })} />
                                                    </Field>
                                                    <Field label={r.room_category === "whole_property" ? "Sleeps (adults)" : "Max adults"}>
                                                        <input type="number" className={inputCls} value={r.max_adults} onChange={(e) => updateRoom(r.id, { max_adults: Number(e.target.value) })} />
                                                    </Field>
                                                    <Field label="Max children">
                                                        <input type="number" className={inputCls} value={r.max_children} onChange={(e) => updateRoom(r.id, { max_children: Number(e.target.value) })} />
                                                    </Field>
                                                    <Field label="Size (sqft)">
                                                        <input type="number" className={inputCls} value={r.room_size} onChange={(e) => updateRoom(r.id, { room_size: Number(e.target.value) })} />
                                                    </Field>
                                                </div>

                                                {r.room_category !== "whole_property" && (
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <Field label={r.room_category === "dorm" ? "Dorm rooms on site" : "Total rooms"}>
                                                            <input type="number" className={inputCls} value={r.total_rooms} onChange={(e) => updateRoom(r.id, { total_rooms: Number(e.target.value) })} />
                                                        </Field>
                                                        <Field label="Available now">
                                                            <input type="number" className={inputCls} value={r.available_rooms} onChange={(e) => updateRoom(r.id, { available_rooms: Number(e.target.value) })} />
                                                        </Field>
                                                    </div>
                                                )}

                                                {r.room_category !== "dorm" && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                        <Field label="Nightly rate (₹)">
                                                            <input type="number" className={inputCls + " font-mono-num"} value={r.price} onChange={(e) => updateRoom(r.id, { price: Number(e.target.value) })} />
                                                        </Field>
                                                        <Field label="Weekend rate (₹)">
                                                            <input type="number" className={inputCls + " font-mono-num"} value={r.weekend_price} onChange={(e) => updateRoom(r.id, { weekend_price: Number(e.target.value) })} />
                                                        </Field>
                                                        <Field label="Extra guest (₹)">
                                                            <input type="number" className={inputCls + " font-mono-num"} value={r.extra_guest_price} onChange={(e) => updateRoom(r.id, { extra_guest_price: Number(e.target.value) })} />
                                                        </Field>
                                                        <Field label="Tax (%)">
                                                            <input type="number" className={inputCls + " font-mono-num"} value={r.tax} onChange={(e) => updateRoom(r.id, { tax: Number(e.target.value) })} />
                                                        </Field>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {(
                                                        [
                                                            ["private_bathroom", "Private bathroom"],
                                                            ["balcony", "Balcony"],
                                                            ["air_conditioning", "Air conditioning"],
                                                        ] as const
                                                    ).map(([k, label]) => (
                                                        <button
                                                            key={k}
                                                            onClick={() => updateRoom(r.id, { [k]: !r[k] } as Partial<Room>)}
                                                            className={`text-[12.5px] font-medium px-3 py-1.5 rounded-full border transition ${r[k] ? "bg-[#2F6F62] text-white border-[#2F6F62]" : "border-[#DBD3C4] text-[#6B6354]"
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* PRIVATE / WHOLE PROPERTY: bed composition */}
                                                {r.room_category !== "dorm" && (
                                                    <>
                                                        <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-2">
                                                            {r.room_category === "whole_property" ? "Beds across the property" : "Beds in this room"}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {r.beds.map((b) => (
                                                                <div key={b.id} className="flex items-center gap-2">
                                                                    <input className={inputCls + " flex-1"} value={b.bed_type} onChange={(e) => updateBed(r.id, b.id, { bed_type: e.target.value })} />
                                                                    <input type="number" className={inputCls + " w-20 font-mono-num"} value={b.quantity} onChange={(e) => updateBed(r.id, b.id, { quantity: Number(e.target.value) })} />
                                                                    <button onClick={() => removeBed(r.id, b.id)} className="text-[#B3452E] p-2 hover:bg-[#B3452E]/8 rounded-lg">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addBed(r.id)} className="text-[12.5px] font-medium text-[#2F6F62] flex items-center gap-1 pt-1">
                                                                <Plus size={13} /> Add bed type
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {/* DORM: per-bed inventory */}
                                                {r.room_category === "dorm" && (
                                                    <>
                                                        <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-2">
                                                            Individual beds · sold separately
                                                        </p>
                                                        <div className="space-y-2">
                                                            {r.dorm_beds.map((b) => (
                                                                <div key={b.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                                    <input className={inputCls + " w-full sm:w-36"} value={b.bed_label} onChange={(e) => updateDormBed(r.id, b.id, { bed_label: e.target.value })} />
                                                                    <input className={inputCls + " flex-1"} value={b.bed_type} onChange={(e) => updateDormBed(r.id, b.id, { bed_type: e.target.value })} />
                                                                    <div className="relative w-28">
                                                                        <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                                                                        <input type="number" className={inputCls + " pl-7 font-mono-num"} value={b.price} onChange={(e) => updateDormBed(r.id, b.id, { price: Number(e.target.value) })} />
                                                                    </div>
                                                                    <select
                                                                        className={`text-[11.5px] font-semibold px-2.5 py-2 rounded-lg border ${STATUS_STYLES[b.status]}`}
                                                                        value={b.status}
                                                                        onChange={(e) => updateDormBed(r.id, b.id, { status: e.target.value as DormBedStatus })}
                                                                    >
                                                                        <option value="available">Available</option>
                                                                        <option value="blocked">Blocked</option>
                                                                        <option value="maintenance">Maintenance</option>
                                                                    </select>
                                                                    <button onClick={() => removeDormBed(r.id, b.id)} className="text-[#B3452E] p-2 hover:bg-[#B3452E]/8 rounded-lg flex-shrink-0">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addDormBed(r.id)} className="text-[12.5px] font-medium text-[#2F6F62] flex items-center gap-1 pt-1">
                                                                <Plus size={13} /> Add bed
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-3 text-[12px] text-[#6B6354]">
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2F6F62]" /> {r.dorm_beds.filter((b) => b.status === "available").length} available</span>
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B3452E]" /> {r.dorm_beds.filter((b) => b.status === "blocked").length} blocked</span>
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C99A3D]" /> {r.dorm_beds.filter((b) => b.status === "maintenance").length} maintenance</span>
                                                        </div>
                                                    </>
                                                )}

                                                {r.room_category === "whole_property" && (
                                                    <div className="mt-4 bg-[#C99A3D]/8 border border-[#C99A3D]/25 rounded-lg px-3.5 py-2.5 text-[12.5px] text-[#6B6354] flex items-center gap-2">
                                                        <Home size={14} className="text-[#C99A3D] flex-shrink-0" />
                                                        Guests book the whole property for their stay — no other room types are sold alongside this one for the same dates.
                                                    </div>
                                                )}

                                                {/* Room photo picker — selects from the property's own photo pool */}
                                                <div className="mt-5 pt-4 border-t border-dashed border-[#E5DECF]">
                                                    <RoomPhotoPicker
                                                        pool={previewImages}
                                                        selectedIds={r.image_ids}
                                                        coverId={r.cover_image_id}
                                                        onToggle={(imageId) => toggleRoomImage(r.id, imageId)}
                                                        onSetCover={(imageId) => setRoomCoverImage(r.id, imageId)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {ROOM_CATEGORIES.map((c) => {
                                            const Icon = c.icon;
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => addRoom(c.id as RoomCategory)}
                                                    className="rounded-xl border-2 border-dashed border-[#DBD3C4] py-4 px-3 text-[#9A917D] hover:border-[#C99A3D] hover:text-[#C99A3D] transition flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium"
                                                >
                                                    <Icon size={17} />
                                                    Add {c.label.toLowerCase()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 7: REVIEW */}
                        {step === 7 && (
                            <div>
                                <StepHeader eyebrow="Step 8" title="Review & publish" sub="A last look before this goes live." />
                                <div className="mt-6 space-y-5">
                                    <ReviewRow label="Property type" value={selectedType?.name} />
                                    <ReviewRow label="Name" value={details.property_name} />
                                    <ReviewRow label="Location" value={`${address.area}, ${address.city}, ${address.state}`} />
                                    <ReviewRow label="Check-in / out" value={`${details.check_in} — ${details.check_out}`} />
                                    <ReviewRow label="Amenities" value={`${amenities.length} selected`} />
                                    <ReviewRow
                                        label="Room types"
                                        value={`${rooms.length} configured (${rooms.filter((r) => r.room_category === "dorm").length} dorm, ${rooms.filter((r) => r.room_category === "whole_property").length} whole-property)`}
                                    />
                                    <ReviewRow
                                        label="Price range"
                                        value={priceRange ? `₹${priceRange[0].toLocaleString("en-IN")} – ₹${priceRange[1].toLocaleString("en-IN")} / night` : "—"}
                                    />
                                </div>
                                <button
                                onClick={publishListing}
                                className="mt-8 w-full bg-[#1E2A23] text-white rounded-xl py-3.5 font-semibold text-[14.5px] flex items-center justify-center gap-2 hover:bg-[#16201A] transition">
                                    <CheckCircle2 size={17} /> Publish listing
                                </button>
                            </div>
                        )}
                    </div>

                    {/* NAV */}
                    <div className="flex items-center justify-between pt-7 mt-7 border-t border-[#EFE9DC]">
                        <button
                            onClick={goPrev}
                            disabled={step === 0}
                            className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#6B6354] disabled:opacity-30 hover:text-[#1E2A23] transition"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        <span className="text-[12px] font-mono-num text-[#B3AB99]">
                            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                        </span>
                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 bg-[#2F6F62] text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#255A4F] transition"
                            >
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <span className="w-[88px]" />
                        )}
                    </div>
                </main>

                {/* ---------- RIGHT: LIVE PREVIEW ---------- */}
                <aside className="lg:sticky lg:top-[76px] h-fit">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold mb-3">Guest preview</p>
                    <div className="bg-white rounded-2xl border border-[#E5DECF] overflow-hidden">
                        <div className="relative aspect-[4/3] bg-[#EFE9DC]">
                            {coverImage && <img src={coverImage.src} className="w-full h-full object-cover" alt="" />}
                            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[11px] font-semibold text-[#1E2A23] px-2.5 py-1 rounded-full flex items-center gap-1">
                                {SelectedIcon && <SelectedIcon size={12} />}
                                {selectedType?.name || "Select a type"}
                            </span>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-display text-[19px] leading-snug text-[#1E2A23]">{details.property_name || "Untitled property"}</h3>
                                <span className="flex items-center gap-0.5 text-[#C99A3D] flex-shrink-0 pt-1">
                                    <Star size={13} className="fill-[#C99A3D]" />
                                    <span className="text-[12.5px] font-semibold font-mono-num text-[#1E2A23]">{details.star_rating}.0</span>
                                </span>
                            </div>
                            <p className="text-[12.5px] text-[#9A917D] mt-1 flex items-center gap-1">
                                <MapPin size={12} /> {address.area || "Area"}, {address.city || "City"}
                            </p>
                            <p className="text-[13px] text-[#6B6354] mt-3 leading-relaxed line-clamp-3">{details.description || "No description yet."}</p>

                            {/* FIX: was matching against a hardcoded local AMENITY_LIST that had
                                no relation to the real fetched amenityList/ids from the backend,
                                so the preview could show the wrong name/icon for whatever the
                                vendor actually selected in Step 5. Now reads from amenityList. */}
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {amenities.slice(0, 4).map((id) => {
                                    const a = amenityList.find((x) => x.id === id);
                                    if (!a) return null;
                                    const AmenityIcon = amenityIcons[a.icon] || ShieldCheck;
                                    return (
                                        <span key={id} className="text-[11px] bg-[#F5F2EA] text-[#6B6354] px-2 py-1 rounded-full flex items-center gap-1">
                                            <AmenityIcon size={11} /> {a.name}
                                        </span>
                                    );
                                })}
                                {amenities.length > 4 && (
                                    <span className="text-[11px] text-[#9A917D] px-2 py-1">+{amenities.length - 4} more</span>
                                )}
                            </div>

                            <div className="flex items-end justify-between mt-5 pt-4 border-t border-[#EFE9DC]">
                                <div>
                                    <p className="text-[10.5px] uppercase tracking-wide text-[#9A917D]">From</p>
                                    <p className="font-display text-[22px] text-[#1E2A23] flex items-center">
                                        <IndianRupee size={16} className="mt-0.5" />
                                        {priceRange ? priceRange[0].toLocaleString("en-IN") : "—"}
                                        <span className="text-[12px] text-[#9A917D] font-sans font-normal ml-1">/ night</span>
                                    </p>
                                </div>
                                <span className="text-[11px] font-medium text-[#2F6F62] bg-[#2F6F62]/8 px-2.5 py-1.5 rounded-full">
                                    {rooms.length} room {rooms.length === 1 ? "type" : "types"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#E5DECF] bg-white p-4">
                        <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-3">Rules at a glance</p>
                        <div className="grid grid-cols-2 gap-y-2 text-[12.5px]">
                            {(
                                [
                                    ["Smoking", rules.smoking_allowed],
                                    ["Pets", rules.pets_allowed],
                                    ["Parties", rules.parties_allowed],
                                    ["Children", rules.children_allowed],
                                ] as const
                            ).map(([label, val]) => (
                                <span key={label} className="flex items-center gap-1.5 text-[#6B6354]">
                                    {val ? <Check size={13} className="text-[#2F6F62]" /> : <X size={13} className="text-[#B3452E]" />}
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}