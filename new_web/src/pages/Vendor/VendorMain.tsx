import React, { useState } from "react";
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
      icon: <LayoutDashboard size={20} />,
      path: "/vendor/dashboard",
    },
    {
      title: "Hotel Address",
      icon: <MapPinned size={20} />,
      path: "/vendor/address",
    },
    {
      title: "Hotels",
      icon: <Building2 size={20} />,
      path: "/vendor/hotels",
    },
    {
      title: "Bookings",
      icon: <CalendarCheck size={20} />,
      path: "/vendor/bookings",
    },
    {
      title: "Customers",
      icon: <Users size={20} />,
      path: "/vendor/customers",
    },
    {
      title: "Reviews",
      icon: <Star size={20} />,
      path: "/vendor/reviews",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/vendor/settings",
    },
  ];

  return (
    <div className="d-flex vh-100 bg-light">

      {/* Sidebar */}
      <aside
        className={`bg-dark text-white d-flex flex-column ${sidebarOpen ? "p-3" : "p-2"
          }`}
        style={{
          width: sidebarOpen ? "250px" : "75px",
          transition: "0.3s",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          {sidebarOpen && (
            <h4 className="fw-bold m-0 text-warning">
              Hotel Vendor
            </h4>
          )}

          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-grow-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `d-flex align-items-center text-decoration-none mb-2 rounded px-3 py-2 ${isActive
                  ? "bg-warning text-dark"
                  : "text-white"
                }`
              }
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>

              {sidebarOpen && (
                <span className="ms-3">{item.title}</span>
              )}
            </NavLink>
          ))}
        </div>

        <button className="btn btn-danger w-100 mt-3">
          <LogOut size={18} className="me-2" />
          {sidebarOpen && "Logout"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column">

        {/* Top Navbar */}
        <header
          className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center"
        >
          <h4 className="fw-bold m-0">
            Vendor Dashboard
          </h4>

          <div className="d-flex align-items-center gap-4">

            <Bell size={22} />

            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                }}
              >
                <UserCircle2 size={22} />
              </div>

              <div className="ms-2">
                <div className="fw-semibold">
                  John Doe
                </div>

                <small className="text-muted">
                  Vendor
                </small>
              </div>
            </div>

          </div>
        </header>

        {/* Content */}
        <main
          className="p-4"
          style={{
            overflowY: "auto",
            flex: 1,
          }}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default VendorMain;