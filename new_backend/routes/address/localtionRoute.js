import express from "express";
import { getCities, getCountries, getLocationHierarchy, getStates, saveVendorAddress } from "../../controller/address/locationController.js";
import { authenticateVendor } from "../../middleware/auth.middleWare.js";

const locationRoute= express.Router();

locationRoute.get("/countries", getCountries);

locationRoute.get("/states/:country_id", getStates);

locationRoute.get("/cities/:state_id", getCities);

locationRoute.get("/locations", getLocationHierarchy);

locationRoute.post("/address",authenticateVendor, saveVendorAddress);

export default locationRoute;