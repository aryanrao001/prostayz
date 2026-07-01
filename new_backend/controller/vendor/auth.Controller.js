import bcrypt from "bcrypt";
import db from "../../config/db.js";

/**
 * Register Vendor
 */
export const register = async (req, res) => {
    try {

        const {
            first_name,
            last_name,
            email,
            phone,
            country_code,
            password,
            business_name
        } = req.body;

        if (!first_name || !last_name || !email || !phone || !password) {
            return res.status(422).json({
                success: false,
                message: "All required fields are mandatory."
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM vendors WHERE email=? OR phone=?",
            [email, phone]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "Vendor already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO vendors
            (
                first_name,
                last_name,
                email,
                phone,
                country_code,
                password,
                business_name,
                status
            )
            VALUES (?,?,?,?,?,?,?,?)`,
            [
                first_name,
                last_name,
                email,
                phone,
                country_code || "+91",
                hashedPassword,
                business_name || null,
                "active"
            ]
        );

        req.session.vendorId = result.insertId;

        return res.status(201).json({
            success: true,
            message: "Registration successful."
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

/**
 * Login Vendor
 */
export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(422).json({
                success: false,
                message: "Email and Password are required."
            });

        }

        const [rows] = await db.query(
            "SELECT * FROM vendors WHERE email=?",
            [email]
        );

        if (!rows.length) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found."
            });

        }

        const vendor = rows[0];

        if (vendor.status !== "active") {

            return res.status(403).json({
                success: false,
                message: "Account inactive."
            });

        }

        const match = await bcrypt.compare(
            password,
            vendor.password
        );

        if (!match) {

            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });

        }

        req.session.vendorId = vendor.id;

        delete vendor.password;
        delete vendor.otp;
        delete vendor.remember_token;

        return res.json({
            success: true,
            message: "Login successful.",
            vendor
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};