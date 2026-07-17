import express from "express";
import { authenticateUser, authenticateVendor, authenticateAdmin } from "../../middleware/auth.middleWare.js";
import {
    createReview,
    getPropertyReviews,
    getReviewableBookings,
    getMyReviews,
    replyToReview,
    getAllReviewsAdmin,
    moderateReview,
    deleteReview,
} from "../../controller/review/reviewController.js";
import upload from "../../middleware/reviewUpload.js";

const reviewRouter = express.Router();

// -- User-facing --
reviewRouter.post("/create", authenticateUser, upload.array("photos", 3), createReview);
reviewRouter.get("/reviewable", authenticateUser, getReviewableBookings);
reviewRouter.get("/mine", authenticateUser, getMyReviews);

// -- Public (property details page) --
reviewRouter.get("/property/:propertyId", getPropertyReviews);

// -- Vendor-facing --
reviewRouter.post("/:id/reply", authenticateVendor, replyToReview);

// -- Admin-facing --
reviewRouter.get("/admin/all", authenticateAdmin, getAllReviewsAdmin);
reviewRouter.patch("/admin/:id/status", authenticateAdmin, moderateReview);
reviewRouter.delete("/admin/:id", authenticateAdmin, deleteReview);

export default reviewRouter;
