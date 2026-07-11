
import express from "express";
import { login, register, verifyMe } from "../../controller/user/authcontroller.js";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { getProperties } from "../../controller/user/properties.controller.js";
// import { register } from "../controllers/user.controller.js";

const userRoutes = express.Router();
userRoutes.post("/register", register);
userRoutes.post("/login",login);
userRoutes.get("/verify/me",authenticateUser,verifyMe)
userRoutes.get("/properties",getProperties);
export default userRoutes;