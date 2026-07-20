// import multer from "multer";
// import fs from "fs";
// import path from "path";

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const { property_id } = req.body;
//         if (!property_id) {
//             return cb(new Error("Property ID is required."));
//         }
//         const uploadPath = path.join(
//             "uploads",
//             "properties",
//             property_id.toString()
//         );
//         fs.mkdirSync(uploadPath, {
//             recursive: true
//         });
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const extension = path.extname(file.originalname);
//         const filename =
//             Date.now() +
//             "-" +
//             Math.round(Math.random() * 1e9) +
//             extension;
//         cb(null, filename);
//     }
// });
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only images are allowed."));
//     }
// };

// export default multer({
//     storage,
//     fileFilter,
//     limits: {
//         fileSize: 5 * 1024 * 1024,
//         files: 5
//     }
// });




import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { property_id } = req.body;
        if (!property_id) {
            return cb(new Error("Property ID is required."));
        }
        const uploadPath = path.join(
            "uploads",
            "properties",
            property_id.toString()
        );
        fs.mkdirSync(uploadPath, {
            recursive: true
        });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            extension;
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed."));
    }
};

export default multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        // This is now the vendor's whole photo pool for the property
        // (rooms pick from it afterwards), so the old cap of 5 is gone.
        files: 25
    }
});