import React, { useState, useMemo, useEffect } from "react";
import {
    Hotel, Building2, Palmtree, Home, BedDouble, Building, House, Trees, Warehouse,
    MapPin, Image as ImageIcon, Sparkles, ShieldCheck, DoorOpen,
    CheckCircle2, Star, Plus, Trash2, ChevronLeft, ChevronRight,
    Wifi, Car, Utensils, Dumbbell, Waves, Snowflake, Tv, Coffee,
    PawPrint, Cigarette, PartyPopper, Users, Baby, Phone, Mail,
    Globe, Clock, IndianRupee, Check, X, ParkingCircle,

    BellRing,

    Wine,
    ChefHat,
    Refrigerator,
    Microwave,
    WashingMachine,
    Bath,
    Mountain,
    Flame,
    ArrowUpCircle,
    BatteryCharging,
    Bell,
    Shirt,
    Plane,
    Bike,
    Dog,
    Lock,
    Sofa,

    LampDesk,
    PlugZap,
    Laptop,
    Presentation,
    Briefcase,
    Gamepad2,

    Accessibility,
    Landmark,
    HeartPulse,
    Package,
    Wind,
    Monitor,
    BrushCleaning
} from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";

/* ---------------------------------------------------------
   TOKENS
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

// const PROPERTY_TYPES = [
//     { id: 1, name: "Hotel", icon: Hotel, blurb: "Full-service, front desk on site" },
//     { id: 2, name: "Resort", icon: Palmtree, blurb: "Leisure stay with amenities" },
//     { id: 3, name: "Villa", icon: Home, blurb: "Private standalone home" },
//     { id: 4, name: "Homestay", icon: Building, blurb: "Hosted, local experience" },
//     { id: 5, name: "Hostel", icon: BedDouble, blurb: "Shared & budget stays" },
//     { id: 6, name: "Apartment", icon: Building2, blurb: "Self-contained unit" },
// ];

const amenityIcons: Record<string, any> = {
    Wifi,
    ParkingCircle,
    Snowflake,
    Tv,
    Waves,
    Dumbbell,
    Utensils,
    BellRing,
    Coffee,
    Wine,
    ChefHat,
    Refrigerator,
    Microwave,
    WashingMachine,
    Bath,
    Building,
    Trees,
    Mountain,
    Flame,
    ArrowUpCircle,
    BatteryCharging,
    ShieldCheck,
    Bell,
    BrushCleaning,
    Shirt,
    Plane,
    Car,
    Bike,
    Dog,
    Cigarette,
    Users,
    Lock,
    Sofa,
    BedDouble,
    LampDesk,
    PlugZap,
    Laptop,
    Presentation,
    Briefcase,
    Sparkles,
    Gamepad2,
    Baby,
    Accessibility,
    Landmark,
    HeartPulse,
    Package,
    Wind,
    Monitor
};

const AMENITY_LIST = [
    { id: 1, name: "Free Wi-Fi", icon: Wifi },
    { id: 2, name: "Parking", icon: Car },
    { id: 3, name: "Restaurant", icon: Utensils },
    { id: 4, name: "Gym", icon: Dumbbell },
    { id: 5, name: "Swimming Pool", icon: Waves },
    { id: 6, name: "Air Conditioning", icon: Snowflake },
    { id: 7, name: "Television", icon: Tv },
    { id: 8, name: "Breakfast Included", icon: Coffee },
];

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

const DEMO_IMAGES = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80",
];

const uid = () => Math.random().toString(36).slice(2, 9);

const ROOM_CATEGORIES = [
    { id: "private", label: "Private room", hint: "Sold as a whole room", icon: BedDouble },
    { id: "dorm", label: "Dormitory", hint: "Sold bed-by-bed", icon: Users },
    { id: "whole_property", label: "Entire property", hint: "One guest books it all", icon: Home },
];

const DEMO_ROOM = (n) => ({
    id: uid(),
    room_category: "private",
    room_name: n === 0 ? "Heritage Garden Room" : "Lakeview Suite",
    room_type: n === 0 ? "Deluxe" : "Suite",
    max_adults: n === 0 ? 2 : 3,
    max_children: 1,
    total_rooms: n === 0 ? 6 : 3,
    available_rooms: n === 0 ? 4 : 2,
    room_size: n === 0 ? 280 : 420,
    room_size_unit: "sqft",
    private_bathroom: true,
    balcony: n !== 0,
    air_conditioning: true,
    beds: n === 0 ? [{ id: uid(), bed_type: "Queen Bed", quantity: 1 }] : [{ id: uid(), bed_type: "King Bed", quantity: 1 }, { id: uid(), bed_type: "Sofa Bed", quantity: 1 }],
    dorm_beds: [],
    price: n === 0 ? 4200 : 7800,
    weekend_price: n === 0 ? 4800 : 9200,
    extra_guest_price: n === 0 ? 600 : 900,
    tax: n === 0 ? 12 : 18,
    images: [
        { id: uid(), src: DEMO_IMAGES[n % DEMO_IMAGES.length], is_cover: true },
        { id: uid(), src: DEMO_IMAGES[(n + 1) % DEMO_IMAGES.length], is_cover: false },
    ],
});

const DEMO_DORM_ROOM = () => ({
    id: uid(),
    room_category: "dorm",
    room_name: "Backpacker Mixed Dorm",
    room_type: "Dormitory",
    max_adults: 8,
    max_children: 0,
    total_rooms: 1,
    available_rooms: 1,
    room_size: 360,
    room_size_unit: "sqft",
    private_bathroom: false,
    balcony: false,
    air_conditioning: true,
    beds: [],
    dorm_beds: [
        { id: uid(), bed_label: "Bunk A - Top", bed_type: "Bunk - Top", status: "available", price: 950 },
        { id: uid(), bed_label: "Bunk A - Bottom", bed_type: "Bunk - Bottom", status: "available", price: 1050 },
        { id: uid(), bed_label: "Bunk B - Top", bed_type: "Bunk - Top", status: "available", price: 950 },
        { id: uid(), bed_label: "Bunk B - Bottom", bed_type: "Bunk - Bottom", status: "blocked", price: 1050 },
    ],
    price: 950,
    weekend_price: 1150,
    extra_guest_price: 0,
    tax: 12,
    images: [{ id: uid(), src: DEMO_IMAGES[2], is_cover: true }],
});

const DEMO_VILLA_ROOM = () => ({
    id: uid(),
    room_category: "whole_property",
    room_name: "Entire Saffron Bagh Villa",
    room_type: "Whole Villa",
    max_adults: 10,
    max_children: 4,
    total_rooms: 1,
    available_rooms: 1,
    room_size: 3200,
    room_size_unit: "sqft",
    private_bathroom: true,
    balcony: true,
    air_conditioning: true,
    beds: [
        { id: uid(), bed_type: "King Bed", quantity: 3 },
        { id: uid(), bed_type: "Queen Bed", quantity: 2 },
        { id: uid(), bed_type: "Single Bed", quantity: 2 },
    ],
    dorm_beds: [],
    price: 28000,
    weekend_price: 34000,
    extra_guest_price: 1500,
    tax: 18,
    images: [{ id: uid(), src: DEMO_IMAGES[0], is_cover: true }, { id: uid(), src: DEMO_IMAGES[3], is_cover: false }],
});

const STATUS_STYLES = {
    available: "bg-[#2F6F62]/8 text-[#2F6F62] border-[#2F6F62]/30",
    blocked: "bg-[#B3452E]/8 text-[#B3452E] border-[#B3452E]/30",
    maintenance: "bg-[#C99A3D]/10 text-[#9A7427] border-[#C99A3D]/30",
};

function Field({ label, children, hint }) {
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

function Toggle({ checked, onChange, label, icon: Icon }) {
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
            <span
                className={`w-9 h-5 rounded-full relative transition flex-shrink-0 ${checked ? "bg-[#2F6F62]" : "bg-[#DBD3C4]"}`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
                />
            </span>
        </button>
    );
}

export default function CompleteListing() {
    const [step, setStep] = useState(0);

    const [propertyType, setPropertyType] = useState(1);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [propertyId, setPropertyId] = useState(null);
    const [images, setImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [amenityList, setAmenityList] = useState([]);

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
                    children_allowed: rules.children_allowed
                },
                {
                    withCredentials: true
                }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                "Unable to save policies."
            );
        }
    };

    const saveAmenities = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/api/listing/amenities`,
                {
                    property_id: propertyId,
                    amenities
                },
                {
                    withCredentials: true
                }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                "Unable to save amenities."
            );
        }
    };

    const getIncompleteListing = async () => {
        const loadingToast = toast.loading("Loading your saved listing...");
        try {
            const response = await axios.get(
                `${backendUrl}/api/listing/continue-listing`,
                {
                    withCredentials: true
                }
            );
            toast.dismiss(loadingToast);
            if (!response.data.hasListing) {
                return;
            }
            const data = response.data;
            setPropertyId(data.property_id);
            setStep(data.current_step);
            if (data.property) {
                setDetails(data.property);
            }
            if (data.address) {
                setAddress(data.address);
            }
            if (data.amenities) {
                setAmenities(
                    data.amenities.map((item: any) => item.amenity_id)
                );
            }
            if (data.policies) {
                setPolicies(data.policies);
            }
            if (data.rules) {
                setRules(data.rules);
            }
            if (data.rooms) {
                setRooms(data.rooms);
            }
            if (data.images) {
                const preview = data.images.map((img: any) => ({
                    id: img.id,
                    src: `${backendUrl}/uploads/properties/${data.property_id}/${img.image}`,
                    is_cover: img.is_cover
                }));
                setPreviewImages(preview.map((i: any) => i.src));
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(
                error.response?.data?.message ||
                "Failed to load your saved listing."
            );
            console.error(error);
        }
    };

    const savePhotos = async () => {
        try {
            if (images.length === 0) {
                toast.error("Please select images.");
                return;
            }
            const formData = new FormData();
            formData.append("property_id", propertyId);
            images.forEach((image) => {
                formData.append("images", image);
            });
            const response = await axios.post(
                `${backendUrl}/api/listing/photos`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                "Unable to upload photos."
            );
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...images];
        newFiles.splice(index, 1);
        setImages(newFiles);
        setPreviewImages(
            newFiles.map(file => URL.createObjectURL(file))
        );
    };

    const handleImageSelect = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (images.length + files.length > 5) {
            toast.error("Maximum 5 images allowed.");
            return;
        }
        const updatedFiles = [...images, ...files];
        setImages(updatedFiles);
        const previews = updatedFiles.map(file =>
            URL.createObjectURL(file)
        );
        setPreviewImages(previews);
    };

    // replace addRoomImage with this
    const handleRoomImageSelect = (roomId, e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setRooms((rs) =>
            rs.map((r) => {
                if (r.id !== roomId) return r;
                const newImages = files.map((file) => ({
                    id: uid(),
                    file,
                    src: URL.createObjectURL(file),
                    is_cover: r.images.length === 0,
                }));
                return { ...r, images: [...r.images, ...newImages] };
            })
        );
    };

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
                    landmark: address.landmark
                },
                {
                    withCredentials: true,
                }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                "Unable to save location."
            );
        }
    };

    const saveBasicInformation = async () => {
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
                    total_rooms: details.total_rooms
                }, {
                withCredentials: true,
            }
            );
            if (response.data.success) {
                setPropertyId(response.data.property_id);
                toast.success(response.data.message);
                goNext();
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                "Something went wrong."
            );
        }
    };


    const propertyIcons = {
        Hotel,
        Villa: Home,
        Apartment: Building2,
        Hostel: BedDouble,
        Dormitory: BedDouble,
        luxury: Palmtree,
    };

    const getPropertyTypes = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/property-types`
            );
            if (response.data.success) {
                setPropertyTypes(response.data.data);
            }
            // console.log(response);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const getAmenities = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/property-types/amenities`
            );
            if (response.data.success) {
                setAmenityList(response.data.data);
            }
        } catch (error) {
            toast.error("Unable to load amenities.");
        }
    };


    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                getPropertyTypes(),
                getAmenities()
            ]);
            await getIncompleteListing();
        };
        loadData();
    }, []);




    const handleNext = async () => {

        switch (step) {

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

    const [details, setDetails] = useState({
        property_name: "Saffron Bagh Heritage Stay",
        star_rating: 4,
        contact_name: "Anjali Rathore",
        contact_number: "+91 98765 43210",
        email: "stay@saffronbagh.com",
        website: "www.saffronbagh.com",
        check_in: "13:00",
        check_out: "11:00",
        total_rooms: 9,
        description:
            "A restored 1920s haveli wrapped around a courtyard garden, fifteen minutes from the old city. Stone jaali screens, hand-block linens, and a rooftop that catches the evening light.",
    });

    const [address, setAddress] = useState({
        country: "India",
        state: "Rajasthan",
        city: "Udaipur",
        area: "Hanuman Ghat",
        address: "14 Brahmpuri Lane, near Hanuman Ghat",
        pincode: "313001",
        landmark: "200m from Lake Pichola",
        latitude: "24.5828",
        longitude: "73.6797",
    });

    // const [images, setImages] = useState(
    //     DEMO_IMAGES.map((src, i) => ({ id: uid(), src, is_cover: i === 0 }))
    // );

    const [amenities, setAmenities] = useState([1, 2, 3, 6, 8]);

    const [policies, setPolicies] = useState({
        cancellation_policy:
            "Free cancellation up to 48 hours before check-in. Inside 48 hours, the first night is charged.",
        house_rules: "Quiet hours from 10 PM to 7 AM. Please remove footwear in the courtyard rooms.",
        refund_policy: "Refunds are processed to the original payment method within 5–7 business days.",
    });

    const [rules, setRules] = useState({
        smoking_allowed: false,
        pets_allowed: false,
        parties_allowed: false,
        couples_allowed: true,
        children_allowed: true,
    });

    const [rooms, setRooms] = useState([DEMO_ROOM(0), DEMO_DORM_ROOM(), DEMO_VILLA_ROOM()]);

    const selectedType = propertyTypes.find((t) => t.id === propertyType);
    const SelectedIcon =
        selectedType ? propertyIcons[selectedType.name] : null;
    const coverImage =
        images.find((img) => img.is_cover === 1 || img.is_cover === true) ??
        (images.length > 0 ? images[0] : null); const priceRange = useMemo(() => {
            if (!rooms.length) return null;
            const prices = rooms.map((r) =>
                r.room_category === "dorm"
                    ? Math.min(...(r.dorm_beds.length ? r.dorm_beds.map((b) => Number(b.price) || 0) : [0]))
                    : Number(r.price) || 0
            );
            return [Math.min(...prices), Math.max(...prices)];
        }, [rooms]);

    const toggleAmenity = (id) =>
        setAmenities((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

    const setCover = (id) =>
        setImages((imgs) => imgs.map((im) => ({ ...im, is_cover: im.id === id })));

    // const removeImage = (id) =>
    //     setImages((imgs) => {
    //         const filtered = imgs.filter((im) => im.id !== id);
    //         if (filtered.length && !filtered.some((im) => im.is_cover)) filtered[0].is_cover = true;
    //         return filtered;
    //     });

    const updateRoom = (id, patch) =>
        setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const addRoom = (category = "private") =>
        setRooms((rs) => [
            ...rs,
            category === "dorm" ? DEMO_DORM_ROOM() : category === "whole_property" ? DEMO_VILLA_ROOM() : DEMO_ROOM(rs.length),
        ]);
    const removeRoom = (id) => setRooms((rs) => rs.filter((r) => r.id !== id));

    const addBed = (roomId) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId ? { ...r, beds: [...r.beds, { id: uid(), bed_type: "Single Bed", quantity: 1 }] } : r
            )
        );
    const removeBed = (roomId, bedId) =>
        setRooms((rs) =>
            rs.map((r) => (r.id === roomId ? { ...r, beds: r.beds.filter((b) => b.id !== bedId) } : r))
        );
    const updateBed = (roomId, bedId, patch) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b)) }
                    : r
            )
        );

    const addDormBed = (roomId) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? {
                        ...r,
                        dorm_beds: [
                            ...r.dorm_beds,
                            { id: uid(), bed_label: `Bed ${r.dorm_beds.length + 1}`, bed_type: "Bunk - Bottom", status: "available", price: r.price || 900 },
                        ],
                    }
                    : r
            )
        );
    const removeDormBed = (roomId, bedId) =>
        setRooms((rs) =>
            rs.map((r) => (r.id === roomId ? { ...r, dorm_beds: r.dorm_beds.filter((b) => b.id !== bedId) } : r))
        );
    const updateDormBed = (roomId, bedId, patch) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, dorm_beds: r.dorm_beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b)) }
                    : r
            )
        );

    const addRoomImage = (roomId) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId
                    ? { ...r, images: [...r.images, { id: uid(), src: DEMO_IMAGES[r.images.length % DEMO_IMAGES.length], is_cover: r.images.length === 0 }] }
                    : r
            )
        );
    const removeRoomImage = (roomId, imgId) =>
        setRooms((rs) =>
            rs.map((r) => {
                if (r.id !== roomId) return r;
                const filtered = r.images.filter((im) => im.id !== imgId);
                if (filtered.length && !filtered.some((im) => im.is_cover)) filtered[0].is_cover = true;
                return { ...r, images: filtered };
            })
        );
    const setRoomCoverImage = (roomId, imgId) =>
        setRooms((rs) =>
            rs.map((r) =>
                r.id === roomId ? { ...r, images: r.images.map((im) => ({ ...im, is_cover: im.id === imgId })) } : r
            )
        );

    const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
    const goPrev = () => setStep((s) => Math.max(0, s - 1));

    return (
        <div
            className="min-h-screen w-full"
            style={{
                background: "#F5F2EA",
                fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

            <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-6">
                {/* ---------- LEFT: STEP RAIL ---------- */}
                <aside className="lg:sticky lg:top-8 h-fit">
                    <div className="mb-6">
                        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold">List your property</p>
                        <h1 className="font-display text-[26px] leading-tight text-[#1E2A23] mt-1">Create listing</h1>
                    </div>
                    <ol className="space-y-1">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;
                            return (
                                <li key={s.key}>
                                    <button
                                        onClick={() => setStep(i)}
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
                                                <Icon size={22} className={active ? "text-[#2F6F62]" : "text-[#6B6354]"} />
                                                <p className="mt-2.5 text-[14px] font-semibold text-[#1E2A23]">{t.name}</p>
                                                {/* <p className="text-[12px] text-[#9A917D] mt-0.5">{t.blurb}</p> */}
                                            </button>
                                        );
                                    })}

                                    {/* {
                                        propertyTypes.map((item) => {
                                            const Icon = iconMap[item.name];

                                            return (
                                                <TouchableOpacity key={item.id}>
                                                    {Icon && <Icon size={28} color="#000" />}
                                                    <Text>{item.name}</Text>
                                                </TouchableOpacity>
                                            );
                                        });
                                    } */}
                                </div>
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
                            // <div>
                            //     <StepHeader eyebrow="Step 4" title="Show the place" sub="Set one photo as the cover — it leads the listing card." />
                            //     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            //         {images.map((img) => (
                            //             <div key={img.id} className="relative group rounded-xl overflow-hidden border border-[#E5DECF] aspect-[4/3]">
                            //                 <img src={img.src} alt="" className="w-full h-full object-cover" />
                            //                 {img.is_cover && (
                            //                     <span className="absolute top-2 left-2 bg-[#1E2A23] text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full">
                            //                         Cover
                            //                     </span>
                            //                 )}
                            //                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            //                     {!img.is_cover && (
                            //                         <button onClick={() => setCover(img.id)} className="bg-white text-[#1E2A23] text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                            //                             Set cover
                            //                         </button>
                            //                     )}
                            //                     <button onClick={() => removeImage(img.id)} className="bg-white text-[#B3452E] p-1.5 rounded-full">
                            //                         <Trash2 size={13} />
                            //                     </button>
                            //                 </div>
                            //             </div>
                            //         ))}
                            //         <button
                            //             onClick={() => setImages((imgs) => [...imgs, { id: uid(), src: DEMO_IMAGES[imgs.length % DEMO_IMAGES.length], is_cover: false }])}
                            //             className="aspect-[4/3] rounded-xl border-2 border-dashed border-[#DBD3C4] flex flex-col items-center justify-center gap-1.5 text-[#9A917D] hover:border-[#C99A3D] hover:text-[#C99A3D] transition"
                            //         >
                            //             <Plus size={20} />
                            //             <span className="text-[12px] font-medium">Add photo</span>
                            //         </button>
                            //     </div>
                            // </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {previewImages.map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-xl overflow-hidden border"
                                    >
                                        <img
                                            src={image}
                                            className="w-full h-40 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {previewImages.length < 5 && (
                                    <label className="border-2 border-dashed rounded-xl h-40 flex items-center justify-center cursor-pointer">
                                        <div className="text-center">
                                            <Plus size={28} />
                                            <p>Add Photos</p>
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            hidden
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                )}
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
                                                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition
            ${active
                                                        ? "border-[#2F6F62] bg-[#2F6F62]/6"
                                                        : "border-[#E5DECF]"
                                                    }`}

                                            >
                                                <Icon
                                                    size={17}
                                                    className={active ? "text-[#2F6F62]" : "text-[#9A917D]"}
                                                />
                                                <span className="text-[13px]">
                                                    {a.name}
                                                </span>
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
                                <StepHeader eyebrow="Step 7" title="Rooms & pricing" sub="Private rooms, dorm beds, or the entire property — each sells differently." />
                                <div className="space-y-5 mt-6">
                                    {rooms.map((r, idx) => {
                                        const cat = ROOM_CATEGORIES.find((c) => c.id === r.room_category) || ROOM_CATEGORIES[0];
                                        const CatIcon = cat.icon;
                                        const cover = r.images.find((i) => i.is_cover) || r.images[0];
                                        return (
                                            <div key={r.id} className="rounded-xl border border-[#E5DECF] overflow-hidden">
                                                {/* room images strip */}
                                                <div className="flex gap-2 p-3 bg-[#F9F6EF] overflow-x-auto">
                                                    {r.images.map((img) => (
                                                        <div key={img.id} className="relative group flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border border-[#E5DECF]">
                                                            <img src={img.src} className="w-full h-full object-cover" alt="" />
                                                            {img.is_cover && <span className="absolute top-0.5 left-0.5 bg-[#1E2A23] text-white text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full">Cover</span>}
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                                                {!img.is_cover && (
                                                                    <button onClick={() => setRoomCoverImage(r.id, img.id)} className="bg-white text-[#1E2A23] p-1 rounded-full"><Check size={10} /></button>
                                                                )}
                                                                <button onClick={() => removeRoomImage(r.id, img.id)} className="bg-white text-[#B3452E] p-1 rounded-full"><X size={10} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addRoomImage(r.id)} className="flex-shrink-0 w-20 h-16 rounded-lg border-2 border-dashed border-[#DBD3C4] flex items-center justify-center text-[#9A917D] hover:border-[#C99A3D] hover:text-[#C99A3D] transition">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                <div className="p-5">
                                                    <div className="flex items-start justify-between gap-3 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    className="font-display text-[17px] text-[#1E2A23] bg-transparent outline-none border-b border-transparent focus:border-[#2F6F62]"
                                                                    value={r.room_name}
                                                                    onChange={(e) => updateRoom(r.id, { room_name: e.target.value })}
                                                                />
                                                            </div>
                                                            <p className="text-[12px] text-[#9A917D] font-mono-num">Room {String(idx + 1).padStart(2, "0")} · {r.room_type}</p>
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
                                                                    onClick={() => updateRoom(r.id, { room_category: c.id })}
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
                                                            <input type="number" className={inputCls} value={r.max_adults} onChange={(e) => updateRoom(r.id, { max_adults: e.target.value })} />
                                                        </Field>
                                                        <Field label="Max children">
                                                            <input type="number" className={inputCls} value={r.max_children} onChange={(e) => updateRoom(r.id, { max_children: e.target.value })} />
                                                        </Field>
                                                        <Field label="Size (sqft)">
                                                            <input type="number" className={inputCls} value={r.room_size} onChange={(e) => updateRoom(r.id, { room_size: e.target.value })} />
                                                        </Field>
                                                    </div>

                                                    {r.room_category !== "whole_property" && (
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <Field label={r.room_category === "dorm" ? "Dorm rooms on site" : "Total rooms"}>
                                                                <input type="number" className={inputCls} value={r.total_rooms} onChange={(e) => updateRoom(r.id, { total_rooms: e.target.value })} />
                                                            </Field>
                                                            <Field label="Available now">
                                                                <input type="number" className={inputCls} value={r.available_rooms} onChange={(e) => updateRoom(r.id, { available_rooms: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                    )}

                                                    {r.room_category !== "dorm" && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                            <Field label="Nightly rate (₹)">
                                                                <input type="number" className={inputCls + " font-mono-num"} value={r.price} onChange={(e) => updateRoom(r.id, { price: e.target.value })} />
                                                            </Field>
                                                            <Field label="Weekend rate (₹)">
                                                                <input type="number" className={inputCls + " font-mono-num"} value={r.weekend_price} onChange={(e) => updateRoom(r.id, { weekend_price: e.target.value })} />
                                                            </Field>
                                                            <Field label="Extra guest (₹)">
                                                                <input type="number" className={inputCls + " font-mono-num"} value={r.extra_guest_price} onChange={(e) => updateRoom(r.id, { extra_guest_price: e.target.value })} />
                                                            </Field>
                                                            <Field label="Tax (%)">
                                                                <input type="number" className={inputCls + " font-mono-num"} value={r.tax} onChange={(e) => updateRoom(r.id, { tax: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {[
                                                            ["private_bathroom", "Private bathroom"],
                                                            ["balcony", "Balcony"],
                                                            ["air_conditioning", "Air conditioning"],
                                                        ].map(([k, label]) => (
                                                            <button
                                                                key={k}
                                                                onClick={() => updateRoom(r.id, { [k]: !r[k] })}
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
                                                                        <input type="number" className={inputCls + " w-20 font-mono-num"} value={b.quantity} onChange={(e) => updateBed(r.id, b.id, { quantity: e.target.value })} />
                                                                        <button onClick={() => removeBed(r.id, b.id)} className="text-[#B3452E] p-2 hover:bg-[#B3452E]/8 rounded-lg"><X size={14} /></button>
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
                                                                            <input type="number" className={inputCls + " pl-7 font-mono-num"} value={b.price} onChange={(e) => updateDormBed(r.id, b.id, { price: e.target.value })} />
                                                                        </div>
                                                                        <select
                                                                            className={`text-[11.5px] font-semibold px-2.5 py-2 rounded-lg border ${STATUS_STYLES[b.status]}`}
                                                                            value={b.status}
                                                                            onChange={(e) => updateDormBed(r.id, b.id, { status: e.target.value })}
                                                                        >
                                                                            <option value="available">Available</option>
                                                                            <option value="blocked">Blocked</option>
                                                                            <option value="maintenance">Maintenance</option>
                                                                        </select>
                                                                        <button onClick={() => removeDormBed(r.id, b.id)} className="text-[#B3452E] p-2 hover:bg-[#B3452E]/8 rounded-lg flex-shrink-0"><X size={14} /></button>
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
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {ROOM_CATEGORIES.map((c) => {
                                            const Icon = c.icon;
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => addRoom(c.id)}
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
                                    <ReviewRow label="Room types" value={`${rooms.length} configured (${rooms.filter(r => r.room_category === "dorm").length} dorm, ${rooms.filter(r => r.room_category === "whole_property").length} whole-property)`} />
                                    <ReviewRow
                                        label="Price range"
                                        value={priceRange ? `₹${priceRange[0].toLocaleString("en-IN")} – ₹${priceRange[1].toLocaleString("en-IN")} / night` : "—"}
                                    />
                                </div>
                                <button className="mt-8 w-full bg-[#1E2A23] text-white rounded-xl py-3.5 font-semibold text-[14.5px] flex items-center justify-center gap-2 hover:bg-[#16201A] transition">
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
                <aside className="lg:sticky lg:top-8 h-fit">
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold mb-3">Guest preview</p>
                    <div className="bg-white rounded-2xl border border-[#E5DECF] overflow-hidden">
                        <div className="relative aspect-[4/3]">
                            {coverImage && <img src={coverImage.src} className="w-full h-full object-cover" alt="" />}
                            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[11px] font-semibold text-[#1E2A23] px-2.5 py-1 rounded-full flex items-center gap-1">
                                {SelectedIcon && <SelectedIcon size={12} />}{selectedType?.name}

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
                                <MapPin size={12} /> {address.area}, {address.city}
                            </p>
                            <p className="text-[13px] text-[#6B6354] mt-3 leading-relaxed line-clamp-3">{details.description}</p>

                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {amenities.slice(0, 4).map((id) => {
                                    const a = AMENITY_LIST.find((x) => x.id === id);
                                    if (!a) return null;
                                    return (
                                        <span key={id} className="text-[11px] bg-[#F5F2EA] text-[#6B6354] px-2 py-1 rounded-full flex items-center gap-1">
                                            <a.icon size={11} /> {a.name}
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
                            {[
                                ["Smoking", rules.smoking_allowed],
                                ["Pets", rules.pets_allowed],
                                ["Parties", rules.parties_allowed],
                                ["Children", rules.children_allowed],
                            ].map(([label, val]) => (
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

function StepHeader({ eyebrow, title, sub }) {
    return (
        <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">{eyebrow}</p>
            <h2 className="font-display text-[26px] text-[#1E2A23] mt-1">{title}</h2>
            <p className="text-[13.5px] text-[#9A917D] mt-1">{sub}</p>
        </div>
    );
}

function ReviewRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-[#EFE9DC] pb-3">
            <span className="text-[13px] text-[#9A917D]">{label}</span>
            <span className="text-[13.5px] font-medium text-[#1E2A23] text-right">{value}</span>
        </div>
    );
}