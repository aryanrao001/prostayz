import express from "express";
import { createPropertyType, deletePropertyType,  getAmenities,  getPropertyTypeById,  getPropertyTypes, updatePropertyType } from "../../controller/address/propertyType.Controller.js";

// import { verifyToken } from "../middleware/auth.js";
// import { isAdmin } from "../middleware/isAdmin.js";

const propertyTypeRoute = express.Router();

propertyTypeRoute.get("/amenities", getAmenities);

// Admin
propertyTypeRoute.post("/", /* verifyToken, isAdmin, */ createPropertyType);
propertyTypeRoute.put("/:id", /* verifyToken, isAdmin, */ updatePropertyType);
propertyTypeRoute.delete("/:id", /* verifyToken, isAdmin, */ deletePropertyType);

// Vendor/Admin
propertyTypeRoute.get("/", getPropertyTypes);
propertyTypeRoute.get("/:id", getPropertyTypeById);

export default propertyTypeRoute;