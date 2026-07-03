// import React, { useEffect, useState } from "react";
// import type { ChangeEvent, FormEvent } from "react";

// import {
//   Building2,
//   User,
//   Map,
//   Home,
//   Landmark,
//   LocateFixed,
//   ArrowRight,
//   LoaderCircle,
//   CheckCircle2,
//   Wand2,
//   X,
//   MapPin,
//   AlertCircle,
// } from "lucide-react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { useNavigate } from "react-router-dom";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Country {
//   id: number | string;
//   name: string;
// }

// interface StateItem {
//   id: number | string;
//   name: string;
// }

// interface City {
//   id: number | string;
//   name: string;
// }

// interface FormData {
//   business_name: string;
//   contact_person: string;
//   address_line_1: string;
//   address_line_2: string;
//   landmark: string;
//   country_id: string;
//   state_id: string;
//   city_id: string;
//   postal_code: string;
//   latitude: string;
//   longitude: string;
// }

// interface FormErrors {
//   business_name?: string;
//   address_line_1?: string;
//   country_id?: string;
//   state_id?: string;
//   city_id?: string;
//   postal_code?: string;
// }

// // Auto-filled data preview (stores resolved names + IDs)
// interface AutoFillPreview {
//   address_line_1: string;
//   address_line_2: string;
//   postal_code: string;
//   landmark: string;
//   country_name: string;
//   state_name: string;
//   city_name: string;
//   country_id: string;
//   state_id: string;
//   city_id: string;
//   latitude: string;
//   longitude: string;
// }

// // Google Geocoding API types
// interface GeoAddressComponent {
//   long_name: string;
//   short_name: string;
//   types: string[];
// }

// interface GeoResult {
//   address_components: GeoAddressComponent[];
//   formatted_address: string;
// }

// interface GeoResponse {
//   results: GeoResult[];
//   status: string;
// }

// // ─── Steps ────────────────────────────────────────────────────────────────────

// const STEPS = [
//   { label: "Account", done: true },
//   { label: "Address", done: false, active: true },
//   { label: "Listing", done: false },
//   { label: "Review", done: false },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /** Case-insensitive fuzzy match — finds the closest item in a list by name */
// function fuzzyMatch<T extends { id: number | string; name: string }>(
//   list: T[],
//   target: string
// ): T | undefined {
//   if (!target) return undefined;
//   const t = target.toLowerCase().trim();
//   return (
//     list.find((i) => i.name.toLowerCase() === t) ??
//     list.find((i) => i.name.toLowerCase().includes(t)) ??
//     list.find((i) => t.includes(i.name.toLowerCase()))
//   );
// }

// /** Extract a single value from Google address_components by type */
// function extractComponent(
//   components: GeoAddressComponent[],
//   type: string,
//   short = false
// ): string {
//   const match = components.find((c) => c.types.includes(type));
//   return match ? (short ? match.short_name : match.long_name) : "";
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// const AddressPage: React.FC = () => {
//   const navigate = useNavigate();
//   const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
//   const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

//   const [loading, setLoading] = useState<boolean>(false);
//   const [autoFillLoading, setAutoFillLoading] = useState<boolean>(false);

//   const [countries, setCountries] = useState<Country[]>([]);
//   const [states, setStates] = useState<StateItem[]>([]);
//   const [cities, setCities] = useState<City[]>([]);

//   const [errors, setErrors] = useState<FormErrors>({});

//   // Preview modal state
//   const [preview, setPreview] = useState<AutoFillPreview | null>(null);
//   const [showPreview, setShowPreview] = useState<boolean>(false);

//   const [formData, setFormData] = useState<FormData>({
//     business_name: "",
//     contact_person: "",
//     address_line_1: "",
//     address_line_2: "",
//     landmark: "",
//     country_id: "",
//     state_id: "",
//     city_id: "",
//     postal_code: "",
//     latitude: "",
//     longitude: "",
//   });

//   // ── Data fetching ────────────────────────────────────────────────────────────

//   useEffect(() => {
//     fetchCountries();
//   }, []);

//   const fetchCountries = async (): Promise<void> => {
//     try {
//       const res = await axios.get<{ data: Country[] }>(
//         `${backendUrl}/api/location/countries`
//       );
//       setCountries(res.data.data);
//     } catch (err) {
//       console.error("Failed to fetch countries:", err);
//     }
//   };

//   const fetchStates = async (countryId: string): Promise<StateItem[]> => {
//     try {
//       const res = await axios.get<{ data: StateItem[] }>(
//         `${backendUrl}/api/location/states/${countryId}`
//       );
//       setStates(res.data.data);
//       setCities([]);
//       return res.data.data;
//     } catch (err) {
//       console.error("Failed to fetch states:", err);
//       return [];
//     }
//   };

//   const fetchCities = async (stateId: string): Promise<City[]> => {
//     try {
//       const res = await axios.get<{ data: City[] }>(
//         `${backendUrl}/api/location/cities/${stateId}`
//       );
//       setCities(res.data.data);
//       return res.data.data;
//     } catch (err) {
//       console.error("Failed to fetch cities:", err);
//       return [];
//     }
//   };

//   // ── Handlers ─────────────────────────────────────────────────────────────────

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ): void => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>): void => {
//     const value = e.target.value;
//     setFormData((prev) => ({ ...prev, country_id: value, state_id: "", city_id: "" }));
//     setErrors((prev) => ({ ...prev, country_id: "" }));
//     if (value) fetchStates(value);
//     else { setStates([]); setCities([]); }
//   };

//   const handleStateChange = (e: ChangeEvent<HTMLSelectElement>): void => {
//     const value = e.target.value;
//     setFormData((prev) => ({ ...prev, state_id: value, city_id: "" }));
//     setErrors((prev) => ({ ...prev, state_id: "" }));
//     if (value) fetchCities(value);
//     else setCities([]);
//   };

//   const handleCityChange = (e: ChangeEvent<HTMLSelectElement>): void => {
//     setFormData((prev) => ({ ...prev, city_id: e.target.value }));
//     setErrors((prev) => ({ ...prev, city_id: "" }));
//   };

//   // ── Auto-fill from Google ─────────────────────────────────────────────────────

//   const handleAutoFill = (): void => {
//     if (!navigator.geolocation) {
//       toast.error("Geolocation is not supported by your browser.");
//       return;
//     }

//     if (!googleApiKey) {
//       toast.error("Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY).");
//       return;
//     }

//     setAutoFillLoading(true);

//     navigator.geolocation.getCurrentPosition(
//       async (position: GeolocationPosition) => {
//         const { latitude, longitude } = position.coords;

//         try {
//           // Call Google Geocoding API via your backend proxy to keep key hidden,
//           // OR directly (shown below). Switch to proxy if you want key server-side.
//           const geoRes = await axios.get<GeoResponse>(
//             `https://maps.googleapis.com/maps/api/geocode/json`,
//             {
//               params: {
//                 latlng: `${latitude},${longitude}`,
//                 key: googleApiKey,
//                 language: "en",
//                 result_type:
//                   "street_address|sublocality|locality|administrative_area_level_1|country",
//               },
//             }
//           );

//           if (geoRes.data.status !== "OK" || !geoRes.data.results.length) {
//             toast.error("Google could not resolve this location. Try again.");
//             setAutoFillLoading(false);
//             return;
//           }

//           const components = geoRes.data.results[0].address_components;

//           // ── Extract components ──────────────────────────────────────────────
//           const streetNumber  = extractComponent(components, "street_number");
//           const route         = extractComponent(components, "route");
//           const sublocality   = extractComponent(components, "sublocality_level_1")
//                               || extractComponent(components, "sublocality");
//           const postalCode    = extractComponent(components, "postal_code");
//           const cityName      =
//             extractComponent(components, "locality") ||
//             extractComponent(components, "administrative_area_level_2");
//           const stateName     = extractComponent(components, "administrative_area_level_1");
//           const countryName   = extractComponent(components, "country");

//           const address1 = [streetNumber, route].filter(Boolean).join(" ")
//             || extractComponent(components, "premise")
//             || geoRes.data.results[0].formatted_address.split(",")[0];

//           // ── Resolve country ─────────────────────────────────────────────────
//           const matchedCountry = fuzzyMatch(countries, countryName);
//           if (!matchedCountry) {
//             toast.error(`Country "${countryName}" not found in your database.`);
//             setAutoFillLoading(false);
//             return;
//           }

//           // ── Fetch & resolve state ───────────────────────────────────────────
//           const freshStates = await fetchStates(String(matchedCountry.id));
//           const matchedState = fuzzyMatch(freshStates, stateName);

//           // ── Fetch & resolve city ────────────────────────────────────────────
//           let matchedCity: City | undefined;
//           if (matchedState) {
//             const freshCities = await fetchCities(String(matchedState.id));
//             matchedCity = fuzzyMatch(freshCities, cityName);
//           }

//           // ── Build preview ───────────────────────────────────────────────────
//           const previewData: AutoFillPreview = {
//             address_line_1: address1,
//             address_line_2: sublocality,
//             postal_code:    postalCode,
//             landmark:       "",
//             country_name:   countryName,
//             state_name:     stateName,
//             city_name:      cityName,
//             country_id:     matchedCountry ? String(matchedCountry.id) : "",
//             state_id:       matchedState   ? String(matchedState.id)   : "",
//             city_id:        matchedCity    ? String(matchedCity.id)    : "",
//             latitude:       String(latitude),
//             longitude:      String(longitude),
//           };

//           setPreview(previewData);
//           setShowPreview(true);
//         } catch (err) {
//           console.error("Geocoding error:", err);
//           toast.error("Failed to fetch address from Google. Check your API key.");
//         } finally {
//           setAutoFillLoading(false);
//         }
//       },
//       () => {
//         toast.error("Location access denied. Please allow location in browser settings.");
//         setAutoFillLoading(false);
//       }
//     );
//   };

//   /** Apply confirmed preview data to the form */
//   const applyPreview = (): void => {
//     if (!preview) return;
//     setFormData((prev) => ({
//       ...prev,
//       address_line_1: preview.address_line_1 || prev.address_line_1,
//       address_line_2: preview.address_line_2 || prev.address_line_2,
//       postal_code:    preview.postal_code    || prev.postal_code,
//       country_id:     preview.country_id     || prev.country_id,
//       state_id:       preview.state_id       || prev.state_id,
//       city_id:        preview.city_id        || prev.city_id,
//       latitude:       preview.latitude,
//       longitude:      preview.longitude,
//     }));
//     setErrors({});
//     setShowPreview(false);
//     toast.success("Address auto-filled from your location!");
//   };

//   // ── Validation ───────────────────────────────────────────────────────────────

//   const validate = (): boolean => {
//     const newErrors: FormErrors = {};
//     if (!formData.business_name.trim())  newErrors.business_name  = "Business name is required.";
//     if (!formData.address_line_1.trim()) newErrors.address_line_1 = "Address line 1 is required.";
//     if (!formData.country_id)            newErrors.country_id     = "Please select a country.";
//     if (!formData.state_id)              newErrors.state_id       = "Please select a state.";
//     if (!formData.city_id)               newErrors.city_id        = "Please select a city.";
//     if (!formData.postal_code.trim())    newErrors.postal_code    = "Postal code is required.";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // ── Submit ───────────────────────────────────────────────────────────────────

//   const saveAddress = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//     e.preventDefault();
//     if (!validate()) return;
//     try {
//       setLoading(true);
//       await axios.post(`${backendUrl}/api/location/address`, 
//         formData,
//         {
//           withCredentials:true
//         }
//       );
//       toast.success("Address saved successfully.");
//       navigate("/vendor/dashboard");
//     } catch (err: unknown) {
//       const message =
//         axios.isAxiosError(err) && err.response?.data?.message
//           ? (err.response.data.message as string)
//           : "Something went wrong. Please try again.";
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hasLocation = formData.latitude && formData.longitude;

//   // ─── Render ───────────────────────────────────────────────────────────────────

//   return (
//     <div className="min-h-screen" style={{ background: "#F7F8FA" }}>

//       {/* ── Auto-fill Preview Modal ──────────────────────────────────────────── */}
//       {showPreview && preview && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

//             {/* Modal header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
//                   <Wand2 size={18} className="text-orange-500" />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-gray-900 text-base">Address Found</h3>
//                   <p className="text-xs text-gray-500">Review before applying</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowPreview(false)}
//                 className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             {/* Data rows */}
//             <div className="px-6 py-5 space-y-3">
//               {[
//                 { label: "Address Line 1", value: preview.address_line_1 },
//                 { label: "Address Line 2", value: preview.address_line_2 },
//                 { label: "Postal Code",    value: preview.postal_code },
//                 { label: "Country",        value: preview.country_name, matched: !!preview.country_id },
//                 { label: "State",          value: preview.state_name,   matched: !!preview.state_id },
//                 { label: "City",           value: preview.city_name,    matched: !!preview.city_id },
//                 {
//                   label: "GPS",
//                   value: `${parseFloat(preview.latitude).toFixed(5)}, ${parseFloat(preview.longitude).toFixed(5)}`,
//                   matched: true,
//                 },
//               ].map(({ label, value, matched }) => (
//                 <div key={label}
//                   className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
//                   <span className="text-xs font-semibold text-gray-500 w-28 shrink-0 pt-0.5">{label}</span>
//                   <div className="flex items-center gap-2 flex-1 justify-end">
//                     <span className={`text-sm text-right font-medium ${value ? "text-gray-800" : "text-gray-400 italic"}`}>
//                       {value || "Not found"}
//                     </span>
//                     {value && matched !== undefined && (
//                       matched
//                         ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
//                         : <AlertCircle  size={14} className="text-amber-400 shrink-0" />
//                     )}
//                   </div>
//                 </div>
//               ))}

//               {/* Warn if any location IDs didn't match */}
//               {(!preview.country_id || !preview.state_id || !preview.city_id) && (
//                 <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
//                   <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
//                   <p className="text-xs text-amber-700">
//                     Some location fields couldn't be matched to your database —
//                     those dropdowns will stay unchanged. You can set them manually.
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Modal actions */}
//             <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
//               <button
//                 onClick={() => setShowPreview(false)}
//                 className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={applyPreview}
//                 className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition shadow shadow-orange-200"
//               >
//                 <CheckCircle2 size={15} />
//                 Apply to Form
//               </button>
//             </div>

//           </div>
//         </div>
//       )}

//       {/* ── Top Progress Bar ──────────────────────────────────────────────────── */}
//       <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
//         <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
//               <MapPin size={16} className="text-white" />
//             </div>
//             <span className="font-bold text-gray-800 text-sm tracking-wide">VendorHub</span>
//           </div>

//           <div className="hidden sm:flex items-center gap-1">
//             {STEPS.map((step, i) => (
//               <React.Fragment key={step.label}>
//                 <div className="flex items-center gap-1.5">
//                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
//                     step.done   ? "bg-orange-500 text-white"
//                     : step.active ? "bg-orange-100 text-orange-600 ring-2 ring-orange-400"
//                     : "bg-gray-100 text-gray-400"
//                   }`}>
//                     {step.done ? <CheckCircle2 size={13} /> : i + 1}
//                   </div>
//                   <span className={`text-xs font-medium ${
//                     step.active ? "text-orange-600" : step.done ? "text-gray-600" : "text-gray-400"
//                   }`}>{step.label}</span>
//                 </div>
//                 {i < STEPS.length - 1 && (
//                   <div className={`w-8 h-px mx-1 ${step.done ? "bg-orange-400" : "bg-gray-200"}`} />
//                 )}
//               </React.Fragment>
//             ))}
//           </div>

//           <span className="sm:hidden text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
//             Step 2 of 4
//           </span>
//         </div>
//       </div>

//       {/* ── Hero ─────────────────────────────────────────────────────────────── */}
//       <div className="relative overflow-hidden"
//         style={{ background: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)" }}>
//         <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ background: "white" }} />
//         <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ background: "white" }} />

//         <div className="relative max-w-5xl mx-auto px-6 py-16">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <span className="inline-flex items-center gap-1.5 bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
//                 <MapPin size={11} /> Vendor Registration · Step 2
//               </span>
//               <h1 className="text-4xl lg:text-5xl font-extrabold text-white mt-6 leading-tight tracking-tight">
//                 Your Business<br />
//                 <span className="text-orange-200">Address</span>
//               </h1>
//               <p className="text-orange-100 mt-4 text-base leading-relaxed max-w-sm">
//                 We use this to verify your business and show your hotel's location to guests.
//               </p>
//               <div className="flex flex-wrap gap-3 mt-8">
//                 {["Business verified faster", "Shown to customers", "Secure & private"].map((label) => (
//                   <span key={label}
//                     className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
//                     <CheckCircle2 size={11} className="text-orange-300" />
//                     {label}
//                   </span>
//                 ))}
//               </div>
//             </div>
//             <div className="hidden lg:block">
//               <img
//                 src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
//                 alt="Hotel exterior"
//                 className="rounded-2xl shadow-2xl object-cover h-72 w-full"
//                 style={{ objectPosition: "center 60%" }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── Form Card ────────────────────────────────────────────────────────── */}
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 pb-24 relative z-10">
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden"
//           style={{ border: "1px solid rgba(0,0,0,0.06)" }}>

//           {/* Card header with Auto-fill CTA */}
//           <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
//                 <Building2 size={20} className="text-orange-500" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
//                 <p className="text-sm text-gray-500 mt-0.5">
//                   Fields marked <span className="text-red-500">*</span> are required.
//                 </p>
//               </div>
//             </div>

//             {/* ── Auto-fill button ─────────────────────────────────────── */}
//             <button
//               type="button"
//               onClick={handleAutoFill}
//               disabled={autoFillLoading}
//               title="Detect your location and auto-fill address fields from Google Maps"
//               className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
//             >
//               {autoFillLoading ? (
//                 <>
//                   <LoaderCircle size={16} className="animate-spin" />
//                   Fetching from Google…
//                 </>
//               ) : (
//                 <>
//                   <Wand2 size={16} />
//                   Auto-fill from Location
//                 </>
//               )}
//             </button>
//           </div>

//           <form onSubmit={saveAddress} noValidate>
//             <div className="px-8 py-8 space-y-7">

//               {/* ── Business Name + Contact ─────────────────────────────── */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                 <div>
//                   <label htmlFor="business_name" className="block text-sm font-semibold text-gray-700 mb-2">
//                     Business Name <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                     <input
//                       id="business_name" type="text" name="business_name"
//                       value={formData.business_name} onChange={handleChange}
//                       placeholder="ABC Hotels Pvt Ltd"
//                       className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
//                         errors.business_name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
//                       }`}
//                     />
//                   </div>
//                   {errors.business_name && <p className="text-red-500 text-xs mt-1.5">{errors.business_name}</p>}
//                 </div>

//                 <div>
//                   <label htmlFor="contact_person" className="block text-sm font-semibold text-gray-700 mb-2">
//                     Contact Person
//                   </label>
//                   <div className="relative">
//                     <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                     <input
//                       id="contact_person" type="text" name="contact_person"
//                       value={formData.contact_person} onChange={handleChange}
//                       placeholder="John Doe"
//                       className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
//                     />
//                   </div>
//                 </div>

//               </div>

//               {/* ── Address Line 1 ──────────────────────────────────────── */}
//               <div>
//                 <label htmlFor="address_line_1" className="block text-sm font-semibold text-gray-700 mb-2">
//                   Address Line 1 <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Home size={17} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
//                   <textarea
//                     id="address_line_1" rows={3} name="address_line_1"
//                     value={formData.address_line_1} onChange={handleChange}
//                     placeholder="Building number, street name…"
//                     className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none ${
//                       errors.address_line_1 ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
//                     }`}
//                   />
//                 </div>
//                 {errors.address_line_1 && <p className="text-red-500 text-xs mt-1.5">{errors.address_line_1}</p>}
//               </div>

//               {/* ── Address Line 2 ──────────────────────────────────────── */}
//               <div>
//                 <label htmlFor="address_line_2" className="block text-sm font-semibold text-gray-700 mb-2">
//                   Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
//                 </label>
//                 <div className="relative">
//                   <Map size={17} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
//                   <textarea
//                     id="address_line_2" rows={2} name="address_line_2"
//                     value={formData.address_line_2} onChange={handleChange}
//                     placeholder="Apartment, floor, neighbourhood…"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
//                   />
//                 </div>
//               </div>

//               {/* ── Landmark ────────────────────────────────────────────── */}
//               <div>
//                 <label htmlFor="landmark" className="block text-sm font-semibold text-gray-700 mb-2">
//                   Landmark <span className="text-gray-400 font-normal">(optional)</span>
//                 </label>
//                 <div className="relative">
//                   <Landmark size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                   <input
//                     id="landmark" type="text" name="landmark"
//                     value={formData.landmark} onChange={handleChange}
//                     placeholder="Near Metro Station, opposite City Mall…"
//                     className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 hover:border-gray-300 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
//                   />
//                 </div>
//               </div>

//               {/* ── Section divider ─────────────────────────────────────── */}
//               <div className="flex items-center gap-3 pt-1">
//                 <div className="flex-1 h-px bg-gray-100" />
//                 <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Location</span>
//                 <div className="flex-1 h-px bg-gray-100" />
//               </div>

//               {/* ── Country / State / City ───────────────────────────────── */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

//                 <div>
//                   <label htmlFor="country_id" className="block text-sm font-semibold text-gray-700 mb-2">
//                     Country <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     id="country_id" name="country_id"
//                     value={formData.country_id} onChange={handleCountryChange}
//                     className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 ${
//                       errors.country_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
//                     }`}
//                   >
//                     <option value="">Select Country</option>
//                     {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//                   </select>
//                   {errors.country_id && <p className="text-red-500 text-xs mt-1.5">{errors.country_id}</p>}
//                 </div>

//                 <div>
//                   <label htmlFor="state_id" className="block text-sm font-semibold text-gray-700 mb-2">
//                     State / Province <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     id="state_id" name="state_id"
//                     value={formData.state_id} onChange={handleStateChange}
//                     disabled={!formData.country_id}
//                     className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
//                       errors.state_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
//                     }`}
//                   >
//                     <option value="">Select State</option>
//                     {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
//                   </select>
//                   {errors.state_id && <p className="text-red-500 text-xs mt-1.5">{errors.state_id}</p>}
//                 </div>

//                 <div>
//                   <label htmlFor="city_id" className="block text-sm font-semibold text-gray-700 mb-2">
//                     City <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     id="city_id" name="city_id"
//                     value={formData.city_id} onChange={handleCityChange}
//                     disabled={!formData.state_id}
//                     className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
//                       errors.city_id ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
//                     }`}
//                   >
//                     <option value="">Select City</option>
//                     {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
//                   </select>
//                   {errors.city_id && <p className="text-red-500 text-xs mt-1.5">{errors.city_id}</p>}
//                 </div>

//               </div>

//               {/* ── Postal Code ─────────────────────────────────────────── */}
//               <div className="max-w-xs">
//                 <label htmlFor="postal_code" className="block text-sm font-semibold text-gray-700 mb-2">
//                   Postal / ZIP Code <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <LocateFixed size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                   <input
//                     id="postal_code" type="text" name="postal_code"
//                     value={formData.postal_code} onChange={handleChange}
//                     placeholder="110001" maxLength={10}
//                     className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
//                       errors.postal_code ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
//                     }`}
//                   />
//                 </div>
//                 {errors.postal_code && <p className="text-red-500 text-xs mt-1.5">{errors.postal_code}</p>}
//               </div>

//               {/* ── Hidden GPS fields ───────────────────────────────────── */}
//               <input type="hidden" name="latitude"  value={formData.latitude} />
//               <input type="hidden" name="longitude" value={formData.longitude} />

//               {/* ── GPS captured badge ──────────────────────────────────── */}
//               {hasLocation && (
//                 <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
//                   <CheckCircle2 size={14} className="text-green-500 shrink-0" />
//                   <span>
//                     GPS coordinates captured —{" "}
//                     <span className="font-mono">
//                       {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
//                     </span>
//                   </span>
//                 </div>
//               )}

//             </div>

//             {/* ── Card footer / Actions ───────────────────────────────────── */}
//             <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">

//               <p className="text-xs text-gray-400 hidden sm:block">
//                 Use <span className="font-semibold text-orange-500">Auto-fill from Location</span> above to populate fields automatically.
//               </p>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl px-7 py-3 text-sm transition shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
//               >
//                 {loading ? (
//                   <><LoaderCircle size={16} className="animate-spin" /> Saving…</>
//                 ) : (
//                   <>Save & Continue <ArrowRight size={16} /></>
//                 )}
//               </button>

//             </div>
//           </form>
//         </div>

//         <p className="text-center text-gray-400 text-xs mt-8">
//           Your information is encrypted and handled securely. Complete this step to proceed with your hotel listing.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default AddressPage;



import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Building2,
  User,
  Map,
  Home,
  Landmark,
  LocateFixed,
  ArrowRight,
  ChevronLeft,
  LoaderCircle,
  CheckCircle2,
  Wand2,
  X,
  MapPin,
  AlertCircle,
  Check,
  ImagePlus,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ---------------------------------------------------------
   TOKENS — shared with the listing flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

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

// ─── Steps (mirrors the listing flow's step rail) ─────────────────────────────

const STEPS = [
  { key: "account", label: "Account", icon: User },
  { key: "address", label: "Business Address", icon: MapPin },
  { key: "listing", label: "Property Listing", icon: Home },
  { key: "review", label: "Review", icon: CheckCircle2 },
];
const CURRENT_STEP = 1; // "Business Address"

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

// ─── Small UI primitives (match the listing flow) ─────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-1.5">
        {label} {required && <span className="text-[#B3452E]">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-[11px] text-[#B3452E] mt-1">{error}</span>
      ) : (
        hint && <span className="block text-[11px] text-[#9A917D] mt-1">{hint}</span>
      )}
    </label>
  );
}

const inputCls =
  "w-full bg-white border border-[#DBD3C4] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition disabled:opacity-50 disabled:cursor-not-allowed";

const inputErrorCls = "border-[#B3452E] bg-[#B3452E]/5";

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
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#EFE9DC] last:border-0">
      <span className="text-[12px] font-semibold text-[#9A917D] w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-[13.5px] font-medium text-[#1E2A23] text-right">{value || "—"}</span>
    </div>
  );
}

/* ---------------------------------------------------------
   PROSTAYZ WORDMARK — logo slot + name
--------------------------------------------------------- */

function ProstayzMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Logo slot — swap this div for an <img src="/logo.svg" /> when ready */}
      <div
        className={`${compact ? "w-8 h-8" : "w-9 h-9"} rounded-xl border border-dashed border-[#C99A3D]/60 bg-[#C99A3D]/10 flex items-center justify-center flex-shrink-0`}
        aria-label="Prostayz logo"
      >
        <ImagePlus size={compact ? 14 : 15} className="text-[#C99A3D]" />
      </div>
      <span className={`font-display ${compact ? "text-[17px]" : "text-[19px]"} text-[#1E2A23] tracking-tight`}>
        Prostayz
      </span>
    </div>
  );
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
  const { verifyVendor } = useAuth();

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
          const streetNumber = extractComponent(components, "street_number");
          const route = extractComponent(components, "route");
          const sublocality = extractComponent(components, "sublocality_level_1")
            || extractComponent(components, "sublocality");
          const postalCode = extractComponent(components, "postal_code");
          const cityName =
            extractComponent(components, "locality") ||
            extractComponent(components, "administrative_area_level_2");
          const stateName = extractComponent(components, "administrative_area_level_1");
          const countryName = extractComponent(components, "country");

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
            postal_code: postalCode,
            landmark: "",
            country_name: countryName,
            state_name: stateName,
            city_name: cityName,
            country_id: matchedCountry ? String(matchedCountry.id) : "",
            state_id: matchedState ? String(matchedState.id) : "",
            city_id: matchedCity ? String(matchedCity.id) : "",
            latitude: String(latitude),
            longitude: String(longitude),
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
      postal_code: preview.postal_code || prev.postal_code,
      country_id: preview.country_id || prev.country_id,
      state_id: preview.state_id || prev.state_id,
      city_id: preview.city_id || prev.city_id,
      latitude: preview.latitude,
      longitude: preview.longitude,
    }));
    setErrors({});
    setShowPreview(false);
    toast.success("Address auto-filled from your location!");
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.business_name.trim()) newErrors.business_name = "Business name is required.";
    if (!formData.address_line_1.trim()) newErrors.address_line_1 = "Address line 1 is required.";
    if (!formData.country_id) newErrors.country_id = "Please select a country.";
    if (!formData.state_id) newErrors.state_id = "Please select a state.";
    if (!formData.city_id) newErrors.city_id = "Please select a city.";
    if (!formData.postal_code.trim()) newErrors.postal_code = "Postal code is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  // const saveAddress = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
  //   e.preventDefault();
  //   if (!validate()) return;
  //   try {
  //     setLoading(true);
  //     await axios.post(`${backendUrl}/api/location/address`,
  //       formData,
  //       {
  //         withCredentials:true
  //       }
  //     );
  //     toast.success("Address saved successfully.");
  //     navigate("/vendor/dashboard");
  //   } catch (err: unknown) {
  //     const message =
  //       axios.isAxiosError(err) && err.response?.data?.message
  //         ? (err.response.data.message as string)
  //         : "Something went wrong. Please try again.";
  //     toast.error(message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const saveAddress = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {

    e.preventDefault();

    if (!validate()) return;

    try {

      setLoading(true);

      await axios.post(
        `${backendUrl}/api/location/address`,
        formData,
        {
          withCredentials: true,
        }
      );
      toast.success("Address saved successfully.");

      // Refresh authentication state
      await verifyVendor();
      // Get latest onboarding step
      const { data: setupData } = await axios.get(
        `${backendUrl}/api/vendor/setup-status`,
        {
          withCredentials: true,
        }
      );

      // Redirect to next pending ste
      navigate(setupData.redirect, { replace: true });
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

  // ── Derived values for the live preview card ──────────────────────────────────

  const selectedCountry = countries.find((c) => String(c.id) === formData.country_id);
  const selectedState = states.find((s) => String(s.id) === formData.state_id);
  const selectedCity = cities.find((c) => String(c.id) === formData.city_id);

  const locationLine = [selectedCity?.name, selectedState?.name, selectedCountry?.name]
    .filter(Boolean)
    .join(", ");

  // ─── Render ───────────────────────────────────────────────────────────────────

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

      {/* ── Auto-fill Preview Modal ──────────────────────────────────────────── */}
      {showPreview && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(30,42,35,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E5DECF]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE9DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C99A3D]/12 flex items-center justify-center">
                  <Wand2 size={18} className="text-[#C99A3D]" />
                </div>
                <div>
                  <h3 className="font-display text-[17px] text-[#1E2A23]">Address found</h3>
                  <p className="text-[12px] text-[#9A917D]">Review before applying</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F2EA] transition text-[#9A917D] hover:text-[#1E2A23]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Data rows */}
            <div className="px-6 py-5 space-y-1">
              {[
                { label: "Address Line 1", value: preview.address_line_1 },
                { label: "Address Line 2", value: preview.address_line_2 },
                { label: "Postal Code", value: preview.postal_code },
                { label: "Country", value: preview.country_name, matched: !!preview.country_id },
                { label: "State", value: preview.state_name, matched: !!preview.state_id },
                { label: "City", value: preview.city_name, matched: !!preview.city_id },
                {
                  label: "GPS",
                  value: `${parseFloat(preview.latitude).toFixed(5)}, ${parseFloat(preview.longitude).toFixed(5)}`,
                  matched: true,
                },
              ].map(({ label, value, matched }) => (
                <div key={label}
                  className="flex items-start justify-between gap-4 py-2 border-b border-[#EFE9DC] last:border-0">
                  <span className="text-[12px] font-semibold text-[#9A917D] w-28 shrink-0 pt-0.5">{label}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={`text-[13.5px] text-right font-medium ${value ? "text-[#1E2A23]" : "text-[#B3AB99] italic"}`}>
                      {value || "Not found"}
                    </span>
                    {value && matched !== undefined && (
                      matched
                        ? <CheckCircle2 size={14} className="text-[#2F6F62] shrink-0" />
                        : <AlertCircle size={14} className="text-[#C99A3D] shrink-0" />
                    )}
                  </div>
                </div>
              ))}

              {/* Warn if any location IDs didn't match */}
              {(!preview.country_id || !preview.state_id || !preview.city_id) && (
                <div className="flex items-start gap-2.5 bg-[#C99A3D]/8 border border-[#C99A3D]/25 rounded-xl px-4 py-3 mt-3">
                  <AlertCircle size={15} className="text-[#C99A3D] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#6B6354]">
                    Some location fields couldn't be matched to your database —
                    those dropdowns will stay unchanged. You can set them manually.
                  </p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F9F6EF] border-t border-[#EFE9DC]">
              <button
                onClick={() => setShowPreview(false)}
                className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-[#6B6354] hover:bg-[#EAE4D6] transition"
              >
                Cancel
              </button>
              <button
                onClick={applyPreview}
                className="flex items-center gap-2 bg-[#2F6F62] hover:bg-[#255A4F] text-white rounded-xl px-6 py-2.5 text-[13.5px] font-semibold transition"
              >
                <CheckCircle2 size={15} />
                Apply to form
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-6">
        {/* ---------- LEFT: BRAND + STEP RAIL ---------- */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <div className="mb-7">
            <ProstayzMark />
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold mt-4">
              Vendor onboarding
            </p>
            <h1 className="font-display text-[24px] leading-tight text-[#1E2A23] mt-1">Set up your business</h1>
          </div>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === CURRENT_STEP;
              const done = i < CURRENT_STEP;
              return (
                <li key={s.key}>
                  <div
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${active ? "bg-[#1E2A23] text-white" : "text-[#1E2A23]"
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
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 rounded-xl border border-[#E5DECF] bg-white p-4">
            <p className="text-[12.5px] text-[#6B6354] leading-relaxed">
              We use your address to verify <span className="font-semibold text-[#1E2A23]">Prostayz</span> listings
              and show guests exactly where to find you.
            </p>
          </div>
        </aside>

        {/* ---------- CENTER: FORM CARD ---------- */}
        <main className="bg-white rounded-2xl border border-[#E5DECF] p-7 lg:p-9 min-h-[640px] flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <StepHeader
                eyebrow="Step 2 of 4"
                title="Where is your business?"
                sub="We use this to verify your business and show your property's location to guests."
              />
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={autoFillLoading}
                title="Detect your location and auto-fill address fields from Google Maps"
                className="flex items-center gap-2 bg-[#2F6F62] hover:bg-[#255A4F] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
              >
                {autoFillLoading ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    Auto-fill from location
                  </>
                )}
              </button>
            </div>

            <form onSubmit={saveAddress} noValidate className="mt-7">
              <div className="space-y-6">
                {/* ── Business Name + Contact ─────────────────────────────── */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Business name" required error={errors.business_name}>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="ABC Hotels Pvt Ltd"
                        className={`${inputCls} pl-9 ${errors.business_name ? inputErrorCls : ""}`}
                      />
                    </div>
                  </Field>

                  <Field label="Contact person">
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </Field>
                </div>

                {/* ── Address Line 1 ──────────────────────────────────────── */}
                <Field label="Address line 1" required error={errors.address_line_1}>
                  <div className="relative">
                    <Home size={15} className="absolute left-3 top-3 text-[#B3AB99]" />
                    <textarea
                      rows={3}
                      name="address_line_1"
                      value={formData.address_line_1}
                      onChange={handleChange}
                      placeholder="Building number, street name…"
                      className={`${inputCls} pl-9 resize-none ${errors.address_line_1 ? inputErrorCls : ""}`}
                    />
                  </div>
                </Field>

                {/* ── Address Line 2 ──────────────────────────────────────── */}
                <Field label="Address line 2" hint="Optional">
                  <div className="relative">
                    <Map size={15} className="absolute left-3 top-3 text-[#B3AB99]" />
                    <textarea
                      rows={2}
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleChange}
                      placeholder="Apartment, floor, neighbourhood…"
                      className={`${inputCls} pl-9 resize-none`}
                    />
                  </div>
                </Field>

                {/* ── Landmark ────────────────────────────────────────────── */}
                <Field label="Landmark" hint="Optional">
                  <div className="relative">
                    <Landmark size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="Near Metro Station, opposite City Mall…"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>

                {/* ── Section divider ─────────────────────────────────────── */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#EFE9DC]" />
                  <span className="text-[11px] text-[#9A917D] font-semibold uppercase tracking-widest">Location</span>
                  <div className="flex-1 h-px bg-[#EFE9DC]" />
                </div>

                {/* ── Country / State / City ───────────────────────────────── */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Country" required error={errors.country_id}>
                    <select
                      name="country_id"
                      value={formData.country_id}
                      onChange={handleCountryChange}
                      className={`${inputCls} appearance-none ${errors.country_id ? inputErrorCls : ""}`}
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="State / Province" required error={errors.state_id}>
                    <select
                      name="state_id"
                      value={formData.state_id}
                      onChange={handleStateChange}
                      disabled={!formData.country_id}
                      className={`${inputCls} appearance-none ${errors.state_id ? inputErrorCls : ""}`}
                    >
                      <option value="">Select state</option>
                      {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>

                  <Field label="City" required error={errors.city_id}>
                    <select
                      name="city_id"
                      value={formData.city_id}
                      onChange={handleCityChange}
                      disabled={!formData.state_id}
                      className={`${inputCls} appearance-none ${errors.city_id ? inputErrorCls : ""}`}
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                    </select>
                  </Field>
                </div>

                {/* ── Postal Code ─────────────────────────────────────────── */}
                <div className="sm:w-1/3">
                  <Field label="Postal / ZIP code" required error={errors.postal_code}>
                    <div className="relative">
                      <LocateFixed size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        placeholder="110001"
                        maxLength={10}
                        className={`${inputCls} pl-9 ${errors.postal_code ? inputErrorCls : ""}`}
                      />
                    </div>
                  </Field>
                </div>

                {/* ── Hidden GPS fields ───────────────────────────────────── */}
                <input type="hidden" name="latitude" value={formData.latitude} />
                <input type="hidden" name="longitude" value={formData.longitude} />

                {/* ── GPS captured badge ──────────────────────────────────── */}
                {hasLocation && (
                  <div className="flex items-center gap-2 text-[12.5px] text-[#2F6F62] bg-[#2F6F62]/8 border border-[#2F6F62]/25 rounded-lg px-4 py-3">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>
                      GPS coordinates captured —{" "}
                      <span className="font-mono-num">
                        {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* NAV */}
              <div className="flex items-center justify-between pt-7 mt-7 border-t border-[#EFE9DC]">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#6B6354] hover:text-[#1E2A23] transition"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <span className="text-[12px] font-mono-num text-[#B3AB99]">
                  {String(CURRENT_STEP + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#1E2A23] hover:bg-[#16201A] text-white font-semibold rounded-lg px-5 py-2.5 text-[13.5px] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><LoaderCircle size={15} className="animate-spin" /> Saving…</>
                  ) : (
                    <>Save & continue <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* ---------- RIGHT: LIVE PREVIEW ---------- */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold mb-3">Business preview</p>
          <div className="bg-white rounded-2xl border border-[#E5DECF] overflow-hidden">
            <div className="relative h-28 bg-gradient-to-br from-[#1E2A23] to-[#2F6F62] flex items-center justify-center">
              <ProstayzMark compact />
            </div>
            <div className="p-5">
              <h3 className="font-display text-[18px] leading-snug text-[#1E2A23]">
                {formData.business_name || "Untitled business"}
              </h3>
              {formData.contact_person && (
                <p className="text-[12.5px] text-[#9A917D] mt-1 flex items-center gap-1">
                  <User size={12} /> {formData.contact_person}
                </p>
              )}
              <p className="text-[12.5px] text-[#9A917D] mt-1 flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  {formData.address_line_1 || "Address line 1"}
                  {formData.address_line_2 ? `, ${formData.address_line_2}` : ""}
                </span>
              </p>

              <div className="mt-4 pt-4 border-t border-[#EFE9DC] space-y-2">
                <ReviewRow label="Landmark" value={formData.landmark} />
                <ReviewRow label="Location" value={locationLine} />
                <ReviewRow label="Postal code" value={formData.postal_code} />
                <ReviewRow
                  label="GPS"
                  value={
                    hasLocation
                      ? `${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}`
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E5DECF] bg-white p-4">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-2">Why we ask</p>
            <p className="text-[12.5px] text-[#6B6354] leading-relaxed">
              A verified address helps <span className="font-semibold text-[#1E2A23]">Prostayz</span> confirm your
              business faster and builds trust with guests browsing your listing.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddressPage;
