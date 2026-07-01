


// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import PrivateRoute from '../components/PrivateRoute';
// import { Toaster } from 'react-hot-toast';

// // Pages
// import Login from './pages/Login';
// import Register from './pages/Register';
// import EntryPage from './pages/EntryPage';
// import VendorMain from './pages/Vendor/VendorMain';
// import AddressPage from './pages/Vendor/AddressPage';

// // Vendor Sub-pages (Import these)
// // import Dashboard from './pages/Vendor/Dashboard';
// // import Listings from './pages/Vendor/Listings';
// // import Profile from './pages/Vendor/Profile';

// const App = () => {
//   return (
//     <Router>
//       <Routes>
//         {/* Public Routes */}
//         <Route path="/" element={<EntryPage />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         {/* Nested Vendor Routes */}
//         <Route
//           path="/vendor/*"
//           element={
//             <PrivateRoute>
//               <VendorMain />
//             </PrivateRoute>
//           }
//         >
//           {/* These will render inside the <Outlet /> in VendorMain */}
//           <Route path="dashboard" element={<AddressPage/>} />

//           {/* <Route path="dashboard" element={<Dashboard />} />
//           <Route path="listings" element={<Listings />} />
//           <Route path="profile" element={<Profile />} /> */}
//         </Route>
//       </Routes>

//       <Toaster position="top-right" reverseOrder={false} />
//     </Router>
//   );
// };

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import EntryPage from './pages/EntryPage';
import VendorMain from './pages/Vendor/VendorMain';
import AddressPage from './pages/Vendor/AddressPage';
import CompleteListing from './pages/Vendor/CompleteListing';
// import AddressPage from './pages/Vendor/AddressPage';

// Vendor Sub-pages (Import these)
// import Dashboard from './pages/Vendor/Dashboard';
// import Listings from './pages/Vendor/Listings';
// import Profile from './pages/Vendor/Profile';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Nested Vendor Routes */}
        <Route
          path="/vendor/*"
          element={
            <PrivateRoute>
              <VendorMain />
            </PrivateRoute>
          }
        >
          <Route path="address" element={<AddressPage/>} />

          {/* <Route path="dashboard" element={<Dashboard />} /> */}
          {/* <Route path="listings" element={<Listings />} />
          <Route path="profile" element={<Profile />} /> */}
        </Route>
        <Route path="/vendor/address" element={<AddressPage />} />
        <Route path="/vendor/listing" element={<CompleteListing />} />



      </Routes>

      <Toaster position="top-right" reverseOrder={false} />
    </Router>
  );
};

export default App;