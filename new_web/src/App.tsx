import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Public Pages
import EntryPage from "./pages/EntryPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Setup Pages
import AddressPage from "./pages/Vendor/AddressPage";
import CompleteListing from "./pages/Vendor/CompleteListing";

// Dashboard
import VendorMain from "./pages/Vendor/VendorMain";

// Route Guards
import PrivateRoute from "./routes/PrivateRoute";
// import SetupRoute from "./routes/SetupRoute";
import Documents from "./pages/Vendor/Documents";
import SetupRoute from "./routes/Setuproute";
import Dashboard from "./pages/Vendor/Dashboard";
import Hotels from "./pages/Vendor/hotels";
import ListingDetails from "./pages/Vendor/ListingDetails";
import Booking from "./pages/Vendor/Booking";

// Dashboard Pages
// import Dashboard from "./pages/Vendor/Dashboard";
// import Bookings from "./pages/Vendor/Bookings";
// import Profile from "./pages/Vendor/Profile";

const App = () => {
  return (
    <Router>

      <Routes>

        {/* Public */}

        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Setup */}

        <Route element={<PrivateRoute />}>
          <Route element={<SetupRoute/>}>
            <Route path="/vendor/setup/address" element={<AddressPage />} />
            <Route path="/vendor/setup/listing" element={<CompleteListing />} />
            {/* <Route path="/vendor/setup/documents" element={<Documents />} /> */}
          </Route>
        </Route>

        {/* Dashboard */}

        <Route element={<PrivateRoute />}>
          <Route path="/vendor" element={<VendorMain />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hotels" element={<Hotels/>} />
            <Route path="newlist" element={<CompleteListing/>} />
            <Route path="listingdetails/:id" element={<ListingDetails/>} />
            <Route path="bookings" element={<Booking/>} />
            {/* <Route path="bookings" element={<Bookings />} />
            <Route path="rooms" element={<Rooms />} /> */}
          </Route>
        </Route>

      </Routes>

      <Toaster position="top-right" />

    </Router>
  );
};

export default App;