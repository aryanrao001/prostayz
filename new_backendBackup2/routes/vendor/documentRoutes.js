import express from "express";
import { authenticateVendor } from "../../middleware/auth.middleWare.js";
import upload from "../../middleware/upload.js";
import { uploadVendorDocument, getMyDocuments } from "../../controller/vendor/DocumentController.js";

const documentRouter = express.Router();

// The previous route in auth.route.js had NO auth middleware at all — any
// unauthenticated request could attempt a document upload. Also fixed here:
// req.vendor.id is now guaranteed to exist because authenticateVendor runs first.
documentRouter.post(
    "/upload",
    authenticateVendor,
    upload.fields([
        { name: "business_registration", maxCount: 1 },
        { name: "ownership_proof", maxCount: 1 },
        { name: "ubo", maxCount: 1 },
        { name: "pan_card", maxCount: 1 },
        { name: "gst_certificate", maxCount: 1 },
        { name: "government_id", maxCount: 1 },
    ]),
    uploadVendorDocument
);

documentRouter.get("/mine", authenticateVendor, getMyDocuments);

export default documentRouter;
