import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Home,
  CalendarCheck,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

/* ---------------------------------------------------------
   TOKENS — shared with the rest of the vendor flow
   canvas  #F5F2EA   ink #1E2A23   pine #2F6F62   brass #C99A3D
   line    #DBD3C4
--------------------------------------------------------- */

// Only the essentials a vendor needs day-to-day
const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/vendor/dashboard" },
  { title: "Listings", icon: Home, path: "/vendor/hotels" },
  { title: "Bookings", icon: CalendarCheck, path: "/vendor/bookings" },
];

function ProstayzMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {/* Logo slot — swap this div for an <img src="/logo.svg" /> when ready */}
      <div
        className="w-9 h-9 rounded-xl border border-dashed border-[#C99A3D]/60 bg-[#C99A3D]/10 flex items-center justify-center flex-shrink-0"
        aria-label="Prostayz logo"
      >
        <ImagePlus size={15} className="text-[#C99A3D]" />
      </div>
      {!compact && (
        <span className="font-display text-[19px] text-white tracking-tight truncate">
          Prostayz
        </span>
      )}
    </div>
  );
}

const VendorMain = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { vendor } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;


  const activeItem = NAV_ITEMS.find((item) =>
    window.location.pathname.startsWith(item.path)
  );

  // Inside your VendorMain component:

  const handleLogout = async () => {
    try {
      // 1. Hit the backend to destroy the session/token
      // Assuming you have an API route for logout
      await axios.post(`${backendUrl}/api/vendor/logout`, {}, {
        withCredentials: true // Essential to send the session cookie
      });

      // 2. Clear local auth state if you have one (e.g., from your AuthContext)
      // logout(); // Uncomment if your context provides a logout method

      // 3. Redirect to login
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Optional: Still navigate to login if the backend call fails, 
      // as the session might be already invalid
      navigate("/login");
    }
  };

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
      <aside
        className={`sticky top-0 h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-64" : "w-[76px]"
          }`}
        style={{ background: "#1E2A23" }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-5 border-b border-white/10">
          <ProstayzMark compact={!sidebarOpen} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>

        {sidebarOpen && (
          <p className="px-5 pt-5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Menu
          </p>
        )}

        <nav className={`flex-1 space-y-1 ${sidebarOpen ? "px-3" : "px-2.5"} ${sidebarOpen ? "" : "pt-5"}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.title : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${sidebarOpen ? "" : "justify-center"
                  } ${isActive
                    ? "bg-[#C99A3D] text-[#1E2A23] font-semibold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {/* <NavLink
            to="/vendor/settings"
            title={!sidebarOpen ? "Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
                sidebarOpen ? "" : "justify-center"
              } ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Settings size={17} className="flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink> */}

          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Log out" : undefined}
            className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#E8A190] hover:bg-[#B3452E]/20 transition ${sidebarOpen ? "" : "justify-center"
              }`}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {sidebarOpen && <span>Log out</span>}
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

                  {vendor?.first_name
                    ?.split(" ")
                    .map(name => name[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "V"}

                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[12.5px] font-semibold text-[#1E2A23] leading-tight">{vendor.first_name}</p>
                  <p className="text-[11px] text-[#9A917D] leading-tight">Vendor</p>
                </div>
                <ChevronDown size={14} className="text-[#B3AB99] flex-shrink-0" />
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#E5DECF] bg-white shadow-lg overflow-hidden z-20">
                    {/* <NavLink
                      to="/vendor/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1E2A23] hover:bg-[#F5F2EA] transition"
                    >
                      <Settings size={14} className="text-[#9A917D]" />
                      Settings
                    </NavLink> */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#B3452E] hover:bg-[#B3452E]/8 transition"
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