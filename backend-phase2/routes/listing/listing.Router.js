import express from "express";
import { authenticateVendor } from "../../middleware/auth.middleWare.js";
import { getIncompleteListing, publishListing, saveAmenities, saveBasicInformation, saveLocation, savePoliciesAndRules, savePropertyImages, saveRooms } from "../../controller/listing/listing.controller.js";
import uploadPropertyImages from "../../middleware/uploadPropertyImages.js";
import roomUpload from "../../middleware/roomUpload.js";

const listingRouter = express.Router();

listingRouter.get("/continue-listing",authenticateVendor , getIncompleteListing);
listingRouter.post("/basic-information", authenticateVendor, saveBasicInformation);
listingRouter.post("/location", authenticateVendor, saveLocation);
listingRouter.post("/photos", authenticateVendor, uploadPropertyImages.array("images", 5), savePropertyImages);
listingRouter.post("/amenities", authenticateVendor, saveAmenities);
listingRouter.post("/policies", authenticateVendor, savePoliciesAndRules);
listingRouter.post("/rooms", authenticateVendor, roomUpload, saveRooms);
listingRouter.post("/publish", authenticateVendor ,publishListing);

export default listingRouter;