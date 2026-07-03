import express from "express";
import { verifyVendor, login, register, checkVendorSetup, getPropertyDetails, getVendorProperties, logout } from "../../controller/vendor/auth.Controller.js";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { uploadVendorDocument } from "../../controller/vendor/DocumentController.js";
import upload from "../../middleware/upload.js";


const vendorRoutes = express.Router();

vendorRoutes.post("/register", register);
vendorRoutes.post("/login", login);
vendorRoutes.get("/verify", authenticateUser, verifyVendor);
vendorRoutes.get("/setup-status", authenticateUser, checkVendorSetup);

vendorRoutes.post("/document/upload",
    upload.fields([
        { name: "business_registration", maxCount: 1 },
        { name: "ownership_proof", maxCount: 1 },
        { name: "ubo", maxCount: 1 },
        { name: "pan_card", maxCount: 1 },
        { name: "gst_certificate", maxCount: 1 },
        { name: "government_id", maxCount: 1 },
    ]), uploadVendorDocument
)

vendorRoutes.get("/properties", authenticateUser, getVendorProperties);
vendorRoutes.get("/property/:id", authenticateUser,getPropertyDetails);
vendorRoutes.post("/logout",logout);

export default vendorRoutes;