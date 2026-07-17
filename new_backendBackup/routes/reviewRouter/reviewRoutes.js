import express from "express";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { createReview } from "../../controller/review/reviewController.js";
import upload from "../../middleware/reviewUpload.js";


const reviewRouter = express.Router();
reviewRouter.post("/create", authenticateUser, upload.array("photos",3), createReview);
export default reviewRouter;