
import express from "express";
import { addWishlist, login, register, verifyMe ,getWishlist } from "../../controller/user/authcontroller.js";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { getProperties, getPropertyBySlug } from "../../controller/user/properties.controller.js";
// import { register } from "../controllers/user.controller.js";

const userRoutes = express.Router();
userRoutes.post("/register", register);
userRoutes.post("/login",login);
userRoutes.get("/verify/me",authenticateUser,verifyMe)
userRoutes.get("/properties",getProperties);
// Specific path before the slug catch-all so it isn't swallowed by :slug
userRoutes.get("/properties/:slug",getPropertyBySlug);
userRoutes.post("/wishlist",authenticateUser,addWishlist);
userRoutes.get("/getwishlist",authenticateUser,getWishlist)

export default userRoutes;