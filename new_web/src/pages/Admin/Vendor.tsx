// import { useEffect, useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";

// interface Vendor {
//   id: number;
//   vendor_name: string;
//   business_name: string;
//   email: string;
//   phone: string;
//   profile_image: string | null;
//   city: string | null;
//   state: string | null;
//   country: string | null;
//   status: "active" | "pending" | "blocked";
//   total_properties: number;
//   draft_properties: number;
//   pending_properties: number;
//   approved_properties: number;
//   completed_listings: number;
//   total_rooms: number;
//   created_at: string;
// }

// const Vendor = () => {
//   const backendUrl = import.meta.env.VITE_BACKEND_URL;

//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalRecords, setTotalRecords] = useState(0);

//   const getVendors = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${backendUrl}/api/admin/vendors`, {
//         params: {
//           page,
//           limit: 10,
//           search,
//           status,
//         },
//         withCredentials: true,
//       });
//       if (response.data.success) {
//         setVendors(response.data.vendors);
//         setTotalPages(response.data.total_pages);
//         setTotalRecords(response.data.total);
//       }
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Unable to fetch vendors.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     getVendors();
//   }, [page, search, status]);

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearch(e.target.value);
//     setPage(1);
//   };

//   const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setStatus(e.target.value);
//     setPage(1);
//   };

//   const refreshVendors = () => {
//     getVendors();
//   };

//   const nextPage = () => {
//     if (page < totalPages) {
//       setPage(page + 1);
//     }
//   };
//   const previousPage = () => {
//     if (page > 1) {
//       setPage(page - 1);
//     }
//   };

//   const getInitials = (name: string) => {
//     return name
//       .split(" ")
//       .map((word) => word[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "active":
//         return "bg-green-100 text-green-700";
//       case "pending":
//         return "bg-yellow-100 text-yellow-700";
//       case "blocked":
//         return "bg-red-100 text-red-700";
//       default:
//         return "bg-gray-100 text-gray-600";
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}

//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>

//           <p className="text-gray-500 mt-1">Manage all registered vendors</p>
//         </div>

//         <div className="bg-indigo-600 text-white px-5 py-3 rounded-xl shadow">
//           Total Vendors
//           <div className="text-2xl font-bold">{totalRecords}</div>
//         </div>
//       </div>

//       {/* Search */}

//       <div className="bg-white rounded-2xl shadow-sm border p-5">
//         <div className="grid md:grid-cols-3 gap-4">
//           <input
//             value={search}
//             onChange={handleSearch}
//             placeholder="Search vendor..."
//             className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
//           />

//           <select
//             value={status}
//             onChange={handleStatus}
//             className="border rounded-xl px-4 py-3"
//           >
//             <option value="">All Status</option>

//             <option value="active">Active</option>

//             <option value="pending">Pending</option>

//             <option value="blocked">Blocked</option>
//           </select>

//           <button
//             onClick={refreshVendors}
//             className="bg-indigo-600 text-white rounded-xl"
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Table */}

//       <div className="overflow-hidden rounded-2xl bg-white shadow border">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="text-left px-6 py-4">Vendor</th>

//               <th>Properties</th>

//               <th>Rooms</th>

//               <th>Listings</th>

//               <th>Status</th>

//               <th>Action</th>
//             </tr>
//           </thead>

//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-20">
//                   Loading...
//                 </td>
//               </tr>
//             ) : vendors.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-20 text-gray-500">
//                   No Vendors Found
//                 </td>
//               </tr>
//             ) : (
//               vendors.map((vendor) => (
//                 <tr key={vendor.id} className="border-t hover:bg-gray-50">
//                   <td className="px-6 py-5">
//                     <div className="flex items-center gap-4">
//                       {vendor.profile_image ? (
//                         <img
//                           src={`${backendUrl}/uploads/vendors/${vendor.profile_image}`}
//                           className="w-14 h-14 rounded-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
//                           {getInitials(vendor.vendor_name)}
//                         </div>
//                       )}

//                       <div>
//                         <h3 className="font-semibold">{vendor.vendor_name}</h3>

//                         <p className="text-sm text-gray-500">
//                           {vendor.business_name}
//                         </p>

//                         <p className="text-sm">{vendor.email}</p>

//                         <p className="text-sm">{vendor.phone}</p>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="text-center">
//                     <div className="font-bold">{vendor.total_properties}</div>
//                   </td>

//                   <td className="text-center">
//                     <div className="font-bold">{vendor.total_rooms}</div>
//                   </td>

//                   <td>
//                     <div className="space-y-1 text-sm">
//                       <div>Draft :{vendor.draft_properties}</div>

//                       <div>Pending :{vendor.pending_properties}</div>

//                       <div>Approved :{vendor.approved_properties}</div>
//                     </div>
//                   </td>

//                   <td>
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vendor.status)}`}
//                     >
//                       {vendor.status}
//                     </span>
//                   </td>

//                   <td>
//                     <div className="flex gap-2">
//                       <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
//                         View
//                       </button>

//                       <button className="px-4 py-2 bg-gray-100 rounded-lg">
//                         Edit
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}

//       <div className="flex justify-between items-center">
//         <button
//           onClick={previousPage}
//           disabled={page === 1}
//           className="px-5 py-2 rounded-lg border"
//         >
//           Previous
//         </button>

//         <span>
//           Page {page} of {totalPages}
//         </span>

//         <button
//           onClick={nextPage}
//           disabled={page === totalPages}
//           className="px-5 py-2 rounded-lg border"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Vendor;

import { useEffect, useState, useCallback, type ReactNode } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  BedDouble,
  X,
  Pencil,
  Loader2,
  Check,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS — shared with the rest of the vendor flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4   rust #B3452E
--------------------------------------------------------- */

type VendorRow = {
  id: number;
  vendor_name: string;
  business_name: string | null;
  email: string | null;
  phone: string;
  profile_image: string | null;
  status: "pending" | "active" | "blocked";
  created_at: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  total_properties: number;
  draft_properties: number;
  pending_properties: number;
  approved_properties: number;
  completed_listings: number;
  total_rooms: number;
};

type ListResponse = {
  success: boolean;
  total: number;
  current_page: number;
  total_pages: number;
  vendors: VendorRow[];
  message?: string;
};

const STATUS_FILTERS = [
  { label: "All vendors", value: "" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Blocked", value: "blocked" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[#2F6F62]/10 text-[#2F6F62] border-[#2F6F62]/25",
  pending: "bg-[#C99A3D]/10 text-[#C99A3D] border-[#C99A3D]/25",
  blocked: "bg-[#B3452E]/10 text-[#B3452E] border-[#B3452E]/25",
};

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
        STATUS_STYLES[status] || "bg-[#EFE9DC] text-[#6B6354] border-[#DBD3C4]"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function ListingBreakdown({ row }: { row: VendorRow }) {
  if (!row.total_properties) {
    return <span className="text-[12px] text-[#9A917D]">No listings yet</span>;
  }
  const chips = [
    { label: "Approved", value: row.approved_properties, color: "#2F6F62" },
    { label: "Pending", value: row.pending_properties, color: "#C99A3D" },
    { label: "Draft", value: row.draft_properties, color: "#9A917D" },
  ].filter((c) => c.value > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span
          key={c.label}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A4438]"
          title={`${c.label}: ${c.value}`}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
          {c.value} {c.label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

type VendorDetail = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  country_code: string;
  business_name: string | null;
  gst_number: string | null;
  pan_number: string | null;
  status: "pending" | "active" | "blocked";
  profile_image: string | null;
};

type EditVendorDrawerProps = {
  vendorId: number;
  backendUrl: string;
  onClose: () => void;
  onSaved: (updated: {
    id: number;
    vendor_name: string;
    business_name: string | null;
    email: string | null;
    phone: string;
    status: string;
  }) => void;
};

function EditVendorDrawer({ vendorId, backendUrl, onClose, onSaved }: EditVendorDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<VendorDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/vendors/${vendorId}`, {
          withCredentials: true,
        });
        if (!data.success) throw new Error(data.message || "Could not load vendor");
        if (!cancelled) setForm(data.vendor);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err.message || "Could not load vendor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId, backendUrl]);

  const setField = (field: keyof VendorDetail, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const inputClass =
    "w-full rounded-lg border border-[#DBD3C4] bg-white px-3 py-2.5 text-[13px] text-[#1E2A23] outline-none focus:border-[#C99A3D] transition";

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/vendors/${vendorId}`,
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          country_code: form.country_code,
          business_name: form.business_name,
          gst_number: form.gst_number,
          pan_number: form.pan_number,
          status: form.status,
        },
        { withCredentials: true }
      );
      if (!data.success) throw new Error(data.message || "Could not save vendor");
      setSaved(true);
      onSaved({
        id: vendorId,
        vendor_name: data.vendor.vendor_name,
        business_name: data.vendor.business_name,
        email: data.vendor.email,
        phone: `${data.vendor.country_code} ${data.vendor.phone}`,
        status: data.vendor.status,
      });
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Could not save vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#1E2A23]/40 backdrop-blur-[1px]" onClick={saving ? undefined : onClose} />

      <div className="relative w-full max-w-md h-full bg-[#F5F2EA] border-l border-[#E5DECF] shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
        <style>{`
          @keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DECF] bg-white/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D] mb-0.5">
              Edit vendor
            </p>
            <h3 className="font-display text-[19px] text-[#1E2A23]">
              {form?.business_name || `${form?.first_name ?? ""} ${form?.last_name ?? ""}`.trim() || "Vendor"}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="w-9 h-9 rounded-full border border-[#E5DECF] bg-white flex items-center justify-center hover:border-[#C99A3D] transition disabled:opacity-50"
          >
            <X size={15} className="text-[#6B6354]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20 text-[#9A917D] gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Loading vendor…</span>
            </div>
          )}

          {!loading && error && !form && (
            <div className="text-center py-14">
              <p className="text-[13px] font-medium text-[#B3452E]">{error}</p>
            </div>
          )}

          {!loading && form && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <input
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Business name">
                <input
                  value={form.business_name ?? ""}
                  onChange={(e) => setField("business_name", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Hotel Dev Palace"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setField("email", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-[88px_1fr] gap-3">
                <Field label="Code">
                  <input
                    value={form.country_code}
                    onChange={(e) => setField("country_code", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="GST number">
                  <input
                    value={form.gst_number ?? ""}
                    onChange={(e) => setField("gst_number", e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="PAN number">
                  <input
                    value={form.pan_number ?? ""}
                    onChange={(e) => setField("pan_number", e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <Field label="Account status">
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
              </Field>

              {error && (
                <p className="text-[12.5px] text-[#B3452E] bg-[#B3452E]/8 border border-[#B3452E]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && form && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5DECF] bg-white/60">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#DBD3C4] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#4A4438] hover:border-[#C99A3D] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 rounded-lg bg-[#1E2A23] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#16201A] transition disabled:opacity-70"
            >
              {saved ? (
                <>
                  <Check size={14} /> Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b border-[#EFE9DC] last:border-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 rounded bg-[#EAE4D6] animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

const Vendor = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [rows, setRows] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const limit = 10;

  // debounce search input -> search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<ListResponse>(`${backendUrl}/api/admin/vendors`, {
        params: { page, limit, search, status },
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message || "Could not load vendors");
      setRows(data.vendors);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Could not load vendors");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, page, search, status]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D] mb-1">
            {total} total
          </p>
          <h2 className="font-display text-[24px] text-[#1E2A23]">Vendors</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, business, email, phone…"
              className="w-full sm:w-72 rounded-lg border border-[#DBD3C4] bg-white pl-9 pr-8 py-2.5 text-[13px] text-[#1E2A23] placeholder:text-[#B3AB99] outline-none focus:border-[#C99A3D] transition"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B3AB99] hover:text-[#6B6354]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3AB99] pointer-events-none"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-lg border border-[#DBD3C4] bg-white pl-8 pr-8 py-2.5 text-[13px] text-[#1E2A23] outline-none focus:border-[#C99A3D] transition cursor-pointer"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-[#E5DECF] bg-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5DECF] bg-[#F5F2EA]/60">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Vendor
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Location
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Listings
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Rooms
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Joined
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D]">
                  Status
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] text-right">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-[13px] font-medium text-[#B3452E] mb-1">Couldn't load vendors</p>
                    <p className="text-[12px] text-[#9A917D] mb-4">{error}</p>
                    <button
                      onClick={fetchVendors}
                      className="rounded-lg bg-[#1E2A23] text-white text-[12.5px] font-semibold px-4 py-2 hover:bg-[#16201A] transition"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-[13px] font-medium text-[#1E2A23] mb-1">No vendors found</p>
                    <p className="text-[12px] text-[#9A917D]">
                      {search || status ? "Try a different search or filter." : "Vendors will show up here once they sign up."}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#EFE9DC] last:border-0 hover:bg-[#F5F2EA]/50 transition">
                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {row.profile_image ? (
                          <img
                            src={row.profile_image}
                            alt={row.vendor_name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-[#E5DECF]"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-[#2F6F62]/10 text-[#2F6F62] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                            {initialsOf(row.vendor_name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#1E2A23] truncate">
                            {row.business_name || row.vendor_name}
                          </p>
                          <p className="text-[11.5px] text-[#9A917D] truncate">
                            {row.email || row.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      {row.city ? (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#4A4438]">
                          <MapPin size={13} className="text-[#B3AB99] flex-shrink-0" />
                          <span className="truncate">
                            {row.city}
                            {row.state ? `, ${row.state}` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#B3AB99]">Not set</span>
                      )}
                    </td>

                    {/* Listings */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 size={13} className="text-[#9A917D]" />
                        <span className="font-mono-num text-[13px] text-[#1E2A23]">
                          {row.total_properties}
                        </span>
                      </div>
                      <ListingBreakdown row={row} />
                    </td>

                    {/* Rooms */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <BedDouble size={13} className="text-[#9A917D]" />
                        <span className="font-mono-num text-[13px] text-[#1E2A23]">
                          {row.total_rooms}
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <span className="text-[12.5px] text-[#4A4438]">{formatDate(row.created_at)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>

                    {/* Edit */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setEditingId(row.id)}
                        aria-label={`Edit ${row.business_name || row.vendor_name}`}
                        className="w-8 h-8 rounded-lg border border-[#DBD3C4] bg-white inline-flex items-center justify-center hover:border-[#C99A3D] hover:text-[#C99A3D] transition text-[#6B6354]"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E5DECF] bg-[#F5F2EA]/40 px-5 py-3.5">
            <p className="text-[12px] text-[#9A917D]">
              Showing <span className="font-semibold text-[#4A4438]">{showingFrom}–{showingTo}</span> of{" "}
              <span className="font-semibold text-[#4A4438]">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-[#DBD3C4] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#4A4438] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C99A3D] transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[12.5px] font-medium text-[#1E2A23] px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#DBD3C4] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#4A4438] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C99A3D] transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingId !== null && (
        <EditVendorDrawer
          vendorId={editingId}
          backendUrl={backendUrl}
          onClose={() => setEditingId(null)}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === updated.id
                  ? {
                      ...r,
                      vendor_name: updated.vendor_name,
                      business_name: updated.business_name,
                      email: updated.email,
                      phone: updated.phone,
                      status: updated.status as VendorRow["status"],
                    }
                  : r
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default Vendor;