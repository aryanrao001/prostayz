import express from "express";
import { login, logout, verify } from "../../controller/admin/auth.Controller.js";
import { getVendorById, getVendorList, updateVendor } from "../../controller/admin/vendorController.js";
import { authenticateAdmin } from "../../middleware/auth.middleWare.js";
import { getPropertyDetails, getPropertyList, updateProperty } from "../../controller/admin/propertyController.js";
import { createAmenity, deleteAmenity, getAmenities, getAmenity, updateAmenity } from "../../controller/admin/amenityController.js";
import { createPropertyType, deletePropertyType, getPropertyType, getPropertyTypes, updatePropertyType } from "../../controller/admin/propertytypeController.js";
import { getUserDetails, getUserList, updateBasicUserDetails } from "../../controller/admin/userController.js";
import * as analytics from '../../controller/admin/dashboardController.js';

// import {
//     login,
//     verify,
//     logout,
// } from "../../controllers/admin/auth.controller.js";

const adminRouter = express.Router();

/* ============================================
   Authentication
============================================ */

adminRouter.post("/login", login);
adminRouter.get("/verify", verify);
adminRouter.post("/logout", logout);
adminRouter.get("/vendors",authenticateAdmin,getVendorList);
adminRouter.get("/vendors/:id",authenticateAdmin,getVendorById);
adminRouter.put("/vendors/:id", authenticateAdmin,updateVendor);
adminRouter.get("/properties", authenticateAdmin,getPropertyList);
adminRouter.get("/properties/:id", getPropertyDetails);
adminRouter.put("/properties/:id",authenticateAdmin, updateProperty);
adminRouter.post("/amenities", authenticateAdmin, createAmenity);
adminRouter.get("/amenities", authenticateAdmin, getAmenities);
adminRouter.get("/amenities/:id", authenticateAdmin, getAmenity);
adminRouter.put("/amenities/:id", authenticateAdmin, updateAmenity);
adminRouter.delete("/amenities/:id", authenticateAdmin, deleteAmenity);
adminRouter.post("/property-types", authenticateAdmin, createPropertyType);
adminRouter.get("/property-types", authenticateAdmin, getPropertyTypes);
adminRouter.get("/property-types/:id", authenticateAdmin, getPropertyType);
adminRouter.put("/property-types/:id", authenticateAdmin, updatePropertyType);
adminRouter.delete("/property-types/:id", authenticateAdmin, deletePropertyType);
adminRouter.get('/users', getUserList);
adminRouter.get('/users/:id', getUserDetails);
adminRouter.put('/users/:id', updateBasicUserDetails);




adminRouter.get('/dashboard', analytics.getDashboardOverview);

// Vendors
adminRouter.get('/dashboard/vendors', analytics.getVendorsReport);
adminRouter.get('/dashboard/vendors/:vendorId', analytics.getVendorDetails);

// Properties
adminRouter.get('/dashboard/properties', analytics.getPropertiesReport);
adminRouter.get('/dashboard/properties/:propertyId', analytics.getPropertyDetails);

// Bookings
adminRouter.get('/dashboard/bookings', analytics.getBookingsReport);
adminRouter.get('/dashboard/bookings/:bookingId', analytics.getBookingDetails);
adminRouter.get('/dashboard/cancellations', analytics.getCancellationReport);

// Users
adminRouter.get('/dashboard/users', analytics.getUsersReport);
adminRouter.get('/dashboard/users/:userId', analytics.getUserDetails);

// Charts
adminRouter.get('/dashboard/charts/trend', analytics.getBookingRevenueTrend);
adminRouter.get('/dashboard/charts/status-distribution', analytics.getStatusDistribution);
adminRouter.get('/dashboard/city-stats', analytics.getCityWiseStats);
adminRouter.get('/dashboard/top-performers', analytics.getTopPerformers);


export default adminRouter;