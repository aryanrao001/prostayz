import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Home,
  Users,
  ShieldCheck,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Search,
  Ticket,
  TicketCheckIcon,
  User2Icon,
} from "lucide-react";
import axios from "axios";

// Admin-specific navigation
const ADMIN_NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { title: "Vendors", icon: Users, path: "/admin/vendors" },
  { title: "Property", icon: Home , path: "/admin/property" },
  { title: "Amenities", icon: ShieldCheck, path: "/admin/amenities" },
  { title: "Property Types", icon: Settings, path: "/admin/propertytype" },
  { title: "User ", icon: User2Icon, path: "/admin/user" },
  { title: "Bookings ", icon: Ticket, path: "/admin/bookings" },
  // { title: "Today Bookings ", icon: TicketCheckIcon, path: "/admin/todaybookings" },
];

function AdminSidebarNavItem({ icon: Icon, title, path }: { icon: LucideIcon; title: string; path: string }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition ${
          isActive 
            ? "bg-[#2F6F62] text-white shadow-sm" 
            : "text-[#4A4438] hover:bg-[#E5DECF]/50"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? "text-white" : "text-[#9A917D]"} />
          <span className="flex-1 truncate">{title}</span>
        </>
      )}
    </NavLink>
  );
}

const AdminMain = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/admin/logout`, {}, { withCredentials: true });
      navigate("/admin/login");
    } catch (err) {
      navigate("/admin/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F7F4] font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#E5DECF] bg-white p-5 flex flex-col">
        <div className="px-1 mb-8 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#1E2A23] flex items-center justify-center">
            <ShieldCheck size={18} className="text-[#F5F2EA]" />
          </div>
          <div>
            <span className="block font-display text-[17px] text-[#1E2A23]">Admin Portal</span>
            <span className="text-[10px] font-bold text-[#2F6F62] uppercase tracking-wider">Super User</span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminSidebarNavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Footer info */}
        <div className="border-t border-[#EFE9DC] pt-4 mt-4">
          <button onClick={handleLogout} className="flex items-center gap-3 text-[13px] text-[#B3452E] hover:text-red-700 transition">
            <LogOut size={16} /> Logout System
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[68px] border-b border-[#E5DECF] bg-white/50 backdrop-blur px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 text-[#9A917D]" size={16} />
            <input 
              placeholder="Search users, properties, or logs..." 
              className="w-full bg-[#EFE9DC]/30 border border-[#E5DECF] rounded-lg py-2 pl-10 pr-4 text-[13px] outline-none focus:border-[#2F6F62] transition"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#6B6354] hover:bg-[#E5DECF]/50 rounded-full">
              <Bell size={18} />
            </button>
            <div className="h-6 w-[1px] bg-[#E5DECF]" />
            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-[#2F6F62] text-white flex items-center justify-center text-[12px] font-bold">A</div>
              <ChevronDown size={14} className="text-[#9A917D]" />
            </button>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminMain;