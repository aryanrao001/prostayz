import express from "express";
import { authenticateUser } from "../../middleware/auth.middleWare.js";
import { getIncompleteListing, saveAmenities, saveBasicInformation, saveLocation, savePoliciesAndRules, savePropertyImages } from "../../controller/listing/listing.controller.js";
import uploadPropertyImages from "../../middleware/uploadPropertyImages.js";

const listingRouter = express.Router();

listingRouter.get("/continue-listing",authenticateUser , getIncompleteListing);
listingRouter.post("/basic-information", authenticateUser, saveBasicInformation);
listingRouter.post("/location",saveLocation);
listingRouter.post("/photos", uploadPropertyImages.array("images", 5),savePropertyImages);
listingRouter.post("/amenities", saveAmenities);
listingRouter.post("/policies", savePoliciesAndRules);

export default listingRouter;