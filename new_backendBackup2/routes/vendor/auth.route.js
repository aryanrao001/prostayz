import express from "express";
import { verifyVendor, login, register, checkVendorSetup, getPropertyDetails, getVendorProperties, logout } from "../../controller/vendor/auth.Controller.js";
import {  authenticateVendor } from "../../middleware/auth.middleWare.js";


const vendorRoutes = express.Router();

vendorRoutes.post("/register", register);
vendorRoutes.post("/login", login);
vendorRoutes.get("/verify", authenticateVendor, verifyVendor);
vendorRoutes.get("/setup-status", authenticateVendor, checkVendorSetup);

// Document upload/status endpoints now live at /api/vendor/documents/*
// (routes/vendor/documentRoutes.js) — the old route here had no auth
// middleware and pointed at a controller reading req.file instead of
// req.files, so it never worked. See documentRoutes.js.

vendorRoutes.get("/properties", authenticateVendor , getVendorProperties);
vendorRoutes.get("/property/:id", authenticateVendor ,getPropertyDetails);
vendorRoutes.post("/logout",logout);

export default vendorRoutes;