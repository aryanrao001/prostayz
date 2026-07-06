import express from "express";
import { login, logout, verify } from "../../controller/admin/auth.Controller.js";
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

export default adminRouter;