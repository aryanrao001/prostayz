import express from "express";
import { login, register } from "../../controller/vendor/auth.Controller.js";


const vendorRoutes = express.Router();

vendorRoutes.post("/register", register);

vendorRoutes.post("/login", login);

export default vendorRoutes;