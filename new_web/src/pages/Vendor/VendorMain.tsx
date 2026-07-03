import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  MapPinned,
  Building2,
  CalendarCheck,
  Users,
  Star,
  Settings,
  Bell,
  UserCircle2,
  LogOut,
} from "lucide-react";

const VendorMain = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/vendor/dashboard",
    },
    {
      title: "Hotel Address",
      icon: MapPinned,
      path: "/vendor/address",
    },
    {
      title: "Hotels",
      icon: Building2,
      path: "/vendor/hotels",
    },
    {
      title: "Bookings",
      icon: CalendarCheck,
      path: "/vendor/bookings",
    },
    {
      title: "Customers",
      icon: Users,
      path: "/vendor/customers",
    },
    {
      title: "Reviews",
      icon: Star,
      path: "/vendor/reviews",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/vendor/settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside
        className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          {sidebarOpen && (
            <h2 className="text-xl font-bold text-amber-400">
              Hotel Vendor
            </h2>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? "bg-amber-400 text-slate-900 font-semibold"
                      : "hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={20} />

                {sidebarOpen && (
                  <span className="ml-4">
                    {item.title}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button className="flex w-full items-center justify-center rounded-xl bg-red-600 py-3 hover:bg-red-700 transition">
            <LogOut size={18} />

            {sidebarOpen && (
              <span className="ml-2">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">

        {/* Navbar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-8 shadow-sm">

          <h1 className="text-2xl font-bold text-slate-800">
            Vendor Dashboard
          </h1>

          <div className="flex items-center gap-6">

            <button className="relative">
              <Bell
                size={22}
                className="text-slate-600"
              />

              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
                <UserCircle2 size={22} />
              </div>

              <div>
                <h4 className="font-semibold text-slate-800">
                  John Doe
                </h4>

                <p className="text-sm text-gray-500">
                  Vendor
                </p>
              </div>

            </div>

          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default VendorMain;