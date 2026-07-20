// import express from "express";
// import { authenticateVendor } from "../../middleware/auth.middleWare.js";
// import { getIncompleteListing, publishListing, saveAmenities, saveBasicInformation, saveLocation, savePoliciesAndRules, savePropertyImages, saveRooms } from "../../controller/listing/listing.controller.js";
// import uploadPropertyImages from "../../middleware/uploadPropertyImages.js";

// const listingRouter = express.Router();

// listingRouter.get("/continue-listing",authenticateVendor , getIncompleteListing);
// listingRouter.post("/basic-information", authenticateVendor, saveBasicInformation);
// listingRouter.post("/location", authenticateVendor, saveLocation);
// listingRouter.post("/photos", authenticateVendor, uploadPropertyImages.array("images", 5), savePropertyImages);
// listingRouter.post("/amenities", authenticateVendor, saveAmenities);
// listingRouter.post("/policies", authenticateVendor, savePoliciesAndRules);
// listingRouter.post("/rooms", authenticateVendor, saveRooms);
// listingRouter.post("/publish", authenticateVendor ,publishListing);

// export default listingRouter;



import express from "express";
import { authenticateVendor } from "../../middleware/auth.middleWare.js";
import {
    getIncompleteListing,
    publishListing,
    saveAmenities,
    saveBasicInformation,
    saveLocation,
    savePoliciesAndRules,
    savePropertyImages,
    saveRooms,
} from "../../controller/listing/listing.controller.js";
import uploadPropertyImages from "../../middleware/uploadPropertyImages.js";
// roomUpload.js is no longer used — rooms are now saved as plain JSON,
// referencing photos already uploaded in the /photos step. You can delete
// middleware/roomUpload.js once you've confirmed nothing else imports it.

const listingRouter = express.Router();

listingRouter.get("/continue-listing", authenticateVendor, getIncompleteListing);
listingRouter.post("/basic-information", authenticateVendor, saveBasicInformation);
listingRouter.post("/location", authenticateVendor, saveLocation);
// Cap raised from 5 -> 25: this is now the property's whole photo pool,
// not per-step limited uploads.
listingRouter.post("/photos", authenticateVendor, uploadPropertyImages.array("images", 25), savePropertyImages);
listingRouter.post("/amenities", authenticateVendor, saveAmenities);
listingRouter.post("/policies", authenticateVendor, savePoliciesAndRules);
listingRouter.post("/rooms", authenticateVendor, saveRooms); // JSON body, no multer
listingRouter.post("/publish", authenticateVendor, publishListing);

export default listingRouter;