import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Home,
  CalendarCheck,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  ImagePlus,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

/* ---------------------------------------------------------
   TOKENS — shared with the rest of the vendor flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/vendor/dashboard", isSoon: false },
  { title: "Listings", icon: Home, path: "/vendor/hotels", isSoon: false },
  { title: "Bookings", icon: CalendarCheck, path: "/vendor/bookings", isSoon: false },
  { title: "Settings", icon: Settings, path: "/vendor/settings", isSoon: true },
];

function ProstayzMark() {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-9 h-9 rounded-xl border border-dashed border-[#C99A3D]/60 bg-[#C99A3D]/10 flex items-center justify-center flex-shrink-0"
        aria-label="Prostayz logo"
      >
        <ImagePlus size={15} className="text-[#C99A3D]" />
      </div>
      <span className="font-display text-[19px] text-[#1E2A23] tracking-tight truncate">
        Prostayz
      </span>
    </div>
  );
}

function SidebarNavItem({ icon: Icon, title, path, isSoon }: { icon: LucideIcon; title: string; path: string; isSoon?: boolean }) {
  if (isSoon) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[#4A4438]/50 cursor-not-allowed select-none">
        <Icon size={16} className="text-[#9A917D]/50" />
        <span className="flex-1 truncate">{title}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C99A3D]/10 text-[#C99A3D] border border-[#C99A3D]/20 scale-95 origin-right">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition ${
          isActive ? "bg-[#1E2A23] text-white" : "text-[#4A4438] hover:bg-[#EAE4D6]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? "text-white/80" : "text-[#9A917D]"} />
          <span className="flex-1 truncate">{title}</span>
        </>
      )}
    </NavLink>
  );
}

const VendorMain = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { vendor } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const activeItem = NAV_ITEMS.find((item) =>
    window.location.pathname.startsWith(item.path)
  );

  const handleLogout = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/vendor/logout`,
        {},
        { withCredentials: true }
      );
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/login");
    }
  };

  const initials =
    vendor?.first_name
      ?.split(" ")
      .map((name: string) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "V";

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#F5F2EA", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* ---------- SIDEBAR ---------- */}
      <aside className="w-64 flex-shrink-0 border-r border-[#E5DECF] bg-white/60 p-5 flex flex-col sticky top-0 h-screen">
        <div className="px-1 mb-8">
          <ProstayzMark />
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem 
              key={item.path} 
              icon={item.icon} 
              title={item.title} 
              path={item.path} 
              isSoon={item.isSoon} 
            />
          ))}
        </nav>

        <button
          onClick={() => navigate("/vendor/newlist")}
          className="w-full flex items-center justify-center gap-2 bg-[#1E2A23] text-white text-[13px] font-semibold py-2.5 rounded-lg hover:bg-[#16201A] transition mb-4"
        >
          <Plus size={15} /> New property
        </button>

        <div className="flex items-center gap-2.5 border-t border-[#EFE9DC] pt-4 px-1">
          <span className="w-8 h-8 rounded-full bg-[#2F6F62]/10 text-[#2F6F62] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-[#1E2A23] truncate">
              {vendor?.business_name || "Your business"}
            </p>
            <p className="text-[11px] text-[#9A917D] truncate">
              {vendor?.first_name} {vendor?.last_name}
            </p>
          </div>
          <button onClick={handleLogout} aria-label="Log out" className="flex-shrink-0">
            <LogOut size={14} className="text-[#B3AB99] hover:text-[#B3452E] transition" />
          </button>
        </div>
      </aside>

      {/* ---------- MAIN ---------- */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Navbar */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-[#E5DECF] bg-white/80 backdrop-blur px-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3D]">
              Vendor Panel
            </p>
            <h1 className="font-display text-[19px] leading-tight text-[#1E2A23]">
              {activeItem?.title ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative w-10 h-10 rounded-full border border-[#E5DECF] bg-white flex items-center justify-center hover:border-[#C99A3D] transition"
              aria-label="Notifications"
            >
              <Bell size={17} className="text-[#6B6354]" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#C99A3D] ring-2 ring-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-[#E5DECF] bg-white pl-1.5 pr-3 py-1.5 hover:border-[#C99A3D] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#2F6F62] text-white flex items-center justify-center text-[12.5px] font-semibold">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[12.5px] font-semibold text-[#1E2A23] leading-tight">
                    {vendor?.first_name || "Vendor"}
                  </p>
                  <p className="text-[11px] text-[#9A917D] leading-tight">Vendor</p>
                </div>
                <ChevronDown size={14} className="text-[#B3AB99] flex-shrink-0" />
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#E5DECF] bg-white shadow-lg overflow-hidden z-20">
                    {/* Settings Dropdown Item with Disabled State logic */}
                    <div className="flex items-center justify-between px-4 py-2.5 text-[13px] text-[#1E2A23]/50 cursor-not-allowed select-none">
                      <div className="flex items-center gap-2.5">
                        <Settings size={14} className="text-[#9A917D]/50" />
                        Settings
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C99A3D]/10 text-[#C99A3D] border border-[#C99A3D]/20">
                        Soon
                      </span>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#B3452E] hover:bg-[#B3452E]/8 transition border-t border-gray-100"
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorMain;