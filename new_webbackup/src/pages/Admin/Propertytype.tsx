import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Home,
  Building,
  Building2,
  Warehouse,
  Castle,
  Tent,
  Hotel,
  TreePine,
  Mountain,
  Waves,
  Landmark,
  Store,
  Palmtree,
  Ship,
  Sailboat,
  Bed,
  DoorOpen,
  KeyRound,
  Trees,
  Caravan,
  Sparkles,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS — shared with the rest of the vendor flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4   rust #B3452E
--------------------------------------------------------- */

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Curated icon set for property types (house, villa, barn/farm, cabin,
// beachfront, houseboat, etc.) — matches names stored in
// property_types.icon exactly, since they're real lucide-react export names.
const ICON_MAP: Record<string, any> = {
  Home,          // House
  Building,      // Apartment / flat
  Building2,     // Condo / high-rise
  Warehouse,     // Barn / farmhouse
  Castle,        // Castle / mansion / estate
  Tent,          // Camping / glamping
  Hotel,         // Hotel / resort
  TreePine,      // Cabin / lodge
  Mountain,      // Mountain retreat / chalet
  Waves,         // Beachfront / waterfront
  Landmark,      // Heritage / historic property
  Store,         // Guesthouse / shop-front stay
  Palmtree,      // Tropical villa / bungalow
  Ship,          // Houseboat
  Sailboat,      // Boathouse / marina stay
  Bed,           // Bed & breakfast
  DoorOpen,      // Studio / room
  KeyRound,      // Serviced apartment
  Trees,         // Cottage / countryside
  Caravan,       // RV / caravan / mobile home
};
const ICON_NAMES = Object.keys(ICON_MAP);

function PropertyTypeIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && ICON_MAP[icon]) || Sparkles;
  return <Icon size={18} className={className} />;
}

/* ---------------------------------------------------------
   Types
--------------------------------------------------------- */

type PropertyType = {
  id: number;
  name: string;
  icon: string | null;
  status: 0 | 1;
  created_at?: string;
  updated_at?: string;
};

type ListResponse = {
  success: boolean;
  total: number;
  propertyTypes: PropertyType[];
  message?: string;
};

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" },
];

/* ---------------------------------------------------------
   Add / edit drawer
--------------------------------------------------------- */

type DrawerProps = {
  mode: "create" | "edit";
  initial: PropertyType | null;
  onClose: () => void;
  onSaved: (propertyType: PropertyType, mode: "create" | "edit") => void;
};

function PropertyTypeDrawer({ mode, initial, onClose, onSaved }: DrawerProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState<string>(initial?.icon ?? ICON_NAMES[0]);
  const [status, setStatus] = useState<boolean>(initial ? !!initial.status : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        const { data } = await axios.post(
          `${backendUrl}/api/admin/property-types`,
          { name: name.trim(), icon, status },
          { withCredentials: true }
        );
        if (!data.success) throw new Error(data.message || "Could not create property type");
        onSaved(data.propertyType, "create");
      } else if (initial) {
        const { data } = await axios.put(
          `${backendUrl}/api/admin/property-types/${initial.id}`,
          { name: name.trim(), icon, status },
          { withCredentials: true }
        );
        if (!data.success) throw new Error(data.message || "Could not update property type");
        onSaved(data.propertyType, "edit");
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#1E2A23]/40 backdrop-blur-[1px]" onClick={saving ? undefined : onClose} />

      <div className="relative w-full max-w-sm h-full bg-[#F5F2EA] border-l border-[#E5DECF] shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
        <style>{`
          @keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        `}</style>

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DECF] bg-white/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D] mb-0.5">
              {mode === "create" ? "New property type" : "Edit property type"}
            </p>
            <h3 className="font-display text-[19px] text-[#1E2A23]">
              {mode === "create" ? "Add property type" : initial?.name}
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

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-1.5">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Villa"
              className="w-full rounded-lg border border-[#DBD3C4] bg-white px-3 py-2.5 text-[13px] text-[#1E2A23] placeholder:text-[#B3AB99] outline-none focus:border-[#C99A3D] transition"
            />
          </label>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A917D] mb-2">
              Icon
            </span>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                const active = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition ${
                      active
                        ? "border-[#C99A3D] bg-[#C99A3D]/10 text-[#C99A3D]"
                        : "border-[#DBD3C4] bg-white text-[#6B6354] hover:border-[#C99A3D]/50"
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#E5DECF] bg-white px-3 py-2.5">
            <span className="text-[13px] font-medium text-[#1E2A23]">Active</span>
            <button
              onClick={() => setStatus((v) => !v)}
              className={`w-11 h-6 rounded-full transition relative ${status ? "bg-[#2F6F62]" : "bg-[#DBD3C4]"}`}
              aria-pressed={status}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                  status ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-[12.5px] text-[#B3452E] bg-[#B3452E]/8 border border-[#B3452E]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

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
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#1E2A23] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#16201A] transition disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving…
              </>
            ) : mode === "create" ? (
              "Add property type"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Delete confirmation
--------------------------------------------------------- */

function DeleteConfirm({
  propertyType,
  onCancel,
  onConfirm,
  deleting,
  error,
}: {
  propertyType: PropertyType;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E2A23]/40 backdrop-blur-[1px]" onClick={deleting ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[#E5DECF] bg-[#F5F2EA] shadow-2xl p-6">
        <h3 className="font-display text-[18px] text-[#1E2A23] mb-2">Delete "{propertyType.name}"?</h3>
        <p className="text-[13px] text-[#6B6354] mb-4 leading-relaxed">
          This can't be undone. If properties currently use this type, deletion will be blocked — mark it inactive instead.
        </p>
        {error && (
          <p className="text-[12.5px] text-[#B3452E] bg-[#B3452E]/8 border border-[#B3452E]/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-[#DBD3C4] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#4A4438] hover:border-[#C99A3D] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-[#B3452E] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#9A3B27] transition disabled:opacity-70"
          >
            {deleting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Property type card
--------------------------------------------------------- */

function PropertyTypeCard({
  propertyType,
  onEdit,
  onDelete,
  onToggle,
  toggling,
}: {
  propertyType: PropertyType;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const active = !!propertyType.status;
  return (
    <div className="rounded-xl border border-[#E5DECF] bg-white/70 p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          active ? "bg-[#2F6F62]/10 text-[#2F6F62]" : "bg-[#9A917D]/10 text-[#9A917D]"
        }`}
      >
        <PropertyTypeIcon icon={propertyType.icon} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-[#1E2A23] truncate">{propertyType.name}</p>
        <p className={`text-[11px] font-medium ${active ? "text-[#2F6F62]" : "text-[#9A917D]"}`}>
          {active ? "Active" : "Inactive"}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onToggle}
          disabled={toggling}
          aria-label={active ? "Deactivate" : "Activate"}
          className={`w-9 h-5 rounded-full transition relative disabled:opacity-50 ${
            active ? "bg-[#2F6F62]" : "bg-[#DBD3C4]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${
              active ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
        <button
          onClick={onEdit}
          aria-label={`Edit ${propertyType.name}`}
          className="w-8 h-8 rounded-lg border border-[#DBD3C4] bg-white flex items-center justify-center hover:border-[#C99A3D] hover:text-[#C99A3D] transition text-[#6B6354]"
        >
          <Pencil size={12.5} />
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${propertyType.name}`}
          className="w-8 h-8 rounded-lg border border-[#DBD3C4] bg-white flex items-center justify-center hover:border-[#B3452E] hover:text-[#B3452E] transition text-[#6B6354]"
        >
          <Trash2 size={12.5} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main
--------------------------------------------------------- */

const Propertytype = () => {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; propertyType: PropertyType | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPropertyTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<ListResponse>(`${backendUrl}/api/admin/property-types`, {
        params: { search, status },
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message || "Could not load property types");
      setPropertyTypes(data.propertyTypes);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Could not load property types");
      setPropertyTypes([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  const handleToggle = async (propertyType: PropertyType) => {
    setTogglingId(propertyType.id);
    const nextStatus = propertyType.status ? 0 : 1;
    setPropertyTypes((prev) =>
      prev.map((p) => (p.id === propertyType.id ? { ...p, status: nextStatus } : p))
    );
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/property-types/${propertyType.id}`,
        { status: !!nextStatus },
        { withCredentials: true }
      );
      if (!data.success) throw new Error(data.message || "Could not update property type");
    } catch (err) {
      // revert on failure
      setPropertyTypes((prev) =>
        prev.map((p) => (p.id === propertyType.id ? { ...p, status: propertyType.status } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/property-types/${deleteTarget.id}`, {
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message || "Could not delete property type");
      setPropertyTypes((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || err.message || "Could not delete property type");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D] mb-1">
            {propertyTypes.length} total
          </p>
          <h2 className="font-display text-[24px] text-[#1E2A23]">Property Types</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3AB99]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search property types…"
              className="w-full sm:w-56 rounded-lg border border-[#DBD3C4] bg-white pl-9 pr-8 py-2.5 text-[13px] text-[#1E2A23] placeholder:text-[#B3AB99] outline-none focus:border-[#C99A3D] transition"
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
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none rounded-lg border border-[#DBD3C4] bg-white pl-8 pr-8 py-2.5 text-[13px] text-[#1E2A23] outline-none focus:border-[#C99A3D] transition cursor-pointer"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDrawer({ mode: "create", propertyType: null })}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#1E2A23] text-white text-[13px] font-semibold px-4 py-2.5 hover:bg-[#16201A] transition"
          >
            <Plus size={15} /> Add property type
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[68px] rounded-xl bg-[#EAE4D6] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-[#B3452E]/25 bg-[#B3452E]/8 p-8 text-center">
          <p className="text-[13px] text-[#B3452E] mb-3">{error}</p>
          <button
            onClick={fetchPropertyTypes}
            className="rounded-lg bg-[#1E2A23] text-white text-[12.5px] font-semibold px-4 py-2 hover:bg-[#16201A] transition"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && propertyTypes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DBD3C4] bg-white/40 flex flex-col items-center justify-center py-20 text-center">
          <Home size={26} className="text-[#B3AB99] mb-3" />
          <p className="text-[13.5px] font-medium text-[#1E2A23] mb-1">No property types found</p>
          <p className="text-[12px] text-[#9A917D] mb-4">
            {search || status ? "Try a different search or filter." : "Add your first property type to get started."}
          </p>
          {!search && !status && (
            <button
              onClick={() => setDrawer({ mode: "create", propertyType: null })}
              className="flex items-center gap-2 rounded-lg bg-[#1E2A23] text-white text-[13px] font-semibold px-4 py-2.5 hover:bg-[#16201A] transition"
            >
              <Plus size={15} /> Add property type
            </button>
          )}
        </div>
      )}

      {!loading && !error && propertyTypes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {propertyTypes.map((p) => (
            <PropertyTypeCard
              key={p.id}
              propertyType={p}
              toggling={togglingId === p.id}
              onToggle={() => handleToggle(p)}
              onEdit={() => setDrawer({ mode: "edit", propertyType: p })}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(p);
              }}
            />
          ))}
        </div>
      )}

      {drawer && (
        <PropertyTypeDrawer
          mode={drawer.mode}
          initial={drawer.propertyType}
          onClose={() => setDrawer(null)}
          onSaved={(propertyType, mode) => {
            if (!propertyType) return;
            setPropertyTypes((prev) =>
              mode === "create"
                ? [propertyType, ...prev]
                : prev.map((p) => (p.id === propertyType.id ? propertyType : p))
            );
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          propertyType={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default Propertytype;