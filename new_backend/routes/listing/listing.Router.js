import express from "express";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { getIncompleteListing, publishListing, saveAmenities, saveBasicInformation, saveLocation, savePoliciesAndRules, savePropertyImages, saveRooms } from "../../controller/listing/listing.controller.js";
import uploadPropertyImages from "../../middleware/uploadPropertyImages.js";
import roomUpload from "../../middleware/roomUpload.js";

const listingRouter = express.Router();

listingRouter.get("/continue-listing",authenticateUser , getIncompleteListing);
listingRouter.post("/basic-information", authenticateUser, saveBasicInformation);
listingRouter.post("/location",saveLocation);
listingRouter.post("/photos", uploadPropertyImages.array("images", 5),savePropertyImages);
listingRouter.post("/amenities", saveAmenities);
listingRouter.post("/policies", savePoliciesAndRules);
listingRouter.post("/rooms",roomUpload, saveRooms);
listingRouter.post("/publish", authenticateUser ,publishListing);

export default listingRouter;