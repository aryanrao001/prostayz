import pool from "../../config/db.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                success: false,
                message: "Email and Password are required."
            });
        }
        const [rows] = await pool.query(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );
        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Admin not found."
            });
        }
        const admin = rows[0];
        if (admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Account is inactive."
            });
        }
        const match = await bcrypt.compare(
            password,
            admin.password
        );
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }
        // Store session
        req.session.adminId = admin.id;
        // Update last login details
        await pool.query(
            `UPDATE admins
             SET last_login_at = NOW(),
                 last_login_ip = ?
             WHERE id = ?`,
            [req.ip, admin.id]
        );
        // Remove sensitive fields
        delete admin.password;
        delete admin.remember_token;
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            admin
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


export const verify = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                country_code,
                profile_image,
                role,
                status,
                last_login_at
            FROM admins
            WHERE id = ?`,
            [req.session.adminId]
        );
        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: "Admin not found."
            });
        }
        return res.status(200).json({
            success: true,
            admin: rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

export const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Logout failed."
                });
            }
            res.clearCookie("vendor.sid"); // Change this later if you use a separate admin cookie
            return res.status(200).json({
                success: true,
                message: "Logout successful."
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};