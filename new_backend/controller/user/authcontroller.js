import bcrypt from "bcrypt";
import pool from "../../config/db.js";
// import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            country_code,
            password
        } = req.body;
        /* ===============================
           Validation
        =============================== */
        if (!first_name) {
            return res.status(422).json({
                success: false,
                message: "First name is required."
            });
        }
        if (!phone) {
            return res.status(422).json({
                success: false,
                message: "Phone number is required."
            });
        }
        if (!password) {
            return res.status(422).json({
                success: false,
                message: "Password is required."
            });
        }
        if (password.length < 6) {
            return res.status(422).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }
        /* ===============================
           Check Phone
        =============================== */
        const [phoneExists] = await pool.execute(
            `
            SELECT id
            FROM users
            WHERE phone=?
            LIMIT 1
            `,
            [phone]
        );
        if (phoneExists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number already registered."
            });
        }
        /* ==============================
           Check Emai
        =============================== */
        if (email) {
            const [emailExists] = await pool.execute(
                `
                SELECT id
                FROM users
                WHERE email=?
                LIMIT 1
                `,
                [email]
            );
            if (emailExists.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered."
                });
            }
        }

        /* ===============================
           Hash Password
        =============================== */
        const hashedPassword = await bcrypt.hash(password, 10);
        /* ===============================
           Insert User
        =============================== */

        const [result] = await pool.execute(
            `
            INSERT INTO users
            (
                first_name,
                last_name,
                email,
                phone,
                country_code,
                password
            )
            VALUES
            (
                ?,?,?,?,?,?
            )
            `,
            [
                first_name,
                last_name || null,
                email || null,
                phone,
                country_code || "+91",
                hashedPassword
            ]
        );

        /* ===============================
           Get User
        =============================== */
        
        const [rows] = await pool.execute(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                country_code,
                profile_image,
                status,
                created_at
            FROM users
            WHERE id=?
            LIMIT 1
            `,
            [result.insertId]
        );

        const user = rows[0];

        /* ===============================
           Generate JWT Tokens
        =============================== */

        const accessToken = jwt.sign(
            {
                id: user.id,
                phone: user.phone
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES
            }
        );

        const refreshToken = jwt.sign(
            {
                id: user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRES
            }
        );

        /* ===============================
           Save Refresh Token
        =============================== */

        await pool.execute(
            `
            INSERT INTO user_refresh_tokens
            (
                user_id,
                refresh_token,
                device_type,
                device_name,
                device_id,
                expires_at
            )
            VALUES
            (
                ?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY)
            )
            `,
            [
                user.id,
                refreshToken,
                "android",
                null,
                null
            ]
        );

        /* ===============================
           Response
        =============================== */

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            access_token: accessToken,
            refresh_token: refreshToken,
            user
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



export const login = async (req, res) => {
    try {
        const {
            email,
            phone,
            password,
            device_type,
            device_name,
            device_id
        } = req.body;
        if ((!email && !phone) || !password) {
            return res.status(422).json({
                success: false,
                message: "Email/Phone and password are required."
            });
        }
        /* ===========================
           Find Use
        =========================== */
        let sql = `
            SELECT *
            FROM users
            WHERE
        `;
        let params = [];
        if (email) {
            sql += " email=? LIMIT 1";
            params.push(email);
        } else {
            sql += " phone=? LIMIT 1";
            params.push(phone);
        }
        const [rows] = await pool.execute(sql, params);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }
        const user = rows[0];
        /* ==========================
           Status
        =========================== */
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked."
            });
        }
        /* ===========================
           Password
        =========================== */
        const match = await bcrypt.compare(
            password,
            user.password
        );
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }
        /* ===========================
           Update Login Time
        =========================== */
        await pool.execute(
            `
            UPDATE users
            SET last_login_at=NOW()
            WHERE id=?
            `,
            [
                user.id
            ]
        );
        /* ===========================
           JWT
        =========================== */
        const accessToken = jwt.sign(
            {
                id: user.id,
                phone: user.phone
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES
            }
        );
        const refreshToken = jwt.sign(
            {
                id: user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRES
            }
        );
        /* ===========================
           Save Refresh Toke
        =========================== */
        await pool.execute(
            `
            INSERT INTO user_refresh_tokens
            (
                user_id,
                refresh_token,
                device_type,
                device_name,
                device_id,
                expires_at
            )
            VALUES
            (
                ?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY)
            )
            `,
            [
                user.id,
                refreshToken,
                device_type || "android",
                device_name || null,
                device_id || null
            ]
        );

        /* ===========================
           Remove Passwor
        =========================== */
        delete user.password;
        /* ===========================
           Response
        =========================== */
        return res.json({
            success: true,
            message: "Login successful.",
            access_token: accessToken,
            refresh_token: refreshToken,
            user
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyMe = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                country_code,
                profile_image,
                status,
                created_at,
                last_login_at
            FROM users
            WHERE id=?
            LIMIT 1
            `,
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }
        return res.json({
            success: true,
            user: rows[0]
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};