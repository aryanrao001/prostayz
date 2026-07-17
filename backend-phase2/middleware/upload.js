import multer from "multer";
import fs from "fs";
import path from "path";

// Upload Directory
const uploadDir = "uploads/documents";

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    },
});

// Allowed File Types
const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF, JPG, JPEG and PNG files are allowed."
            ),
            false
        );
    }
};

// Multer Upload
const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

export default upload;