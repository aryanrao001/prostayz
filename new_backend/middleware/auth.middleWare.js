import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const authenticateVendor = async (req, res, next) => {
    try {
        // Session not found
        if (!req.session || !req.session.vendorId) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }
        // Vendor lookup
        const [rows] = await pool.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                status
            FROM vendors
            WHERE id = ?
            LIMIT 1
            `,
            [req.session.vendorId]
        );
        if (!rows.length) {
            req.session.destroy(() => {});
            return res.status(401).json({
                success: false,
                message: "Vendor not found."
            });
        }
        const vendor = rows[0];
        if (vendor.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Vendor account is inactive."
            });
        }
        req.vendor = vendor;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


export const authenticateAdmin = async (req, res, next) => {
    try {
        // Session not found
        if (!req.session || !req.session.adminId) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        // Admin lookup
        const [rows] = await pool.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                status
            FROM admins
            WHERE id = ?
            LIMIT 1
            `,
            [
                req.session.adminId
            ]
        );
        if (!rows.length) {
            req.session.destroy(() => {});
            return res.status(401).json({
                success: false,
                message: "Admin not found."
            });
        }
        const admin = rows[0];
        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive."
            });
        }
        req.admin = admin;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};




export const authenticateUser = async (req, res, next) => {
    try {
        console.log("===== AUTH MIDDLEWARE =====");
        console.log("Headers:", req.headers);
        console.log("Authorization:", req.headers.authorization);

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("Authorization header missing or invalid");
            return res.status(401).json({
                success: false,
                message: "Unauthorized."
            });
        }

        const token = authHeader.split(" ")[1];

        console.log("Token:", token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded:", decoded);

        req.user = decoded;

        next();
    } catch (error) {
        console.log("JWT ERROR:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};