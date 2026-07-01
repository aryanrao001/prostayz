import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  Building2,
  User,
  Map,
  Home,
  Landmark,
  LocateFixed,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
  Wand2,
  X,
  MapPin,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  id: number | string;
  name: string;
}

interface StateItem {
  id: number | string;
  name: string;
}

interface City {
  id: number | string;
  name: string;
}

interface FormData {
  business_name: string;
  contact_person: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  country_id: string;
  state_id: string;
  city_id: string;
  postal_code: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  business_name?: string;
  address_line_1?: string;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  postal_code?: string;
}

// Auto-filled data preview (stores resolved names + IDs)
interface AutoFillPreview {
  address_line_1: string;
  address_line_2: string;
  postal_code: string;
  landmark: string;
  country_name: string;
  state_name: string;
  city_name: string;
  country_id: string;
  state_id: string;
  city_id: string;
  latitude: string;
  longitude: string;
}

// Google Geocoding API types
interface GeoAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeoResult {
  address_components: GeoAddressComponent[];
  formatted_address: string;
}

interface GeoResponse {
  results: GeoResult[];
  status: string;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Account", done: true },
  { label: "Address", done: false, active: true },
  { label: "Listing", done: false },
  { label: "Review", done: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Case-insensitive fuzzy match — finds the closest item in a list by name */
function fuzzyMatch<T extends { id: number | string; name: string }>(
  list: T[],
  target: string
): T | undefined {
  if (!target) return undefined;
  const t = target.toLowerCase().trim();
  return (
    list.find((i) => i.name.toLowerCase() === t) ??
    list.find((i) => i.name.toLowerCase().includes(t)) ??
    list.find((i) => t.includes(i.name.toLowerCase()))
  );
}

/** Extract a single value from Google address_components by type */
function extractComponent(
  components: GeoAddressComponent[],
  type: string,
  short = false
): string {
  const match = components.find((c) => c.types.includes(type));
  return match ? (short ? match.short_name : match.long_name) : "";
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddressPage: React.FC = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const [loading, setLoading] = useState<boolean>(false);
  const [autoFillLoading, setAutoFillLoading] = useState<boolean>(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});

  // Preview modal state
  const [preview, setPreview] = useState<AutoFillPreview | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    contact_person: "",
    address_line_1: "",
    address_line_2: "",
    landmark: "",
    country_id: "",
    state_id: "",
    city_id: "",
    postal_code: "",
    latitude: "",
    longitude: "",
  });

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async (): Promise<void> => {
    try {
      const res = await axios.get<{ data: Country[] }>(
        `${backendUrl}/api/location/countries`
      );
      setCountries(res.data.data);
    } catch (err) {
      console.error("Failed to fetch countries:", err);
    }
  };

  const fetchStates = async (countryId: string): Promise<StateItem[]> => {
    try {
      const res = await axios.get<{ data: StateItem[] }>(
        `${backendUrl}/api/location/states/${countryId}`
      );
      setStates(res.data.data);
      setCities([]);
      return res.data.data;
    } catch (err) {
      console.error("Failed to fetch states:", err);
      return [];
    }
  };

  const fetchCities = async (stateId: string): Promise<City[]> => {
    try {
      const res = await axios.get<{ data: City[] }>(
        `${backendUrl}/api/location/cities/${stateId}`
      );
      setCities(res.data.data);
      return res.data.data;
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      return [];
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, country_id: value, state_id: "", city_id: "" }));
    setErrors((prev) => ({ ...prev, country_id: "" }));
    if (value) fetchStates(value);
    else { setStates([]); setCities([]); }
  };

  const handleStateChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, state_id: value, city_id: "" }));
    setErrors((prev) => ({ ...prev, state_id: "" }));
    if (value) fetchCities(value);
    else setCities([]);
  };

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFormData((prev) => ({ ...prev, city_id: e.target.value }));
    setErrors((prev) => ({ ...prev, city_id: "" }));
  };

  // ── Auto-fill from Google ─────────────────────────────────────────────────────

  const handleAutoFill = (): void => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    if (!googleApiKey) {
      toast.error("Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY).");
      return;
    }

    setAutoFillLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;

        try {
          // Call Google Geocoding API via your backend proxy to keep key hidden,
          // OR directly (shown below). Switch to proxy if you want key server-side.
          const geoRes = await axios.get<GeoResponse>(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
              params: {
                latlng: `${latitude},${longitude}`,
                key: googleApiKey,
                language: "en",
                result_type:
                  "street_address|sublocality|locality|administrative_area_level_1|country",
              },
            }
          );

          if (geoRes.data.status !== "OK" || !geoRes.data.results.length) {
            toast.error("Google could not resolve this location. Try again.");
            setAutoFillLoading(false);
            return;
          }

          const components = geoRes.data.results[0].address_components;

          // ── Extract components ──────────────────────────────────────────────
          const streetNumber  = extractComponent(components, "street_number");
          const route         = extractComponent(components, "route");
          const sublocality   = extractComponent(components, "sublocality_level_1")
                              || extractComponent(components, "sublocality");
          const postalCode    = extractComponent(components, "postal_code");
          const cityName      =
            extractComponent(components, "locality") ||
            extractComponent(components, "administrative_area_level_2");
          const stateName     = extractComponent(components, "administrative_area_level_1");
          const countryName   = extractComponent(components, "country");

          const address1 = [streetNumber, route].filter(Boolean).join(" ")
            || extractComponent(components, "premise")
            || geoRes.data.results[0].formatted_address.split(",")[0];

          // ── Resolve country ─────────────────────────────────────────────────
          const matchedCountry = fuzzyMatch(countries, countryName);
          if (!matchedCountry) {
            toast.error(`Country "${countryName}" not found in your database.`);
            setAutoFillLoading(false);
            return;
          }

          // ── Fetch & resolve state ───────────────────────────────────────────
          const freshStates = await fetchStates(String(matchedCountry.id));
          const matchedState = fuzzyMatch(freshStates, stateName);

          // ── Fetch & resolve city ────────────────────────────────────────────
          let matchedCity: City | undefined;
          if (matchedState) {
            const freshCities = await fetchCities(String(matchedState.id));
            matchedCity = fuzzyMatch(freshCities, cityName);
          }

          // ── Build preview ───────────────────────────────────────────────────
          const previewData: AutoFillPreview = {
            address_line_1: address1,
            address_line_2: sublocality,
            postal_code:    postalCode,
            landmark:       "",
            country_name:   countryName,
            state_name:     stateName,
            city_name:      cityName,
            country_id:     matchedCountry ? String(matchedCountry.id) : "",
            state_id:       matchedState   ? String(matchedState.id)   : "",
            city_id:        matchedCity    ? String(matchedCity.id)    : "",
            latitude:       String(latitude),
            longitude:      String(longitude),
          };

          setPreview(previewData);
          setShowPreview(true);
        } catch (err) {
          console.error("Geocoding error:", err);
          toast.error("Failed to fetch address from Google. Check your API key.");
        } finally {
          setAutoFillLoading(false);
        }
      },
      () => {
        toast.error("Location access denied. Please allow location in browser settings.");
        setAutoFillLoading(false);
      }
    );
  };

  /** Apply confirmed preview data to the form */
  const applyPreview = (): void => {
    if (!preview) return;
    setFormData((prev) => ({
      ...prev,
      address_line_1: preview.address_line_1 || prev.address_line_1,
      address_line_2: preview.address_line_2 || prev.address_line_2,
      postal_code:    preview.postal_code    || prev.postal_code,
      country_id:     preview.country_id     || prev.country_id,
      state_id:       preview.state_id       || prev.state_id,
      city_id:        preview.city_id        || prev.city_id,
      latitude:       preview.latitude,
      longitude:      preview.longitude,
    }));
    setErrors({});
    setShowPreview(false);
    toast.success("Address auto-filled from your location!");
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.business_name.trim())  newErrors.business_name  = "Business name is required.";
    if (!formData.address_line_1.trim()) newErrors.address_line_1 = "Address line 1 is required.";
    if (!formData.country_id)            newErrors.country_id     = "Please select a country.";
    if (!formData.state_id)              newErrors.state_id       = "Please select a state.";
    if (!formData.city_id)               newErrors.city_id        = "Please select a city.";
    if (!formData.postal_code.trim())    newErrors.postal_code    = "Postal code is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const saveAddress = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/location/address`, 
        formData,
        {
          withCredentials:true
        }
      );
      toast.success("Address saved successfully.");
      navigate("/vendor/dashboard");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? (err.response.data.message as string)
          : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasLocation = formData.latitude && formData.longitude;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>

      {/* ── Auto-fill Preview Modal ──────────────────────────────────────────── */}
      {showPreview && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Wand2 size={18} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Address Found</h3>
                  <p className="text-xs text-gray-500">Review before applying</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Data rows */}
            <div className="px-6 py-5 space-y-3">
              {[
                { label: "Address Line 1", value: preview.address_line_1 },
                { label: "Address Line 2", value: preview.address_line_2 },
                { label: "Postal Code",    value: preview.postal_code },
                { label: "Country",        value: preview.country_name, matched: !!preview.country_id },
                { label: "State",          value: preview.state_name,   matched: !!preview.state_id },
                { label: "City",           value: preview.city_name,    matched: !!preview.city_id },
                {
                  label: "GPS",
                  value: `${parseFloat(preview.latitude).toFixed(5)}, ${parseFloat(preview.longitude).toFixed(5)}`,
                  matched: true,
                },
              ].map(({ label, value, matched }) => (
                <div key={label}
                  className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0 pt-0.5">{label}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={`text-sm text-right font-medium ${value ? "text-gray-800" : "text-gray-400 italic"}`}>
                      {value || "Not found"}
                    </span>
                    {value && matched !== undefined && (
                      matched
                        ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        : <AlertCircle  size={14} className="text-amber-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}

              {/* Warn if any location IDs didn't match */}
              {(!preview.country_id || !preview.state_id || !preview.city_id) && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Some location fields couldn't be matched to your database —
                    those dropdowns will stay unchanged. You can set them manually.
                  </p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowPreview(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={applyPreview}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition shadow shadow-orange-200"
              >
                <CheckCircle2 size={15} />
                Apply to Form
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Top Progress Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-sm tracking-wide">VendorHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.done   ? "bg-orange-500 text-white"
                    : step.active ? "bg-orange-100 text-orange-600 ring-2 ring-orange-400"
                    : "bg-gray-100 text-gray-400"
                  }`}>
                    {step.done ? <CheckCircle2 size={13} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${
                    step.active ? "text-orange-600" : step.done ? "text-gray-600" : "text-gray-400"
                  }`}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${step.done ? "bg-orange-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="sm:hidden text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            Step 2 of 4
          </span>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)" }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ background: "white" }} />

        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                <MapPin size={11} /> Vendor Registration · Step 2
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white mt-6 leading-tight tracking-tight">
                Your Business<br />
                <span className="text-orange-200">Address</span>
              </h1>
              <p className="text-orange-100 mt-4 text-base leading-relaxed max-w-sm">
                We use this to verify your business and show your hotel's location to guests.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                {["Business verified faster", "Shown to customers", "Secure & private"].map((label) => (
                  <span key={label}
                    className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={11} className="text-orange-300" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
                alt="Hotel exterior"
                className="rounded-2xl shadow-2xl object-cover h-72 w-full"
                style={{ objectPosition: "center 60%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Card ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 pb-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}>

          {/* Card header with Auto-fill CTA */}
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Building2 size={20} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Fields marked <span className="text-red-500">*</span> are required.
                </p>
              </div>
            </div>

            {/* ── Auto-fill button ─────────────────────────────────────── */}
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={autoFillLoading}
              title="Detect your location and auto-fill address fields from Google Maps"
              className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {autoFillLoading ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Fetching from Google…
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Auto-fill from Location
                </>
              )}
            </button>
          </div>

          <form onSubmit={saveAddress} noValidate>
            <div className="px-8 py-8 space-y-7">

              {/* ── Business Name + Contact ─────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label htmlFor="business_name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="business_name" type="text" name="business_name"
                      value={formData.business_name} onChange={handleChange}
                      placeholder="ABC Hotels Pvt Ltd"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                        errors.business_name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.business_name && <p className="text-red-500 text-xs mt-1.5">{errors.business_name}</p>}
                </div>

                <div>
                  <label htmlFor="contact_person" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="contact_person" type="text" name="contact_person"
                      value={formData.contact_person} onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    />
                  </div>
                </div>

              </div>

              {/* ── Address Line 1 ──────────────────────────────────────── */}
              <div>
                <label htmlFor="address_line_1" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home size={17} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                  <textarea
                    id="address_line_1" rows={3} name="address_line_1"
                    value={formData.address_line_1} onChange={handleChange}
                    placeholder="Building number, street name…"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none ${
                      errors.address_line_1 ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  />
                </div>
                {errors.address_line_1 && <p className="text-red-500 text-xs mt-1.5">{errors.address_line_1}</p>}
              </div>

              {/* ── Address Line 2 ──────────────────────────────────────── */}
              <div>
                <label htmlFor="address_line_2" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Map size={17} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                  <textarea
                    id="address_line_2" rows={2} name="address_line_2"
                    value={formData.address_line_2} onChange={handleChange}
                    placeholder="Apartment, floor, neighbourhood…"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                  />
                </div>
              </div>

              {/* ── Landmark ────────────────────────────────────────────── */}
              <div>
                <label htmlFor="landmark" className="block text-sm font-semibold text-gray-700 mb-2">
                  Landmark <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Landmark size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="landmark" type="text" name="landmark"
                    value={formData.landmark} onChange={handleChange}
                    placeholder="Near Metro Station, opposite City Mall…"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                </div>
              </div>

              {/* ── Section divider ─────────────────────────────────────── */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Location</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* ── Country / State / City ───────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>
                  <label htmlFor="country_id" className="block text-sm font-semibold text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country_id" name="country_id"
                    value={formData.country_id} onChange={handleCountryChange}
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 ${
                      errors.country_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.country_id && <p className="text-red-500 text-xs mt-1.5">{errors.country_id}</p>}
                </div>

                <div>
                  <label htmlFor="state_id" className="block text-sm font-semibold text-gray-700 mb-2">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state_id" name="state_id"
                    value={formData.state_id} onChange={handleStateChange}
                    disabled={!formData.country_id}
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.state_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.state_id && <p className="text-red-500 text-xs mt-1.5">{errors.state_id}</p>}
                </div>

                <div>
                  <label htmlFor="city_id" className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="city_id" name="city_id"
                    value={formData.city_id} onChange={handleCityChange}
                    disabled={!formData.state_id}
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.city_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                  {errors.city_id && <p className="text-red-500 text-xs mt-1.5">{errors.city_id}</p>}
                </div>

              </div>

              {/* ── Postal Code ─────────────────────────────────────────── */}
              <div className="max-w-xs">
                <label htmlFor="postal_code" className="block text-sm font-semibold text-gray-700 mb-2">
                  Postal / ZIP Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LocateFixed size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="postal_code" type="text" name="postal_code"
                    value={formData.postal_code} onChange={handleChange}
                    placeholder="110001" maxLength={10}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                      errors.postal_code ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  />
                </div>
                {errors.postal_code && <p className="text-red-500 text-xs mt-1.5">{errors.postal_code}</p>}
              </div>

              {/* ── Hidden GPS fields ───────────────────────────────────── */}
              <input type="hidden" name="latitude"  value={formData.latitude} />
              <input type="hidden" name="longitude" value={formData.longitude} />

              {/* ── GPS captured badge ──────────────────────────────────── */}
              {hasLocation && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>
                    GPS coordinates captured —{" "}
                    <span className="font-mono">
                      {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                    </span>
                  </span>
                </div>
              )}

            </div>

            {/* ── Card footer / Actions ───────────────────────────────────── */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">

              <p className="text-xs text-gray-400 hidden sm:block">
                Use <span className="font-semibold text-orange-500">Auto-fill from Location</span> above to populate fields automatically.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl px-7 py-3 text-sm transition shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><LoaderCircle size={16} className="animate-spin" /> Saving…</>
                ) : (
                  <>Save & Continue <ArrowRight size={16} /></>
                )}
              </button>

            </div>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Your information is encrypted and handled securely. Complete this step to proceed with your hotel listing.
        </p>
      </div>
    </div>
  );
};

export default AddressPage;